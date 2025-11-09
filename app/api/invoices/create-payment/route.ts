import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-10-29.clover',
})

export async function POST(request: NextRequest) {
  try {
    const { invoice_id } = await request.json()

    if (!invoice_id) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoice_id)
      .eq('user_id', user.id)
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    if (invoice.status === 'paid') {
      return NextResponse.json({ error: 'Invoice already paid' }, { status: 400 })
    }

    // Get user profile for Stripe Connect account
    const { data: profile } = await supabase
      .from('profiles')
      .select('business_name, stripe_account_id, stripe_account_status')
      .eq('user_id', user.id)
      .single()

    // Check if user has connected Stripe account (REQUIRED for receiving payments)
    if (!profile?.stripe_account_id) {
      return NextResponse.json(
        { 
          error: 'Payment account not set up. Please connect your Stripe account in Settings to receive payments.',
          needs_stripe_connect: true,
        },
        { status: 400 }
      )
    }

    // Verify Stripe account is active and can receive payments
    try {
      const account = await stripe.accounts.retrieve(profile.stripe_account_id)
      
      // Check if account can receive payments
      if (!account.charges_enabled) {
        return NextResponse.json(
          { 
            error: 'Payment account not ready. Please complete the Stripe Connect onboarding in Settings to enable payments.',
            needs_stripe_connect: true,
          },
          { status: 400 }
        )
      }

      // Update status if account is now active
      if (account.details_submitted && account.charges_enabled && profile.stripe_account_status !== 'active') {
        await supabase
          .from('profiles')
          .update({ stripe_account_status: 'active' })
          .eq('user_id', user.id)
      }
    } catch (stripeError: any) {
      console.error('Error verifying Stripe account:', stripeError)
      return NextResponse.json(
        { 
          error: 'Unable to verify payment account. Please check your Stripe Connect setup in Settings.',
          needs_stripe_connect: true,
        },
        { status: 400 }
      )
    }

    // Determine redirect URL based on where payment was initiated
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const referer = request.headers.get('referer') || ''
    const isPublicPage = referer.includes('/pay-invoice/')
    
    const successUrl = isPublicPage 
      ? `${origin}/pay-invoice/${invoice_id}?payment=success&session_id={CHECKOUT_SESSION_ID}`
      : `${origin}/dashboard/invoices?payment=success&session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = isPublicPage
      ? `${origin}/pay-invoice/${invoice_id}?payment=cancelled`
      : `${origin}/dashboard/invoices?payment=cancelled`

    // Create Stripe Checkout Session with destination charge
    // Payments go DIRECTLY to user's Stripe Connect account (not platform account)
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: invoice.currency.toLowerCase() || 'usd',
            product_data: {
              name: `Invoice ${invoice.invoice_number}`,
              description: invoice.description || `Invoice for ${invoice.client_name}`,
            },
            unit_amount: Math.round(invoice.total_amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: invoice_id,
      metadata: {
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
        user_id: user.id,
      },
      customer_email: invoice.client_email || undefined,
      // Route payment directly to user's Stripe Connect account (destination charge)
      // Money goes DIRECTLY to user's Stripe account, not through platform account
      payment_intent_data: {
        transfer_data: {
          destination: profile.stripe_account_id,
        },
      },
    })

    // Create payment record
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        invoice_id: invoice.id,
        user_id: user.id,
        amount: invoice.total_amount,
        currency: invoice.currency,
        stripe_payment_intent_id: session.payment_intent as string,
        status: 'pending',
        metadata: {
          checkout_session_id: session.id,
        },
      })

    if (paymentError) {
      console.error('Error creating payment record:', paymentError)
    }

    // Update invoice with payment intent ID
    await supabase
      .from('invoices')
      .update({
        stripe_payment_intent_id: session.payment_intent as string,
        status: 'sent',
      })
      .eq('id', invoice.id)

    return NextResponse.json({
      checkout_url: session.url,
      session_id: session.id,
    })
  } catch (error: any) {
    console.error('Error creating payment:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create payment' },
      { status: 500 }
    )
  }
}

