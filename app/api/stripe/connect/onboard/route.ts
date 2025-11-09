import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

// Initialize Stripe client for Connect onboarding
// Note: Stripe Connect must be enabled in your Stripe Dashboard before users can connect
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-10-29.clover',
})

export async function GET(request: NextRequest) {
  try {
    console.log('[Stripe Connect] Starting onboarding request...')
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      console.error('[Stripe Connect] Auth error:', authError)
      return NextResponse.json({ error: 'Authentication error', error_code: 'AUTH_ERROR' }, { status: 401 })
    }

    if (!user) {
      console.error('[Stripe Connect] No user found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[Stripe Connect] User authenticated:', user.id, user.email)

    // Get user profile - try with all columns first to check if profile exists
    const { data: profileCheck, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (checkError) {
      // Check if it's a "not found" error (PGRST116) or other error
      if (checkError.code === 'PGRST116' || checkError.message?.includes('No rows') || checkError.message?.includes('not found')) {
        return NextResponse.json({ 
          error: 'Profile not found. Please complete your onboarding first by visiting /onboarding',
          needs_onboarding: true,
        }, { status: 404 })
      }
      console.error('Error checking profile existence:', {
        code: checkError.code,
        message: checkError.message,
        details: checkError.details,
        hint: checkError.hint,
      })
      return NextResponse.json({ 
        error: `Unable to access your profile: ${checkError.message || 'Unknown error'}. Please try again or contact support.`,
        error_code: checkError.code,
      }, { status: 500 })
    }

    // Now get the profile with Stripe fields (may not exist yet, that's OK)
    // Use a more permissive query that handles missing columns gracefully
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_account_id, stripe_account_status')
      .eq('user_id', user.id)
      .maybeSingle() // Use maybeSingle instead of single to handle missing rows gracefully

    if (profileError) {
      // If there's an error that's not about missing columns, log it
      console.error('Error fetching profile Stripe fields:', {
        code: profileError.code,
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint,
      })
      // If it's a column error, the migration might not have run
      if (profileError.message?.includes('column') || profileError.message?.includes('does not exist')) {
        return NextResponse.json({ 
          error: 'Database migration required. Please run the Stripe Connect migration (04_stripe_connect.sql) in your Supabase database.',
          error_code: profileError.code,
          needs_migration: true,
        }, { status: 500 })
      }
      return NextResponse.json({ 
        error: `Error accessing profile: ${profileError.message || 'Unknown error'}. Please try again.`,
        error_code: profileError.code,
      }, { status: 500 })
    }

    // If profile doesn't have Stripe fields yet, that's OK - we'll create them
    const stripeAccountId = profile?.stripe_account_id || null
    const stripeAccountStatus = profile?.stripe_account_status || null

    // If user already has a connected account, return it
    if (stripeAccountId && stripeAccountStatus === 'active') {
      return NextResponse.json({
        connected: true,
        account_id: stripeAccountId,
        status: stripeAccountStatus,
      })
    }

    // Create Stripe Connect account (Express account)
    let account
    try {
      account = await stripe.accounts.create({
        type: 'express',
        country: 'US', // You can make this dynamic based on user location
        email: user.email || undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      })
    } catch (stripeError: any) {
      // Check if Stripe Connect is not enabled
      if (stripeError.message?.includes('signed up for Connect') || stripeError.message?.includes('Connect')) {
        console.error('Stripe Connect not enabled:', stripeError.message)
        return NextResponse.json({
          error: 'Stripe Connect is not enabled in your Stripe account. Please enable Stripe Connect in your Stripe Dashboard (Settings → Connect) and try again.',
          needs_stripe_connect_enabled: true,
          stripe_error: stripeError.message,
        }, { status: 400 })
      }
      
      // Check if platform profile needs to be completed
      if (stripeError.message?.includes('review the responsibilities') || stripeError.message?.includes('platform-profile')) {
        console.error('Platform profile not completed:', stripeError.message)
        return NextResponse.json({
          error: 'You need to complete your Stripe Connect platform profile. Please review and acknowledge the responsibilities in your Stripe Dashboard.',
          needs_platform_profile: true,
          platform_profile_url: 'https://dashboard.stripe.com/settings/connect/platform-profile',
          stripe_error: stripeError.message,
        }, { status: 400 })
      }
      
      throw stripeError
    }

    // Create account link for onboarding
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${origin}/dashboard/settings?stripe_refresh=true`,
      return_url: `${origin}/dashboard/settings?stripe_success=true`,
      type: 'account_onboarding',
    })

    // Save account ID to profile
    await supabase
      .from('profiles')
      .update({
        stripe_account_id: account.id,
        stripe_account_status: 'pending',
      })
      .eq('user_id', user.id)

    return NextResponse.json({
      connected: false,
      account_id: account.id,
      onboarding_url: accountLink.url,
      status: 'pending',
    })
  } catch (error: any) {
    console.error('Error creating Stripe Connect account:', error)
    
    // Check if it's a Stripe Connect not enabled error
    if (error.message?.includes('signed up for Connect') || error.message?.includes('Connect')) {
      return NextResponse.json({
        error: 'Stripe Connect is not enabled in your Stripe account. Please enable Stripe Connect in your Stripe Dashboard (Settings → Connect) and try again.',
        needs_stripe_connect_enabled: true,
        stripe_error: error.message,
      }, { status: 400 })
    }
    
    // Check if platform profile needs to be completed
    if (error.message?.includes('review the responsibilities') || error.message?.includes('platform-profile')) {
      return NextResponse.json({
        error: 'You need to complete your Stripe Connect platform profile. Please review and acknowledge the responsibilities in your Stripe Dashboard.',
        needs_platform_profile: true,
        platform_profile_url: 'https://dashboard.stripe.com/settings/connect/platform-profile',
        stripe_error: error.message,
      }, { status: 400 })
    }
    
    // Always return proper JSON with error details
    const errorMessage = error?.message || 'Failed to create Stripe account'
    const errorType = error?.type || 'UNKNOWN_ERROR'
    const errorStatus = error?.statusCode || 500
    
    console.error('[Stripe Connect] Full error details:', {
      message: errorMessage,
      type: errorType,
      statusCode: errorStatus,
      error: error,
    })
    
    return NextResponse.json(
      { 
        error: errorMessage,
        error_type: errorType,
        error_code: errorStatus,
        details: error?.stack || 'No additional details available'
      },
      { status: errorStatus >= 400 && errorStatus < 600 ? errorStatus : 500 }
    )
  }
}

