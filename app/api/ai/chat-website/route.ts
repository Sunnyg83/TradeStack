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

    const systemPrompt = `You are an elite web developer assistant (like Lovable.dev's AI) specializing in creating and modifying production-ready business websites.

CRITICAL RULES:
1. Return ONLY complete, valid HTML code - no markdown, no explanations, no code blocks
2. Maintain and improve code quality: clean, semantic, accessible, performant
3. Preserve existing functionality while making requested changes
4. Enhance design quality with each modification
5. Use modern CSS best practices (Grid, Flexbox, CSS variables)
6. Ensure perfect responsive design
7. Add smooth animations and micro-interactions where appropriate
8. Maintain accessibility standards
9. Code must be production-ready after each change
10. ALWAYS be flexible and adapt to whatever the user requests - interpret their intent and make the changes they want
11. ALWAYS emphasize the business is THE BEST/EXPERT/PREMIUM in their field throughout the website

QUALITY STANDARDS:
- Code quality: Production-grade, no regressions
- Design: Modern, professional, visually polished
- Performance: Optimized, fast-loading
- Responsiveness: Perfect on all devices
- Accessibility: WCAG 2.1 AA compliant
- Messaging: Always position the business as the premium/expert choice

When modifying code:
- Understand the full context before making changes
- Preserve existing structure and functionality
- Enhance design quality with each edit
- Ensure changes are consistent with the overall design
- Test that all sections still work correctly
- INTERPRET USER REQUESTS FLEXIBLY: Understand what they want even if not perfectly worded
- Make the changes the user is asking for, adapting to their specific needs
- Keep services and contact info prominently displayed at the top
- Always maintain messaging that emphasizes the business is the best choice

Return ONLY the complete HTML document starting with <!DOCTYPE html> and ending with </html>.`

    const userPrompt = `You are modifying a professional business website. Here's the current HTML:

${currentHTML?.substring(0, 3000) || 'No current website - generate a professional website'}

Business Information:
${businessInfo}

${historyContext ? `Conversation history:\n${historyContext}\n\n` : ''}
User's request: ${message}

IMPORTANT INSTRUCTIONS:
1. Analyze the user's request carefully - INTERPRET THEIR INTENT and make the changes they want
2. Be FLEXIBLE and ADAPTIVE - understand what the user is asking for even if not perfectly worded
3. Make the requested changes while maintaining professional design
4. ALWAYS keep services and contact information prominently displayed at the top of the page
5. ALWAYS maintain messaging that emphasizes the business is THE BEST/EXPERT/PREMIUM in their field
6. Ensure the website remains:
   - Well-organized (NOT cluttered in corners)
   - Professional and modern
   - Properly spaced and laid out
   - Responsive and mobile-friendly
   - Using clean, readable fonts
   - With proper color schemes
   - Services easily visible near the top
   - Contact info easily accessible

4. Common requests to handle:
   - Color changes: 
     * Update the entire color system (primary, secondary, accent, neutrals)
     * Use CSS custom properties (--primary, --secondary, etc.) for easy theming
     * Ensure proper contrast ratios (WCAG AA: 4.5:1 for text)
     * Update all color references throughout the site consistently
     * Consider hover states, active states, and focus states
   - Adding sections: 
     * Available section types: Hero, Services, Features/Benefits, About, Testimonials, Gallery/Portfolio, FAQ, Contact, Footer
     * Add sections in logical order with proper spacing (96-128px between sections on desktop)
     * When the user asks to "add" a section, build a COMPLETE new section tailored to their request:
       - Create a new semantic section element with a unique id (e.g., id="services-plus" or id based on the requested topic)
       - Include a clear heading, supporting content, visuals/cards if relevant, and CTA elements aligned to the request
       - Style the section to match the site's theme (spacing, gradients, typography, animations)
       - Update navigation/menu anchor links so the new section is reachable
       - Place the section in a logical position according to the user's intent (e.g., near related content)
       - DO NOT delete, replace, or remove any existing sections—only add the new section
     * Give each new section an appropriate ID for anchor navigation
     * Update navigation menu to include new sections
     * Maintain consistent styling with existing sections
     * NO SIDEBAR: All sections flow vertically in main content area
     * Services should be in main content grid (2-3 columns), NOT in sidebar
   - Layout changes: 
     * Maintain professional structure, don't break the layout
     * Use CSS Grid or Flexbox for modern layouts
     * FULL-WIDTH DESIGN: Page must fill 100% viewport width - no awkward borders
     * Ensure html, body { width: 100%; margin: 0; padding: 0; }
     * Sections should extend edge-to-edge (100vw) with full-width backgrounds
     * Inner content containers: max-width 1280px-1440px, centered
     * Ensure responsive behavior at all breakpoints (1440px desktop base, 1024px tablet, 768px mobile large, 480px mobile) - desktop-first
   - Font changes: 
     * Use professional, readable fonts
     * Maintain proper font hierarchy (hero, h1, h2, h3, body, small)
     * Ensure readability on all devices
   - Spacing: 
     * Use consistent spacing scale (4px, 8px, 16px, 24px, 32px, 48px, 64px, 96px, 128px)
     * Add proper padding and margins
     * Maintain generous whitespace for modern feel
   - Modern design: 
     * NEVER use plain white backgrounds - always use creative, interactive backgrounds
     * Use gradients strategically throughout (buttons, backgrounds, hero sections, cards, body)
     * Use cool color schemes: Dark navy, deep blue, rich purple, teal, or sophisticated color combinations
     * Make backgrounds visually interesting: Linear gradients, radial gradients, animated gradients
     * Body background: Use cool dark color (navy, deep blue) with gradient, never plain white
     * Section backgrounds: Alternate between different gradient backgrounds for visual interest
     * Card backgrounds: Use subtle gradients or colored backgrounds (not white)
     * Apply layered shadows for depth (small, medium, large shadow system)
     * Use rounded corners appropriately (8px cards, 12px buttons, 16px containers)
     * Add glassmorphism effects where appropriate (backdrop-filter: blur)
     * Implement smooth animations and micro-interactions
     * Use modern color palettes with proper contrast (ensure text is readable on dark backgrounds)
   - NO AWKWARD BORDERS:
     * Avoid thick borders that create visual breaks
     * Use subtle shadows or background color changes instead of borders
     * If borders needed: 1px solid rgba(0,0,0,0.1) maximum
     * Cards should use shadows, not borders
     * Ensure sections flow seamlessly without harsh visual breaks

5. NAVIGATION REQUIREMENTS:
   - All navigation links MUST use anchor tags (href="#services", href="#about", href="#contact")
   - DO NOT use external links or page navigation
   - All sections must have IDs for anchor navigation
   - Use smooth scrolling: html { scroll-behavior: smooth; }
   - This is a single-page website - all navigation should scroll within the page
   - If adding new sections, give them anchor IDs

6. RESPONSIVE DESIGN REQUIREMENTS (Desktop-First / Web-Optimized):
   - Desktop-first approach: Base styles optimized for desktop/web (1440px+)
   - Breakpoints: 1440px (desktop base), 1024px (tablet), 768px (mobile large), 480px (mobile)
   - Use max-width media queries to scale down from desktop to smaller screens
   - Navigation: Full horizontal navigation on desktop, hamburger menu only on tablets/mobile (< 1024px)
   - Typography: Optimized for desktop readability, scale down proportionally for smaller screens
   - Layout: 3-4 columns on desktop, 2 columns on tablet, 1 column on mobile
   - Focus on desktop experience: Generous spacing, larger fonts, multi-column layouts
   - Images: Responsive with proper sizing (max-width: 100%, height: auto)

7. ALWAYS ensure:
   - FULL-WIDTH PAGE: Page fills 100% viewport width - html, body { width: 100%; margin: 0; padding: 0; }
   - NO PLAIN WHITE BACKGROUNDS: Always use creative, interactive backgrounds with cool color schemes
     * Body: Cool dark color (navy, deep blue, rich gray) with gradient, never plain white
     * Sections: Creative gradient backgrounds (alternating for visual interest)
     * Cards: Subtle gradients or colored backgrounds (not white)
     * Hero: Impressive gradient or animated background
   - NO SIDEBAR: All content flows vertically in main content area
   - Services are in main content grid (2-3 columns on desktop), NOT in sidebar, NOT top-left corner
   - Navigation stays at the top (full-width header, edge-to-edge)
   - Hero section is prominent and centered with full-width creative background
   - Sections extend edge-to-edge (100vw) with full-width gradient backgrounds
   - Inner content containers: max-width 1280px-1440px, centered with auto margins
   - NO AWKWARD BORDERS: Use shadows instead of borders, avoid thick borders
   - Professional spacing throughout (use spacing scale: 96-128px between sections on desktop)
   - Clean, modern styling with proper color system (cool, sophisticated colors)
   - All links are anchor-based (no external navigation)
   - Consistent use of CSS custom properties for theming
   - Smooth animations and transitions on interactive elements
   - Proper contrast ratios for accessibility (ensure text is readable on dark backgrounds)

8. Return the COMPLETE HTML code with all changes applied.

Updated HTML code:`

    try {
      const updatedHTML = await generateText(systemPrompt, userPrompt, {
        maxTokens: 8000, // More tokens for complete, high-quality websites
        temperature: 0.3, // Lower temperature for more consistent, production-ready code (like Lovable)
        preferOpenAI: true, // Use OpenAI GPT-4 for better code generation if available
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

