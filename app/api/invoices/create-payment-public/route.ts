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

    // Get invoice (public access - no auth required)
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*, user_id')
      .eq('id', invoice_id)
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
      .eq('user_id', invoice.user_id)
      .single()

    // Check if user has connected Stripe account (REQUIRED for receiving payments)
    if (!profile?.stripe_account_id) {
      return NextResponse.json(
        { 
          error: 'Payment processing is not available for this invoice. Please contact the business owner.',
        },
        { status: 400 }
      )
    }

    // Verify Stripe account is active and can receive payments
    try {
      const account = await stripe.accounts.retrieve(profile.stripe_account_id)
      
      if (!account.charges_enabled) {
        return NextResponse.json(
          { 
            error: 'Payment processing is not available for this invoice. Please contact the business owner.',
          },
          { status: 400 }
        )
      }
    } catch (stripeError: any) {
      console.error('Error verifying Stripe account:', stripeError)
      return NextResponse.json(
        { 
          error: 'Payment processing is not available for this invoice. Please contact the business owner.',
        },
        { status: 400 }
      )
    }

    // Determine redirect URL
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const successUrl = `${origin}/pay-invoice/${invoice_id}?payment=success&session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${origin}/pay-invoice/${invoice_id}?payment=cancelled`

    // Create Stripe Checkout Session with destination charge
    // Payments go DIRECTLY to invoice owner's Stripe Connect account (not platform account)
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
        user_id: invoice.user_id,
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

    // Create payment record (using service client for public access)
    const { createServiceClient } = await import('@/lib/supabase/service')
    const serviceSupabase = createServiceClient()

    const { error: paymentError } = await serviceSupabase
      .from('payments')
      .insert({
        invoice_id: invoice.id,
        user_id: invoice.user_id,
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

    // Update invoice with payment intent ID (using service client)
    await serviceSupabase
      .from('invoices')
      .update({
        stripe_payment_intent_id: session.payment_intent as string,
        status: invoice.status === 'draft' ? 'sent' : invoice.status,
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

