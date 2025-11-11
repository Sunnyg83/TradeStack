import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, name, email, phone, service_requested, message } = body

    if (!user_id || !name || !email) {
      return NextResponse.json(
        { error: 'user_id, name, and email are required' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Create lead
    const { data: lead, error } = await supabase
      .from('leads')
      .insert({
        user_id,
        name,
        email,
        phone: phone || null,
        service_requested: service_requested || null,
        message: message || null,
        status: 'new',
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 })
    }

    // Trigger AI message generation (async)
    // We'll call this in the background
    fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai/generate-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadId: lead.id, type: 'initial' }),
    }).catch((err) => console.error('Error triggering AI message:', err))

    return NextResponse.json({ lead })
  } catch (error: any) {
    console.error('Error creating lead:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}



