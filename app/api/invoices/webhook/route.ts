import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-10-29.clover',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

// Disable body parsing for webhooks (Stripe needs raw body)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 })
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message)
      return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
    }

    const supabase = await createClient()

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        if (session.payment_status === 'paid' && session.client_reference_id) {
          const invoiceId = session.client_reference_id

          // Get payment
          const { data: payment } = await supabase
            .from('payments')
            .select('*')
            .eq('invoice_id', invoiceId)
            .eq('stripe_payment_intent_id', session.payment_intent)
            .single()

          // Get invoice to get user_id
          const { data: invoice } = await supabase
            .from('invoices')
            .select('user_id, total_amount')
            .eq('id', invoiceId)
            .single()

          if (payment && invoice) {
            // Update payment status
            await supabase
              .from('payments')
              .update({
                status: 'succeeded',
                stripe_charge_id: session.payment_intent,
                transaction_id: session.id,
                metadata: {
                  ...payment.metadata,
                  checkout_session_id: session.id,
                  payment_status: session.payment_status,
                },
              })
              .eq('id', payment.id)

            // Update invoice status
            await supabase
              .from('invoices')
              .update({
                status: 'paid',
                paid_date: new Date().toISOString().split('T')[0],
              })
              .eq('id', invoiceId)

            // With Stripe Connect, payments go directly to user's Stripe account
            // Stripe automatically handles payouts to user's bank account
            // No manual payout needed - money goes directly to user!
            console.log('Payment successful - money went directly to user\'s Stripe Connect account:', {
              userId: invoice?.user_id,
              invoiceId,
              amount: invoice?.total_amount || payment.amount,
              note: 'Payment went directly to user\'s Stripe account. Stripe handles automatic payouts to their bank account.',
            })
          }
        }
        break
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        
        // Update payment record if exists
        const { data: payment } = await supabase
          .from('payments')
          .select('*')
          .eq('stripe_payment_intent_id', paymentIntent.id)
          .single()

        if (payment) {
          await supabase
            .from('payments')
            .update({
              status: 'succeeded',
              stripe_charge_id: paymentIntent.id,
            })
            .eq('id', payment.id)
        }
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        
        // Update payment record
        const { data: payment } = await supabase
          .from('payments')
          .select('*')
          .eq('stripe_payment_intent_id', paymentIntent.id)
          .single()

        if (payment) {
          await supabase
            .from('payments')
            .update({
              status: 'failed',
            })
            .eq('id', payment.id)
        }
        break
      }

      case 'account.updated': {
        // Handle Stripe Connect account updates
        const account = event.data.object as Stripe.Account
        
        // Update account status in database
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('stripe_account_id', account.id)
          .single()

        if (profile) {
          let status = 'pending'
          if (account.details_submitted && account.charges_enabled) {
            status = 'active'
          } else if (account.charges_enabled === false) {
            status = 'restricted'
          }

          await supabase
            .from('profiles')
            .update({
              stripe_account_status: status,
            })
            .eq('stripe_account_id', account.id)
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: error.message || 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

