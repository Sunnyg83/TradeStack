import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateText } from '@/lib/ai/client'

export async function POST(request: NextRequest) {
  try {
    const { message, currentHTML, conversationHistory } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile and services
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const { data: services } = await supabase
      .from('services')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    const { data: websiteSettings } = await supabase
      .from('website_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Build context
    const servicesList = services?.map(s => {
      const price = s.base_price ? `$${s.base_price.toFixed(2)}` : 'Contact for pricing'
      return `- ${s.name}${s.description ? `: ${s.description}` : ''} (${price})`
    }).join('\n') || 'No services listed'

    const businessInfo = `
Business Name: ${profile.business_name}
Trade: ${profile.trade}
Service Area: ${profile.service_area}
Phone: ${profile.phone || 'Not provided'}
Email: ${profile.email || 'Not provided'}
Brand Color: ${websiteSettings?.primary_color || profile.brand_color || '#1e3a8a'}
Services: ${servicesList}
`

    // Build conversation context
    const historyContext = conversationHistory?.slice(-5).map((msg: any) => 
      `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
    ).join('\n') || ''

    const systemPrompt = `You are an expert web developer assistant specializing in creating and modifying professional business websites. 
You understand modern web design principles and can make intelligent improvements to HTML/CSS/JavaScript code.
Always maintain professional design standards and ensure the website looks polished and modern.
Return ONLY the complete, valid HTML code without markdown formatting or explanations.`

    const userPrompt = `You are modifying a professional business website. Here's the current HTML:

${currentHTML?.substring(0, 3000) || 'No current website - generate a professional website'}

Business Information:
${businessInfo}

${historyContext ? `Conversation history:\n${historyContext}\n\n` : ''}
User's request: ${message}

IMPORTANT INSTRUCTIONS:
1. Analyze the user's request carefully
2. Make the requested changes while maintaining professional design
3. Ensure the website remains:
   - Well-organized (NOT cluttered in corners)
   - Professional and modern
   - Properly spaced and laid out
   - Responsive and mobile-friendly
   - Using clean, readable fonts
   - With proper color schemes

4. Common requests to handle:
   - Color changes: Update CSS colors throughout
   - Layout changes: Maintain professional structure, don't break the layout
   - Adding sections: Add them in appropriate places with proper spacing
   - Font changes: Use professional, readable fonts
   - Spacing: Add proper padding and margins
   - Modern design: Use gradients, shadows, rounded corners appropriately

5. NAVIGATION REQUIREMENTS:
   - All navigation links MUST use anchor tags (href="#services", href="#about", href="#contact")
   - DO NOT use external links or page navigation
   - All sections must have IDs for anchor navigation
   - Use smooth scrolling: html { scroll-behavior: smooth; }
   - This is a single-page website - all navigation should scroll within the page
   - If adding new sections, give them anchor IDs

6. ALWAYS ensure:
   - Navigation stays at the top (centered or full-width)
   - Hero section is prominent and centered
   - Services are in a grid/card layout (NOT top-left corner)
   - Professional spacing throughout
   - Clean, modern styling
   - All links are anchor-based (no external navigation)

7. Return the COMPLETE HTML code with all changes applied.

Updated HTML code:`

    try {
      const updatedHTML = await generateText(systemPrompt, userPrompt, {
        maxTokens: 6000,
        temperature: 0.7,
      })

      // Clean up the response
      let htmlCode = updatedHTML.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim()
      
      // Extract HTML if wrapped
      if (!htmlCode.trim().startsWith('<')) {
        const htmlMatch = htmlCode.match(/<[\s\S]*>/)
        if (htmlMatch) {
          htmlCode = htmlMatch[0]
        }
      }

      // Ensure smooth scrolling and anchor navigation
      if (htmlCode.includes('<head>') && !htmlCode.includes('scroll-behavior: smooth')) {
        htmlCode = htmlCode.replace(
          '</head>',
          `<style>html { scroll-behavior: smooth; }</style>
<script>
  document.addEventListener('DOMContentLoaded', function() {
    // Ensure all anchor links scroll within the page
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href && href !== '#' && href.startsWith('#')) {
          e.preventDefault();
          const target = document.querySelector(href);
          if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      });
    });
    // Prevent any external navigation
    document.querySelectorAll('a').forEach(link => {
      if (!link.getAttribute('href')?.startsWith('#')) {
        link.addEventListener('click', function(e) {
          if (!this.getAttribute('href')?.startsWith('mailto:') && !this.getAttribute('href')?.startsWith('tel:')) {
            e.preventDefault();
          }
        });
      }
    });
  });
</script>
</head>`
        )
      }

      // If no valid HTML found, return the original with modifications
      if (!htmlCode.includes('<html') && !htmlCode.includes('<body') && !htmlCode.includes('<!DOCTYPE')) {
        // Try to apply changes to existing HTML
        htmlCode = currentHTML || htmlCode
      }

      return NextResponse.json({ 
        html: htmlCode,
        message: 'Website updated successfully!'
      })
    } catch (aiError: any) {
      console.error('AI error:', aiError)
      return NextResponse.json(
        { error: aiError.message || 'Failed to update website' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error in chat-website:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

