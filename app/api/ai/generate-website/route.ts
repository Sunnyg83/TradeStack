import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateText } from '@/lib/ai/client'

export async function POST(request: NextRequest) {
  try {
    const { prompt, pageTitle, generateFullWebsite } = await request.json()

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found. Please complete your profile first.' }, { status: 404 })
    }

    // Get user's services
    const { data: services } = await supabase
      .from('services')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    // Get website settings for colors
    const { data: websiteSettings } = await supabase
      .from('website_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Build business information context
    const servicesList = services?.map(s => {
      const price = s.base_price ? `$${s.base_price.toFixed(2)}` : 'Contact for pricing'
      return `- ${s.name}${s.description ? `: ${s.description}` : ''} (${price})`
    }).join('\n') || 'No services listed'

    const tradeLabels: Record<string, string> = {
      'plumber': 'Plumbing',
      'electrician': 'Electrical',
      'hvac': 'HVAC',
      'power_washer': 'Power Washing'
    }

    const businessInfo = `
BUSINESS INFORMATION:
- Business Name: ${profile.business_name}
- Trade Type: ${tradeLabels[profile.trade] || profile.trade}
- Service Area: ${profile.service_area}
- Phone: ${profile.phone || 'Not provided'}
- Email: ${profile.email || 'Not provided'}
- Brand Color: ${websiteSettings?.primary_color || profile.brand_color || '#1e3a8a'}

SERVICES OFFERED:
${servicesList}
`

    // Generate website content with Gemini
    const systemPrompt = `You are an expert web developer and designer specializing in creating professional business websites. 
Generate modern, responsive, and beautiful HTML/CSS/JavaScript code. Always use the business information provided to create personalized content.
Return ONLY the HTML code (including <style> and <script> tags) without markdown formatting or code blocks.`

    let userPrompt: string

    if (generateFullWebsite) {
      // Generate complete multi-page website
      userPrompt = `Create a professional, modern website for ${profile.business_name}, a ${tradeLabels[profile.trade] || profile.trade} business.

${businessInfo}

CRITICAL REQUIREMENTS - PROFESSIONAL WEBSITE STRUCTURE:

1. LAYOUT STRUCTURE (DO NOT put services in top-left corner):
   - Clean navigation bar at the TOP (centered or full-width, NOT top-left)
   - Large, impactful HERO SECTION in the center with business name and compelling tagline
   - SERVICES SECTION below hero (centered, organized in a grid or cards layout)
   - ABOUT/TESTIMONIALS section
   - CONTACT SECTION with form
   - Professional FOOTER at the bottom

2. DESIGN SPECIFICATIONS:
   - Brand color: ${websiteSettings?.primary_color || profile.brand_color || '#1e3a8a'}
   - Modern, professional design similar to high-end business websites
   - Clean typography (use system fonts like -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)
   - Proper spacing and padding (not cramped)
   - Professional color scheme with good contrast
   - Fully responsive (mobile-first design)
   - Smooth, subtle animations
   - Professional shadows and borders
   - Clean, modern buttons with hover effects

3. NAVIGATION:
   - Horizontal navigation bar at the top
   - Logo/business name on the left
   - Navigation links should use anchor links (#services, #about, #contact) for smooth scrolling within the page
   - DO NOT use external links or page navigation
   - All links should scroll to sections on the same page using anchor tags
   - Sticky navigation that stays visible when scrolling
   - Clean, modern styling
   - Add smooth scroll behavior in CSS

4. HERO SECTION:
   - Large, centered hero section with id="home"
   - Business name as main headline (large, bold)
   - Compelling tagline/subheadline
   - Call-to-action button that links to #services or #contact (use anchor links)
   - Background with gradient or solid color (NOT services list)
   - Professional spacing and typography

5. SERVICES SECTION:
   - Section with id="services" for anchor navigation
   - Section title: "Our Services" or "What We Offer"
   - Services displayed in a clean grid layout (2-3 columns on desktop, 1 column on mobile)
   - Each service in a card with:
     * Service name (bold)
     * Description
     * Price (if available)
     * Clean card design with shadow
   - Centered layout, NOT top-left
   - Professional spacing between cards

6. ABOUT SECTION:
   - Section with id="about" for anchor navigation
   - Information about the business and service area
   - Professional styling

7. CONTACT SECTION:
   - Section with id="contact" for anchor navigation
   - Clear section with contact information
   - Phone number: ${profile.phone || 'Call us today'}
   - Email: ${profile.email || 'Email us'}
   - Service area: ${profile.service_area}
   - Contact form (optional but recommended)
   - Professional styling

8. FOOTER:
   - Business information
   - Contact details
   - Professional, clean design
   - Copyright notice

9. CSS STYLING:
   - Use modern CSS (Flexbox/Grid)
   - Professional color palette
   - Smooth transitions
   - Add smooth scrolling: html { scroll-behavior: smooth; }
   - Responsive breakpoints
   - Clean, readable fonts
   - Proper line heights and spacing
   - Professional button styles
   - Card-based layouts for services
   - Ensure all navigation links use anchor tags (#section-id) for smooth scrolling

10. NAVIGATION BEHAVIOR:
    - All navigation links must use anchor tags (e.g., <a href="#services">Services</a>)
    - DO NOT use external links or page navigation
    - All sections must have appropriate IDs (id="services", id="about", id="contact")
    - Navigation should scroll smoothly to sections on the same page
    - This is a single-page website with anchor-based navigation

11. AVOID:
    - DO NOT put services in the top-left corner
    - DO NOT use cramped layouts
    - DO NOT use poor spacing
    - DO NOT use unprofessional fonts
    - DO NOT create a cluttered design
    - DO NOT use external links or page navigation
    - DO NOT use window.location or page redirects

Generate a complete, professional HTML website with proper structure and modern design:`
    } else {
      // Generate single page
      userPrompt = `Create a ${pageTitle || 'website'} page for this ${profile.trade} business.

${businessInfo}

ADDITIONAL REQUIREMENTS:
${prompt || 'Create a professional, modern page'}

Requirements:
- Use brand color: ${websiteSettings?.primary_color || profile.brand_color || '#1e3a8a'}
- Include business name: ${profile.business_name}
- Mention service area: ${profile.service_area}
- Include contact info if relevant: ${profile.phone ? `Phone: ${profile.phone}` : ''} ${profile.email ? `Email: ${profile.email}` : ''}
- Use modern, clean design
- Responsive layout (mobile-friendly)
- Professional styling
- Include proper HTML structure
- Add inline CSS in <style> tag
- Add JavaScript in <script> tag if needed for interactivity
- Use semantic HTML
- Make it visually appealing and conversion-focused

Generate the complete HTML code:`
    }

    let htmlCode
    try {
      htmlCode = await generateText(systemPrompt, userPrompt, {
        maxTokens: 6000,
        temperature: 0.7,
      })

      // Clean up the response - remove markdown code blocks if present
      htmlCode = htmlCode.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim()
      
      // If the HTML doesn't start with <, try to extract it
      if (!htmlCode.trim().startsWith('<')) {
        // Try to find HTML in the response
        const htmlMatch = htmlCode.match(/<[\s\S]*>/)
        if (htmlMatch) {
          htmlCode = htmlMatch[0]
        }
      }
      
      // Ensure we have valid HTML structure with proper styling and navigation handling
      if (!htmlCode.includes('<!DOCTYPE') && !htmlCode.includes('<html') && !htmlCode.includes('<body')) {
        // Wrap in professional HTML structure
        htmlCode = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${profile.business_name} - ${tradeLabels[profile.trade] || profile.trade}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    html {
      scroll-behavior: smooth;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
    }
    a {
      text-decoration: none;
      color: inherit;
    }
  </style>
  <script>
    // Ensure all anchor links work properly and stay on page
    document.addEventListener('DOMContentLoaded', function() {
      // Handle anchor navigation
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
    });
  </script>
</head>
<body>
${htmlCode}
</body>
</html>`
      } else {
        // Inject smooth scroll and navigation handler if HTML already has structure
        if (htmlCode.includes('<head>')) {
          // Add smooth scroll CSS if not present
          if (!htmlCode.includes('scroll-behavior: smooth')) {
            htmlCode = htmlCode.replace(
              '</head>',
              `<style>html { scroll-behavior: smooth; }</style>
<script>
  document.addEventListener('DOMContentLoaded', function() {
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
  });
</script>
</head>`
            )
          }
        }
      }
    } catch (aiError: any) {
      console.error('Gemini API error:', aiError)
      return NextResponse.json(
        { 
          error: aiError.message || 'Failed to generate website. Please check your GEMINI_API_KEY in .env.local',
          details: process.env.NODE_ENV === 'development' ? aiError.message : undefined
        },
        { status: 500 }
      )
    }

    if (!htmlCode) {
      return NextResponse.json(
        { error: 'No HTML generated from AI' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      html: htmlCode,
      title: pageTitle || (generateFullWebsite ? 'Home' : 'Generated Page'),
      businessInfo: {
        businessName: profile.business_name,
        trade: profile.trade,
        serviceArea: profile.service_area,
        phone: profile.phone,
        email: profile.email,
        services: services?.map(s => ({
          name: s.name,
          description: s.description,
          price: s.base_price
        })) || []
      }
    })
  } catch (error: any) {
    console.error('Error generating website:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

