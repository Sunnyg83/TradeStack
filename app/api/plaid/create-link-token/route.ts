import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid'

export async function POST(request: NextRequest) {
  try {
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

    // Get user profile for user ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Create link token
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    // Build link token request - start with minimal required fields
    const linkTokenRequest: any = {
      user: {
        client_user_id: user.id,
      },
      client_name: 'TradeStack',
      products: [Products.Auth, Products.Transactions],
      country_codes: [CountryCode.Us],
      language: 'en',
    }

    // Add redirect_uri (required for some flows, but may cause 400 if not registered in Plaid dashboard)
    // Try without redirect_uri first - if that works, the issue is redirect_uri registration
    // For sandbox mode, we can try without it first
    // linkTokenRequest.redirect_uri = `${origin}/dashboard/settings?plaid_success=true`

    // Don't include webhook for now - it's optional and may cause 400 errors if not registered
    // linkTokenRequest.webhook = `${origin}/api/plaid/webhook`

    try {
      const linkTokenResponse = await plaidClient.linkTokenCreate(linkTokenRequest)
      
      return NextResponse.json({
        link_token: linkTokenResponse.data.link_token,
      })
    } catch (plaidError: any) {
      // Get detailed Plaid error message
      const plaidErrorData = plaidError?.response?.data || plaidError?.body || {}
      const plaidErrorMessage = plaidErrorData.error_message || 
                                 plaidErrorData.error_code || 
                                 plaidError?.message || 
                                 'Unknown Plaid API error'
      
      console.error('Plaid API error details:', {
        message: plaidErrorMessage,
        error_data: plaidErrorData,
        status: plaidError?.response?.status || plaidError?.statusCode,
        full_error: plaidError,
      })

      // Return detailed error for debugging
      return NextResponse.json(
        { 
          error: `Plaid API error: ${plaidErrorMessage}`,
          error_code: plaidErrorData.error_code,
          error_type: plaidErrorData.error_type,
          details: plaidErrorData,
        },
        { status: plaidError?.response?.status || plaidError?.statusCode || 400 }
      )
    }
  } catch (error: any) {
    console.error('Error creating Plaid link token:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to create Plaid link token',
        details: error.stack,
      },
      { status: 500 }
    )
  }
}

