import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateText } from '@/lib/ai/client'

export async function POST(request: NextRequest) {
  try {
    const { service, city, tone } = await request.json()

    if (!service || !city) {
      return NextResponse.json({ error: 'Service and city required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Generate ad content with Gemini
    const systemPrompt = 'You are a marketing copywriter specializing in local service businesses.'
    const userPrompt = `Generate ad content for a ${service} business in ${city}. Tone should be ${tone}. 

Create:
1. A short, catchy headline (max 60 characters)
2. Ad body text (2-3 sentences, compelling)
3. Facebook caption (engaging, with emoji if appropriate)
4. Nextdoor caption (neighborhood-focused, friendly)
5. Instagram caption (visual, engaging, with relevant hashtags)

Format as JSON with keys: headline, body, fb_caption, nextdoor_caption, instagram_caption`

    let content
    try {
      content = await generateText(systemPrompt, userPrompt, {
        maxTokens: 500,
        temperature: 0.8,
      })
    } catch (aiError: any) {
      console.error('Gemini API error:', aiError)
      return NextResponse.json(
        { 
          error: aiError.message || 'Failed to generate ad content. Please check your GEMINI_API_KEY in .env.local',
          details: process.env.NODE_ENV === 'development' ? aiError.message : undefined
        },
        { status: 500 }
      )
    }

    if (!content) {
      return NextResponse.json(
        { error: 'No content generated from AI' },
        { status: 500 }
      )
    }

    // Parse JSON response
    let adContent
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || content.match(/(\{[\s\S]*\})/)
      adContent = JSON.parse(jsonMatch ? jsonMatch[1] : content)
    } catch {
      // Fallback: create structured content from text
      const lines = content.split('\n').filter((l) => l.trim())
      adContent = {
        headline: lines[0] || `Professional ${service} in ${city}`,
        body: lines.slice(1, 3).join(' ') || `Looking for ${service} in ${city}? We provide reliable, professional service.`,
        fb_caption: lines[3] || `Need ${service} in ${city}? Contact us today!`,
        nextdoor_caption: lines[4] || `Hi neighbors! Offering ${service} services in ${city}. Local and reliable!`,
        instagram_caption: lines[5] || `${service} services in ${city} ✨ #${city.replace(/\s/g, '')} #${service.replace(/\s/g, '')}`,
      }
    }

    // Save to database
    const { data: template, error } = await supabase
      .from('ad_templates')
      .insert({
        user_id: user.id,
        service,
        city,
        headline: adContent.headline,
        body: adContent.body,
        fb_caption: adContent.fb_caption || null,
        nextdoor_caption: adContent.nextdoor_caption || null,
        instagram_caption: adContent.instagram_caption || null,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to save template' }, { status: 500 })
    }

    return NextResponse.json({ template })
  } catch (error: any) {
    console.error('Error generating ad:', error)
    
    // Provide more helpful error messages
    let errorMessage = error.message || 'Internal server error'
    if (error.message?.includes('GEMINI_API_KEY')) {
      errorMessage = 'AI service not configured. Please set GEMINI_API_KEY in your .env.local file. See GEMINI_SETUP.md for instructions.'
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

