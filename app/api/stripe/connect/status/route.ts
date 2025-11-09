import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-10-29.clover',
})

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_account_id, stripe_account_status')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (!profile.stripe_account_id) {
      return NextResponse.json({
        connected: false,
        status: 'not_connected',
      })
    }

    // Check account status with Stripe
    try {
      const account = await stripe.accounts.retrieve(profile.stripe_account_id)
      
      // Update status in database if changed
      if (account.details_submitted && account.charges_enabled) {
        if (profile.stripe_account_status !== 'active') {
          await supabase
            .from('profiles')
            .update({ stripe_account_status: 'active' })
            .eq('user_id', user.id)
        }
        return NextResponse.json({
          connected: true,
          account_id: profile.stripe_account_id,
          status: 'active',
          details_submitted: account.details_submitted,
          charges_enabled: account.charges_enabled,
        })
      } else {
        return NextResponse.json({
          connected: false,
          account_id: profile.stripe_account_id,
          status: 'pending',
          details_submitted: account.details_submitted,
          charges_enabled: account.charges_enabled,
        })
      }
    } catch (stripeError: any) {
      console.error('Error checking Stripe account:', stripeError)
      return NextResponse.json({
        connected: false,
        status: 'error',
        error: stripeError.message,
      })
    }
  } catch (error: any) {
    console.error('Error checking Stripe Connect status:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to check Stripe status' },
      { status: 500 }
    )
  }
}

