import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Plaid webhook handler (for account updates, etc.)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Handle different webhook event types
    // For now, just log them
    console.log('Plaid webhook received:', body.webhook_type, body.webhook_code)

    // You can handle various webhook events here:
    // - ITEM_ERROR: Account connection error
    // - AUTH: Bank account verification updates
    // - TRANSACTIONS: Transaction updates
    // etc.

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Error processing Plaid webhook:', error)
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

