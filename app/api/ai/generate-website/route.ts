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

    // Generate website content with AI (Lovable-quality prompts)
    const systemPrompt = `You are an elite web developer and designer, similar to Lovable.dev's AI. You create production-ready, beautiful websites that rival hand-coded professional sites.

CRITICAL RULES:
1. Generate ONLY valid, complete HTML code - no markdown, no explanations, no code blocks
2. Code must be production-ready: clean, semantic, accessible, and performant
3. Use modern CSS (Grid, Flexbox, CSS variables, modern selectors)
4. Ensure perfect responsive design (mobile-first approach)
5. Include smooth animations and micro-interactions
6. Use semantic HTML5 elements
7. Optimize for performance (minimal CSS, efficient selectors)
8. Ensure accessibility (proper ARIA labels, keyboard navigation)
9. Code must be immediately deployable without modifications
10. Follow modern web design best practices (2024 standards)

QUALITY STANDARDS:
- Code quality: Production-grade, no placeholders, no TODOs
- Design: Modern, professional, visually stunning
- Performance: Fast loading, optimized CSS
- Accessibility: WCAG 2.1 AA compliant
- Responsiveness: Perfect on all screen sizes
- Browser compatibility: Works on all modern browsers

Return ONLY the complete HTML document starting with <!DOCTYPE html> and ending with </html>.`

    let userPrompt: string

    if (generateFullWebsite) {
      // Generate complete multi-page website (Lovable-quality prompt)
      userPrompt = `Create a stunning, production-ready website for ${profile.business_name}, a ${tradeLabels[profile.trade] || profile.trade} business.

${businessInfo}

DESIGN BRIEF - CREATE A WORLD-CLASS WEBSITE:

WEBSITE STRUCTURE (Single-page application with smooth scrolling):

1. LAYOUT STRUCTURE (Services & Contact at Top - Premium Positioning):
   - FULL-WIDTH PAGE: Page must fill 100% of viewport width - no awkward borders or empty spaces
   - Clean navigation bar at the TOP (full-width header, edge-to-edge)
   - HERO SECTION with business name and tagline emphasizing they are THE BEST/EXPERT/PREMIUM in their field
   - SERVICES SECTION IMMEDIATELY BELOW HERO (prominently displayed at the top, before other content)
     * Services should be one of the FIRST things visitors see
     * Display services in a clean grid or cards layout (2-3 columns on desktop, 1 column on mobile)
     * Make services prominent and easy to scan
   - CONTACT INFORMATION prominently displayed near the top (can be in hero, below services, or in a dedicated top section)
     * Phone number should be clickable (tel: link)
     * Email should be clickable (mailto: link)
     * Service area clearly displayed
     * Make it EASY for customers to contact - this is critical
   - FEATURES/BENEFITS section (optional but recommended - highlight what makes the business unique and THE BEST)
   - ABOUT section with business story emphasizing expertise, experience, and why they're the best choice
   - TESTIMONIALS/REVIEWS section (if available, or create placeholder structure)
   - GALLERY/PORTFOLIO section (optional - showcase work with images)
   - FAQ section (optional - common questions about services)
   - CONTACT FORM section (if not already included at top)
   - Professional FOOTER at the bottom (full-width)
   
   CRITICAL LAYOUT REQUIREMENTS:
   - SERVICES AT TOP: Services section must be prominently displayed near the top, right after hero
   - CONTACT AT TOP: Contact information (phone, email, service area) should be easily visible near the top
   - NO SIDEBAR: All content flows vertically in the main content area
   - Services displayed in a centered grid layout (2-3 columns on desktop, 1 column on mobile)
   - Full-width sections: Each section background should extend edge-to-edge (100vw)
   - Inner content containers: Can be max-width 1280px-1440px, centered with auto margins
   - No awkward borders: Use shadows and background colors instead of borders
   - Page fills entire viewport: html, body { width: 100%; margin: 0; padding: 0; }
   
   NOTE: Not all sections are required - choose 4-6 sections that best fit the business. Always include: Hero (with emphasis on being the best), Services (at top), Contact info (at top), About, Footer. Add others as appropriate.
   
   WHEN USER REQUESTS NEW SECTIONS:
   - If the user asks for a specific section (e.g., pricing, gallery, FAQ, certifications), create a COMPLETE new section that matches their request
   - Include a semantic <section> with a unique id for anchor navigation
   - Provide clear headings, supporting copy, visuals/cards/icons where appropriate, and strong calls-to-action that fit the request
   - Style the new section to match the site's theme (spacing, gradients, typography, animations)
   - Update navigation/menu anchor links so the new section can be accessed easily
   - Place the new section in a logical order relative to existing content
   - DO NOT delete, replace, or remove existing sections when adding new ones—only add the requested section

2. DESIGN SYSTEM (Modern, Professional, Visually Stunning):
   - COLOR SYSTEM (Comprehensive and Cohesive - NO PLAIN WHITE):
     * Primary brand color: ${websiteSettings?.primary_color || profile.brand_color || '#1e3a8a'}
     * Generate a complete color palette from the primary color:
       - Primary: Use the brand color for main CTAs, links, and key elements
       - Primary Dark: Darken primary by 20-30% for hover states and depth
       - Primary Light: Lighten primary by 30-40% for backgrounds and subtle accents
       - Secondary: Create a complementary color (use color theory - opposite on color wheel or analogous)
       - Accent: Use a vibrant, contrasting color for highlights and special elements
       - Neutral Grays: Use a range (50, 100, 200, 300, 400, 500, 600, 700, 800, 900) for text and backgrounds
       - Success/Error/Warning: Use semantic colors (green, red, amber) for status messages
     * Apply colors consistently: Use CSS custom properties (--primary, --secondary, etc.) for easy theming
     * Ensure proper contrast ratios (WCAG AA: 4.5:1 for text, 3:1 for UI elements)
     * CRITICAL - BACKGROUNDS (NEVER PLAIN WHITE):
       - NEVER use plain white (#ffffff or #fff) backgrounds - always use creative, interactive backgrounds
       - Use gradients: Linear gradients, radial gradients, or diagonal gradients with 2-3 colors
       - Use cool color schemes: Dark navy, deep blues, rich purples, teals, or sophisticated color combinations
       - Create depth: Use layered gradients, subtle patterns, or animated backgrounds
       - Section backgrounds: Each section should have a unique, creative background (gradient, subtle pattern, or colored)
       - Hero background: Use an impressive gradient or creative background (never plain white)
       - Body background: Use a cool base color (dark navy, deep blue, rich gray) with subtle gradients
       - Card backgrounds: Use subtle gradients or colored backgrounds (not plain white)
       - Make backgrounds INTERACTIVE and VISUALLY INTERESTING
     * Color psychology: Choose colors that match the trade/business type (trust, professionalism, energy)
     * Cool color schemes: Prefer dark, rich, sophisticated colors over bright whites
   
   - TYPOGRAPHY (Modern and Readable):
     * Font stack: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif
     * Font hierarchy (optimized for desktop/web viewing): 
       - Hero/Display: 4.5-5.5rem (72-88px) on desktop, scale down for smaller screens
       - H1: 3-3.5rem (48-56px) desktop, scale down proportionally
       - H2: 2.5-3rem (40-48px) desktop, scale down proportionally
       - H3: 1.75-2rem (28-32px) desktop, scale down proportionally
       - Body: 1.125rem (18px) with line-height 1.7-1.9 (optimized for desktop reading)
       - Small: 1rem (16px)
       - Caption: 0.875rem (14px)
     * Font weights: Use 400 (regular), 500 (medium), 600 (semibold), 700 (bold) strategically
     * Letter spacing: Slightly increase for headings (0.02em), normal for body
   
   - SPACING & LAYOUT (Full-Width, No Awkward Borders - Desktop-Optimized):
     * FULL-WIDTH DESIGN: Page should fill 100% of viewport width - no awkward borders or empty spaces
     * Body and html should be: width: 100%, margin: 0, padding: 0 (no default browser spacing)
     * Spacing scale: 4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px, 96px, 128px, 192px
     * Section padding: 96-128px on desktop (generous spacing for web), 64-96px on tablet, 48-64px on mobile
     * Container max-width: Use full viewport width (100vw) for sections, inner content containers can be 1280px-1440px max-width centered
     * Grid gaps: 32-48px on desktop (generous spacing), 24-32px on tablet, 16-24px on mobile
     * NO AWKWARD BORDERS: 
       - Avoid thick borders that create visual breaks
       - Use subtle shadows or background color changes instead of borders
       - If borders are needed, use 1px solid with rgba colors (low opacity: 0.1-0.2)
       - Ensure sections flow seamlessly without harsh visual breaks
       - Background colors should extend edge-to-edge (full viewport width)
     * Page structure: html, body { width: 100%; margin: 0; padding: 0; overflow-x: hidden; }
     * Body background: NEVER use plain white - use a cool color scheme:
       - Dark navy (#0a1929, #1a1f3a) with subtle gradients
       - Deep blue (#0f172a, #1e293b) with gradient overlays
       - Rich dark colors with gradient variations
       - Each section can have alternating gradient backgrounds for visual interest
   
   - VISUAL EFFECTS (Modern and Subtle):
     * Shadows: Layered depth system
       - Small: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)
       - Medium: 0 3px 6px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.12)
       - Large: 0 10px 20px rgba(0,0,0,0.15), 0 3px 6px rgba(0,0,0,0.10)
       - Hover: Elevate shadow on interactive elements
     * Border radius: 8px (cards), 12px (buttons), 16px (containers), 24px (hero sections)
     * Backdrop blur: Use backdrop-filter: blur(10px) for modern glassmorphism effects on nav/overlays
     * Gradients: Use creative, interactive gradients throughout:
       - Linear gradients: Top to bottom, diagonal, or multi-stop gradients
       - Radial gradients: For hero sections or focal points
       - Animated gradients: Subtle color shifts or moving gradients (CSS animations)
       - Multi-color gradients: Use 2-4 colors for rich, dynamic backgrounds
       - NEVER use plain white - always incorporate gradients or colors
   
   - ANIMATIONS & INTERACTIONS (Smooth and Purposeful):
     * Transitions: transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) (ease-in-out)
     * Hover effects: Scale (1.02-1.05), shadow elevation, color shifts
     * Scroll animations: Fade-in on scroll using Intersection Observer or CSS animations
     * Button interactions: Active states, loading states, success states
     * Micro-interactions: Subtle bounce, pulse, or slide effects for feedback
   
   - COMPONENTS (Modern and Polished):
     * Buttons: 
       - Primary: Solid background with gradient, prominent padding (12px 32px), rounded
       - Secondary: Outlined or ghost style, same padding
       - Hover: Scale, shadow elevation, color shift
       - Active: Slight scale down (0.98)
     * Cards: 
       - Elevated with shadows, rounded corners, hover lift effect
       - Padding: 24-32px, clean backgrounds (avoid borders - use shadows instead)
       - Interactive: Cursor pointer, smooth transitions
       - NO THICK BORDERS: Use subtle shadows (box-shadow) instead of borders for separation
       - If borders needed: 1px solid rgba(0,0,0,0.1) maximum
     * Forms:
       - Modern input styles with focus states (border color change, shadow)
       - Labels above inputs, proper spacing
       - Error states with red accents
   
   - RESPONSIVE DESIGN (Desktop-First / Web-Optimized Approach):
     * Breakpoints (use max-width media queries for smaller screens):
       - Desktop Large: Base styles (1440px+) - Primary focus, full-featured design
       - Desktop: 1440px (standard desktops and laptops)
       - Tablet: 1024px (tablets in landscape, smaller laptops)
       - Mobile Large: 768px (tablets in portrait, large phones)
       - Mobile: 480px (phones)
     * Desktop-first: Write base styles for desktop (1440px+), then use max-width media queries for smaller screens
     * Typography scales: Optimize for desktop readability, scale down for smaller screens
     * Layout changes: 3-4 columns on desktop, 2 columns on tablet, 1 column on mobile
     * Navigation: Full horizontal navigation on desktop, hamburger menu only on tablets/mobile (< 1024px)
     * Focus on desktop experience: Generous spacing, larger fonts, multi-column layouts optimized for desktop viewing
   
   - PERFORMANCE (Optimized and Fast):
     * CSS: Use efficient selectors, avoid deep nesting (max 3 levels)
     * Minimize reflows: Use transform and opacity for animations
     * Lazy loading: Use loading="lazy" for images below the fold
     * Critical CSS: Inline critical styles in <head>

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
   - Compelling tagline/subheadline that emphasizes they are THE BEST, EXPERT, PREMIUM, or TOP CHOICE in their field
   - Use language like: "The Best [Trade] in [Area]", "Expert [Trade] Services", "Premium [Trade] Solutions", "Your Trusted [Trade] Professional"
   - Emphasize quality, expertise, reliability, and why customers should choose them
   - Call-to-action button that links to #services or #contact (use anchor links)
   - CREATIVE BACKGROUND: Use an impressive gradient, animated gradient, or creative background pattern (NEVER plain white)
     * Examples: Dark navy to deep blue gradient, rich purple to teal gradient, animated color shifts
     * Make it visually striking and interactive
   - Professional spacing and typography
   - Make it clear this business is the PREMIUM choice

5. SERVICES SECTION (MUST BE AT TOP, PROMINENTLY DISPLAYED):
   - Section with id="services" for anchor navigation
   - Section title: "Our Services" or "What We Offer" or "Expert Services"
   - SERVICES MUST BE DISPLAYED NEAR THE TOP OF THE PAGE, right after the hero section
   - Services displayed in a clean grid layout (2-3 columns on desktop, 1 column on mobile)
   - Each service in a card with:
     * Service name (bold, prominent)
     * Description emphasizing quality and expertise
     * Price (if available, clearly displayed)
     * Clean card design with shadow
   - Centered layout, NOT top-left
   - Professional spacing between cards
   - Make services EASY to find and scan - this is critical for conversions

6. FEATURES/BENEFITS SECTION (Optional but Recommended):
   - Section with id="features" or id="benefits" for anchor navigation
   - Highlight 3-4 key benefits or unique selling points
   - Use icons or visual elements to make it engaging
   - Grid layout: 2-3 columns on desktop, 1 column on mobile
   - Professional styling with cards or icon-based design

7. ABOUT SECTION:
   - Section with id="about" for anchor navigation
   - Information about the business, experience, and service area
   - ALWAYS emphasize why they are THE BEST choice:
     * Years of experience and expertise
     * Quality of work and professionalism
     * Customer satisfaction and trust
     * Why customers should choose them over competitors
   - Include business story, years of experience, certifications (if relevant)
   - Use language that positions them as the premium/expert choice
   - Professional styling with good typography and spacing
   - Consider adding a team photo or business image if appropriate

8. TESTIMONIALS/REVIEWS SECTION (Optional):
   - Section with id="testimonials" for anchor navigation
   - Display customer reviews or testimonials
   - If no testimonials available, create a placeholder structure that can be filled later
   - Use card-based layout with quotes
   - Include customer names and ratings (if available)
   - Carousel or grid layout: 2-3 testimonials visible at once on desktop

9. GALLERY/PORTFOLIO SECTION (Optional):
   - Section with id="gallery" or id="portfolio" for anchor navigation
   - Showcase completed work with images
   - Use a masonry or grid layout
   - Lightbox functionality for viewing larger images
   - If no images available, create placeholder structure

10. FAQ SECTION (Optional):
    - Section with id="faq" for anchor navigation
    - Common questions about services, pricing, availability
    - Use accordion-style expandable questions
    - Clean, organized layout
    - Helps with SEO and user experience

11. CONTACT SECTION (MUST BE EASILY ACCESSIBLE, PREFERABLY AT TOP):
   - Section with id="contact" for anchor navigation
   - CONTACT INFORMATION SHOULD BE PROMINENTLY DISPLAYED - consider placing it near the top (in hero, below services, or dedicated top section)
   - Clear section with contact information
   - Phone number: ${profile.phone || 'Call us today'} (make it clickable with tel: link, large and prominent)
   - Email: ${profile.email || 'Email us'} (make it clickable with mailto: link, large and prominent)
   - Service area: ${profile.service_area} (clearly displayed)
   - Make contact info EASY to find - this is critical for conversions
   - Contact form (highly recommended) with fields:
     * Name (required)
     * Email (required, with validation)
     * Phone (optional)
     * Message/Service needed (required, textarea)
     * Submit button with loading state
   - Two-column layout on desktop: form on left, contact info on right
   - Stack vertically on mobile
   - Professional styling with proper form validation styling
   - Success/error message display areas

12. FOOTER:
   - Business information (name, trade type)
   - Contact details (phone, email, service area)
   - Quick navigation links (anchor links to sections)
   - Social media links (if applicable, use placeholder structure)
   - Copyright notice with current year
   - Professional, clean design with subtle background
   - Two or three-column layout on desktop, stacked on mobile
   - Proper spacing and typography hierarchy

13. CSS STYLING:
   - Use modern CSS (CSS Grid, Flexbox, CSS Custom Properties)
   - Implement the comprehensive color system described above
   - Use CSS variables for colors: :root { --primary: ...; --secondary: ...; }
   - CRITICAL - BACKGROUNDS: NEVER use plain white backgrounds
     * Body: Use cool dark color (navy, deep blue, rich gray) with gradient
     * Sections: Alternate between different gradient backgrounds for visual interest
     * Cards: Use subtle gradients or colored backgrounds (not white)
     * Hero: Impressive gradient or animated background
     * Make backgrounds creative, interactive, and visually appealing
   - Smooth transitions on all interactive elements
   - Add smooth scrolling: html { scroll-behavior: smooth; }
   - Responsive breakpoints: 1440px (desktop base), 1024px (tablet), 768px (mobile large), 480px (mobile) - desktop-first approach
   - Clean, readable fonts with proper hierarchy (ensure text contrasts well with dark backgrounds)
   - Proper line heights (1.6-1.8 for body, 1.2-1.4 for headings)
   - Consistent spacing using the spacing scale
   - Professional button styles with hover/active states
   - Card-based layouts for services, testimonials, features
   - Modern glassmorphism effects where appropriate (backdrop-filter)
   - Creative gradients throughout for depth and visual interest
   - Ensure all navigation links use anchor tags (#section-id) for smooth scrolling
   - Use container queries where appropriate for component-level responsiveness

14. NAVIGATION BEHAVIOR:
    - All navigation links must use anchor tags (e.g., <a href="#services">Services</a>)
    - DO NOT use external links or page navigation
    - All sections must have appropriate IDs (id="services", id="about", id="contact")
    - Navigation should scroll smoothly to sections on the same page
    - This is a single-page website with anchor-based navigation

15. AVOID:
    - DO NOT put services in the top-left corner
    - DO NOT use cramped layouts
    - DO NOT use poor spacing
    - DO NOT use unprofessional fonts
    - DO NOT create a cluttered design
    - DO NOT use external links or page navigation
    - DO NOT use window.location or page redirects

CRITICAL REQUIREMENTS:
1. Throughout the entire website, ALWAYS emphasize that this business is THE BEST, EXPERT, PREMIUM, or TOP CHOICE in their field. Use language that positions them as the superior option. Make it clear why customers should choose them.

2. NEVER use plain white backgrounds - always use creative, interactive backgrounds:
   - Use gradients (linear, radial, diagonal) with cool color schemes
   - Use dark, rich colors (navy, deep blue, purple, teal) as base colors
   - Make backgrounds visually interesting and dynamic
   - Each section should have a unique, creative background
   - Body background should be a cool dark color with gradients, never plain white
   - Cards and containers should have subtle gradients or colored backgrounds

Generate a complete, professional HTML website with proper structure and modern design:`
    } else {
      // Generate single page
      userPrompt = `Create a ${pageTitle || 'website'} page for this ${profile.trade} business.

${businessInfo}

ADDITIONAL REQUIREMENTS:
${prompt || 'Create a professional, modern page'}

CRITICAL REQUIREMENTS:
- ALWAYS emphasize that this business is THE BEST, EXPERT, PREMIUM, or TOP CHOICE in their field
- Use language that positions them as the superior option (e.g., "The Best [Trade] in [Area]", "Expert [Trade] Services", "Premium [Trade] Solutions")
- Services and contact information should be prominently displayed at the top
- Make it clear why customers should choose them over competitors
- NEVER use plain white backgrounds - always use creative, interactive backgrounds with cool color schemes:
  * Use gradients (linear, radial, diagonal) with rich colors
  * Use dark, sophisticated colors (navy, deep blue, purple, teal) as base
  * Make backgrounds visually interesting and dynamic
  * Body should have a cool dark gradient background, never plain white

Requirements:
- Use brand color: ${websiteSettings?.primary_color || profile.brand_color || '#1e3a8a'}
- Include business name: ${profile.business_name}
- Mention service area: ${profile.service_area}
- Include contact info if relevant: ${profile.phone ? `Phone: ${profile.phone}` : ''} ${profile.email ? `Email: ${profile.email}` : ''}
- Services and contact info should be prominently displayed at the top
- Use modern, clean design
- Responsive layout (desktop-first, mobile-friendly)
- Professional styling
- Include proper HTML structure
- Add inline CSS in <style> tag
- Add JavaScript in <script> tag if needed for interactivity
- Use semantic HTML
- Make it visually appealing and conversion-focused
- Full-width design: html, body { width: 100%; margin: 0; padding: 0; }
- No awkward borders - use shadows instead

Generate the complete HTML code:`
    }

    let htmlCode
    try {
      htmlCode = await generateText(systemPrompt, userPrompt, {
        maxTokens: 8000, // More tokens for complete, high-quality websites
        temperature: 0.3, // Lower temperature for more consistent, production-ready code (like Lovable)
        preferOpenAI: true, // Use OpenAI GPT-4 for better code generation if available
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

