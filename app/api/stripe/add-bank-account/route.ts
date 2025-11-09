import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-10-29.clover',
})

/**
 * Add user's bank account to Stripe for payouts
 * This creates an external account in Stripe that can receive payouts
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's bank account details from Plaid
    const { data: profile } = await supabase
      .from('profiles')
      .select('bank_account_number, bank_routing_number, bank_account_name, business_name, bank_account_type')
      .eq('user_id', user.id)
      .single()

    if (!profile?.bank_account_number || !profile?.bank_routing_number) {
      return NextResponse.json(
        { error: 'Bank account not connected via Plaid' },
        { status: 400 }
      )
    }

    // Create a bank account token (required by Stripe)
    // Note: In a real implementation, you'd use Stripe.js on the frontend to create tokens
    // For server-side, we'll use Stripe's API to create the external account directly
    
    try {
      // Add bank account as external account to Stripe
      // This allows Stripe to send payouts to this bank account
      const externalAccount = await stripe.accounts.createExternalAccount(
        '', // Empty string means adding to your main Stripe account
        {
          external_account: {
            object: 'bank_account',
            country: 'US',
            currency: 'usd',
            account_number: profile.bank_account_number,
            routing_number: profile.bank_routing_number,
            account_holder_name: profile.business_name || 'Account Holder',
            account_holder_type: 'individual',
          },
        } as any
      )

      // Save the external account ID for future payouts
      await supabase
        .from('profiles')
        .update({
          // Store Stripe external account ID if needed
          metadata: {
            stripe_external_account_id: (externalAccount as any).id,
          },
        })
        .eq('user_id', user.id)

      return NextResponse.json({
        success: true,
        external_account_id: (externalAccount as any).id,
        message: 'Bank account added to Stripe successfully',
      })
    } catch (error: any) {
      console.error('Error adding bank account to Stripe:', error)
      return NextResponse.json(
        { 
          error: 'Failed to add bank account to Stripe',
          details: error.message,
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to add bank account' },
      { status: 500 }
    )
  }
}

