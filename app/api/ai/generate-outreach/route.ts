import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { generateText } from '@/lib/ai/client'

export async function POST(request: NextRequest) {
  try {
    const { contacts } = await request.json()

    if (!contacts || !Array.isArray(contacts)) {
      return NextResponse.json({ error: 'Contacts array required' }, { status: 400 })
    }

    const supabase = await createClient()
    const serviceSupabase = createServiceClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get profile and settings
    const { data: profile } = await serviceSupabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    const { data: settings } = await serviceSupabase
      .from('settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Generate outreach for each contact
    const results = []

    for (const contact of contacts.slice(0, 10)) {
      // Get or create outreach target
      const { data: target } = await serviceSupabase
        .from('outreach_targets')
        .select('*')
        .eq('user_id', user.id)
        .eq('email', contact.email)
        .single()

      if (!target) continue

      // Generate personalized message
      const systemPrompt = 'You are a professional email copywriter specializing in B2B outreach.'
      const userPrompt = `Write a personalized cold outreach email for a ${profile.trade} business. 
      
Recipient: ${contact.name}${contact.city ? ` in ${contact.city}` : ''}
Business: ${profile.business_name}
Service Area: ${profile.service_area}

Write a friendly, personalized email that:
- Introduces the business
- Mentions their location if available
- Offers value
- Has a clear call to action
- Is concise (3-4 sentences)

Tone: Professional but friendly`

      try {
        const emailContent = await generateText(systemPrompt, userPrompt, {
          maxTokens: 200,
          temperature: 0.7,
        })

        // Update target status
        await serviceSupabase
          .from('outreach_targets')
          .update({ status: 'sent' })
          .eq('id', target.id)

        // TODO: Send email via Resend
        // For now, we'll just mark as sent

        results.push({
          target: target.id,
          email: contact.email,
          content: emailContent,
        })
      } catch (error) {
        console.error(`Error generating outreach for ${contact.email}:`, error)
        await serviceSupabase
          .from('outreach_targets')
          .update({ status: 'failed' })
          .eq('id', target.id)
      }
    }

    return NextResponse.json({ success: true, results })
  } catch (error: any) {
    console.error('Error generating outreach:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

