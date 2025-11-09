import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-10-29.clover',
})

export async function POST(request: NextRequest) {
  try {
    const { public_token, account_id } = await request.json()

    if (!public_token) {
      return NextResponse.json({ error: 'Public token is required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if Plaid is configured (check for both missing and empty values)
    const plaidClientId = process.env.PLAID_CLIENT_ID?.trim()
    const plaidSecret = process.env.PLAID_SECRET?.trim()
    const plaidEnv = process.env.PLAID_ENV?.trim() || 'sandbox'
    
    if (!plaidClientId || !plaidSecret) {
      const missing = []
      if (!plaidClientId) missing.push('PLAID_CLIENT_ID')
      if (!plaidSecret) missing.push('PLAID_SECRET')
      
      return NextResponse.json(
        { 
          error: `Plaid is not configured. Please add your Plaid keys to .env.local:\n\nMissing: ${missing.join(', ')}\n\nGet your keys from: https://dashboard.plaid.com → Team Settings → Keys`,
          missing_keys: missing,
        },
        { status: 500 }
      )
    }

    // Initialize Plaid client with validated configuration
    const configuration = new Configuration({
      basePath: plaidEnv === 'production' 
        ? PlaidEnvironments.production 
        : PlaidEnvironments.sandbox,
      baseOptions: {
        headers: {
          'PLAID-CLIENT-ID': plaidClientId,
          'PLAID-SECRET': plaidSecret,
        },
      },
    })
    
    const plaidClient = new PlaidApi(configuration)

    // Exchange public token for access token
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token,
    })

    const accessToken = exchangeResponse.data.access_token
    const itemId = exchangeResponse.data.item_id

    // Get account information
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    })

    // Find the selected account
    const account = accountsResponse.data.accounts.find(acc => acc.account_id === account_id) 
      || accountsResponse.data.accounts[0]

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    // Get account numbers (for ACH and Stripe payouts)
    let accountNumber = ''
    let routingNumber = ''
    let accountMask = account.mask || ''

    try {
      const authResponse = await plaidClient.authGet({
        access_token: accessToken,
      })

      const authAccount = authResponse.data.numbers.ach.find(
        (num: any) => num.account_id === account_id
      ) || authResponse.data.numbers.ach[0]

      if (authAccount) {
        accountNumber = authAccount.account || ''
        routingNumber = authAccount.routing || ''
      }
    } catch (authError) {
      console.error('Error getting account numbers:', authError)
      // This is critical - we need account numbers for payouts
      return NextResponse.json(
        { error: 'Failed to retrieve bank account numbers. Please try connecting again.' },
        { status: 400 }
      )
    }

    if (!accountNumber || !routingNumber) {
      return NextResponse.json(
        { error: 'Bank account numbers not available. Please try a different account or contact support.' },
        { status: 400 }
      )
    }

    // Bank account details will be stored and used for Stripe payouts
    // Stripe payouts can be created directly using account/routing numbers

    // Save to database (including account and routing numbers for payouts)
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        plaid_access_token: accessToken,
        plaid_item_id: itemId,
        bank_account_id: account.account_id,
        bank_account_name: account.name,
        bank_account_mask: accountMask,
        bank_account_type: account.type || 'checking',
        bank_account_number: accountNumber, // Store for Stripe payouts
        bank_routing_number: routingNumber, // Store for Stripe payouts
        plaid_account_status: 'connected',
      })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Error saving Plaid account:', updateError)
      return NextResponse.json(
        { error: 'Failed to save bank account information' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      account: {
        id: account.account_id,
        name: account.name,
        mask: accountMask,
        type: account.type,
        account_number: accountNumber ? `****${accountNumber.slice(-4)}` : null,
        routing_number: routingNumber ? `****${routingNumber.slice(-4)}` : null,
      },
    })
  } catch (error: any) {
    console.error('Error exchanging Plaid token:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to connect bank account' },
      { status: 500 }
    )
  }
}

