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
    
    // Check for missing or placeholder values
    const isProduction = process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production'
    const missing = []
    const invalid = []
    
    if (!plaidClientId || plaidClientId === 'your_client_id_here' || plaidClientId.length < 10) {
      if (!plaidClientId) {
        missing.push('PLAID_CLIENT_ID')
      } else {
        invalid.push('PLAID_CLIENT_ID (appears to be placeholder or invalid)')
      }
    }
    
    if (!plaidSecret || plaidSecret === 'your_sandbox_secret_here' || plaidSecret.length < 20) {
      if (!plaidSecret) {
        missing.push('PLAID_SECRET')
      } else {
        invalid.push('PLAID_SECRET (appears to be placeholder or invalid)')
      }
    }
    
    if (missing.length > 0 || invalid.length > 0) {
      const errorMessage = isProduction
        ? `Plaid is not configured in production. Please add your Plaid environment variables in Vercel:\n\n` +
          `1. Go to your Vercel project settings\n` +
          `2. Navigate to Environment Variables\n` +
          `3. Add the following variables:\n` +
          `   - PLAID_CLIENT_ID: Your Plaid Client ID\n` +
          `   - PLAID_SECRET: Your Plaid ${plaidEnv === 'production' ? 'Production' : 'Sandbox'} Secret\n` +
          `   - PLAID_ENV: ${plaidEnv}\n\n` +
          `Get your keys from: https://dashboard.plaid.com → Team Settings → Keys\n\n` +
          `Missing: ${missing.join(', ')}\n` +
          (invalid.length > 0 ? `Invalid: ${invalid.join(', ')}\n` : '') +
          `\nAfter adding, redeploy your application.`
        : `Plaid is not configured. Please add your Plaid keys to .env.local:\n\nMissing: ${missing.join(', ')}\n` +
          (invalid.length > 0 ? `Invalid: ${invalid.join(', ')}\n` : '') +
          `\nGet your keys from: https://dashboard.plaid.com → Team Settings → Keys`
      
      console.error('Plaid configuration error:', {
        missing,
        invalid,
        isProduction,
        plaidEnv,
        hasClientId: !!plaidClientId,
        hasSecret: !!plaidSecret,
        clientIdLength: plaidClientId?.length || 0,
        secretLength: plaidSecret?.length || 0,
      })
      
      return NextResponse.json(
        { 
          error: errorMessage,
          missing_keys: missing,
          invalid_keys: invalid,
          environment: isProduction ? 'production' : 'development',
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
      const plaidErrorCode = plaidErrorData.error_code || plaidErrorData.error?.error_code
      
      // Enhanced logging for production debugging
      const isProduction = process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production'
      console.error('Plaid API error details:', {
        message: plaidErrorMessage,
        error_code: plaidErrorCode,
        error_data: plaidErrorData,
        status: plaidError?.response?.status || plaidError?.statusCode,
        environment: isProduction ? 'production' : 'development',
        plaid_env: plaidEnv,
        has_client_id: !!plaidClientId,
        has_secret: !!plaidSecret,
        client_id_prefix: plaidClientId?.substring(0, 5) + '...' || 'none',
        secret_prefix: plaidSecret ? '***' + plaidSecret.substring(plaidSecret.length - 4) : 'none',
      })

      // Special handling for INVALID_API_KEYS error
      if (plaidErrorCode === 'INVALID_API_KEYS' || plaidErrorMessage?.includes('invalid client_id or secret')) {
        const errorMessage = isProduction
          ? `Plaid API keys are invalid in production. Please verify your environment variables in Vercel:\n\n` +
            `1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables\n` +
            `2. Verify these variables are set correctly:\n` +
            `   - PLAID_CLIENT_ID: Must be your actual Plaid Client ID\n` +
            `   - PLAID_SECRET: Must be your Plaid ${plaidEnv === 'production' ? 'Production' : 'Sandbox'} Secret (not the other environment's secret)\n` +
            `   - PLAID_ENV: Currently set to "${plaidEnv}"\n\n` +
            `Important: If PLAID_ENV is set to "production", you MUST use Production secrets.\n` +
            `If PLAID_ENV is set to "sandbox", you MUST use Sandbox secrets.\n\n` +
            `Get your keys from: https://dashboard.plaid.com → Team Settings → Keys\n\n` +
            `After updating, redeploy your application.`
          : `Plaid API keys are invalid. Please check your .env.local file:\n\n` +
            `- PLAID_CLIENT_ID: Must be your actual Plaid Client ID\n` +
            `- PLAID_SECRET: Must match your PLAID_ENV setting (${plaidEnv === 'production' ? 'Production' : 'Sandbox'} Secret)\n` +
            `- PLAID_ENV: Currently set to "${plaidEnv}"\n\n` +
            `Get your keys from: https://dashboard.plaid.com → Team Settings → Keys`
        
        return NextResponse.json(
          { 
            error: errorMessage,
            error_code: plaidErrorCode,
            error_type: plaidErrorData.error_type || 'INVALID_INPUT',
            details: {
              ...plaidErrorData,
              plaid_env: plaidEnv,
              hint: plaidEnv === 'production' 
                ? 'Make sure you are using Production secrets, not Sandbox secrets'
                : 'Make sure you are using Sandbox secrets, not Production secrets',
            },
          },
          { status: 400 }
        )
      }

      // Return detailed error for other Plaid errors
      return NextResponse.json(
        { 
          error: `Plaid API error: ${plaidErrorMessage}`,
          error_code: plaidErrorCode,
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

