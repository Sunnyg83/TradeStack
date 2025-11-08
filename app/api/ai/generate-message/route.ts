import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { generateText } from '@/lib/ai/client'

export async function POST(request: NextRequest) {
  try {
    const { leadId, type } = await request.json()

    if (!leadId) {
      return NextResponse.json({ error: 'Lead ID required' }, { status: 400 })
    }

    const supabase = await createClient()
    const serviceSupabase = createServiceClient()

    // Get lead
    const { data: lead, error: leadError } = await serviceSupabase
      .from('leads')
      .select('*, profiles(*)')
      .eq('id', leadId)
      .single()

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // Get profile and settings
    const profile = lead.profiles
    const { data: settings } = await serviceSupabase
      .from('settings')
      .select('*')
      .eq('user_id', profile.user_id)
      .single()

    // Get previous messages for context
    const { data: previousMessages } = await serviceSupabase
      .from('lead_messages')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: true })

    // Build prompt
    const promptTemplate =
      settings?.ai_prompt_template ||
      `You are a friendly ${profile.trade} professional. Write a warm, professional message to a lead who inquired about {service}. Be concise and ask about their timeline.`

    let prompt = promptTemplate
      .replace('{trade}', profile.trade)
      .replace('{service}', lead.service_requested || 'our services')
      .replace('{name}', lead.name)

    if (type === 'followup' && previousMessages && previousMessages.length > 0) {
      const conversationHistory = previousMessages
        .map((m) => `${m.role === 'ai' ? 'You' : 'Lead'}: ${m.content}`)
        .join('\n')

      prompt = `Previous conversation:\n${conversationHistory}\n\nGenerate a follow-up message that continues the conversation naturally. Be helpful and ask if they need more information.`
    }

    // Generate message with Gemini
    const systemPrompt = `You are a helpful assistant for a ${profile.trade} business. Write professional, friendly messages.`
    const aiMessage = await generateText(systemPrompt, prompt, {
      maxTokens: 200,
      temperature: 0.7,
    })

    if (!aiMessage) {
      return NextResponse.json({ error: 'Failed to generate message' }, { status: 500 })
    }

    // Save message
    const { data: message, error: messageError } = await serviceSupabase
      .from('lead_messages')
      .insert({
        lead_id: leadId,
        role: 'ai',
        content: aiMessage,
      })
      .select()
      .single()

    if (messageError) {
      return NextResponse.json({ error: 'Failed to save message' }, { status: 500 })
    }

    // Update lead status if it's the first message
    if (type === 'initial') {
      await serviceSupabase
        .from('leads')
        .update({ status: 'contacted' })
        .eq('id', leadId)
    }

    // TODO: Send email via Resend
    // For now, we'll just store the message

    return NextResponse.json({ message })
  } catch (error: any) {
    console.error('Error generating message:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

