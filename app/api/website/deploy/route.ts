import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Deploy website to Netlify (simpler than Vercel for automatic deployment)
 * 
 * Required APIs:
 * - Netlify Deploy API (for deployment)
 * - OpenAI/Anthropic API (already using Gemini - in lib/ai/client)
 * - Supabase (already have)
 * 
 * Environment variables needed:
 * - NETLIFY_AUTH_TOKEN (from Netlify dashboard -> User settings -> Applications -> Personal access tokens)
 * - NETLIFY_SITE_ID (optional, will create if not provided)
 * - GEMINI_API_KEY (already have)
 * 
 * Netlify is much simpler than Vercel - just POST files directly!
 */

export async function POST(request: NextRequest) {
  try {
    const { html, websiteName, subdomain } = await request.json()

    if (!html || !websiteName) {
      return NextResponse.json(
        { error: 'HTML content and website name are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const netlifyToken = process.env.NETLIFY_AUTH_TOKEN
    if (!netlifyToken) {
      return NextResponse.json(
        { error: 'Netlify token not configured. Please set NETLIFY_AUTH_TOKEN in environment variables. Get it from: https://app.netlify.com/user/applications#personal-access-tokens' },
        { status: 500 }
      )
    }

    // Use existing site ID if available, otherwise create new site
    let siteId = process.env.NETLIFY_SITE_ID
    
    // Check if user already has a deployed website
    const { data: existingSettings } = await supabase
      .from('website_settings')
      .select('website_slug, custom_domain')
      .eq('user_id', user.id)
      .single()
    
    // If we have a custom domain from previous deployment, extract site ID from it
    if (existingSettings?.custom_domain && !siteId) {
      // Netlify URLs are like: https://site-name.netlify.app
      // We can try to get the site ID from the domain
      const domainMatch = existingSettings.custom_domain.match(/https?:\/\/([^.]+)\.netlify\.app/)
      if (domainMatch) {
        // We'll need to look up the site by name, but for now we'll create/update
      }
    }
    
    // Create static HTML file
    const staticHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${websiteName}</title>
</head>
<body>
${html}
</body>
</html>`

    // Deploy to Netlify using their Deploy API (much simpler than Vercel!)
    try {
      // Step 1: Create or get site
      if (!siteId) {
        // Create a new site
        const siteName = existingSettings?.website_slug || subdomain || `tradestack-${user.id.slice(0, 8)}`
        const createSiteResponse = await fetch('https://api.netlify.com/api/v1/sites', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${netlifyToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: siteName
          })
        })

        if (createSiteResponse.ok) {
          const siteData = await createSiteResponse.json()
          siteId = siteData.id
        } else {
          // Get error details
          const errorText = await createSiteResponse.text()
          let errorData: any = {}
          try {
            errorData = JSON.parse(errorText)
          } catch {
            errorData = { message: errorText }
          }
          
          // If site exists or access denied, try to find existing site
          if (errorData.message?.includes('already exists') || errorData.message?.includes('taken') || errorData.message?.includes('Access Denied')) {
            // Try to get existing sites
            const getSitesResponse = await fetch('https://api.netlify.com/api/v1/sites', {
              headers: {
                'Authorization': `Bearer ${netlifyToken}`
              }
            })
            
            if (getSitesResponse.ok) {
              const sites = await getSitesResponse.json()
              const existingSite = sites.find((s: any) => s.name === siteName || s.subdomain === siteName)
              if (existingSite) {
                siteId = existingSite.id
              } else if (sites.length > 0) {
                // Use first available site if we can't find by name
                siteId = sites[0].id
              }
            } else {
              // If we can't list sites, the token might not have permissions
              const listErrorText = await getSitesResponse.text()
              throw new Error(`Netlify API error: ${errorData.message || errorText}. List sites error: ${listErrorText}. Make sure your token has 'sites:read' and 'sites:write' permissions.`)
            }
          }
          
          if (!siteId) {
            throw new Error(`Failed to create or find Netlify site: ${errorData.message || errorText}. Make sure your NETLIFY_AUTH_TOKEN has proper permissions (sites:read, sites:write, deploy:write).`)
          }
        }
      }

      // Step 2: Deploy files directly to Netlify
      // Netlify's Deploy API accepts files as base64 encoded in JSON format
      const files: Record<string, string> = {
        'index.html': Buffer.from(staticHTML).toString('base64')
      }

      // Deploy to Netlify using the Deploy API
      const deployResponse = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/deploys`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${netlifyToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          files: files,
          functions: {},
          draft: false
        })
      })

      let deploymentData
      let deploymentError
      
      if (deployResponse.ok) {
        deploymentData = await deployResponse.json()
      } else {
        // Get detailed error
        const errorText = await deployResponse.text()
        try {
          deploymentError = JSON.parse(errorText)
        } catch {
          deploymentError = { message: errorText }
        }
        
        console.error('Netlify deployment API error:', {
          status: deployResponse.status,
          statusText: deployResponse.statusText,
          error: deploymentError,
          siteId: siteId
        })
        
        // Provide helpful error message
        if (deployResponse.status === 401 || deployResponse.status === 403) {
          throw new Error(`Netlify authentication failed. Make sure your NETLIFY_AUTH_TOKEN is valid and has 'deploy:write' permission. Error: ${deploymentError.message || errorText}`)
        }
      }

      // Get deployment URL
      let deploymentUrl = deploymentData?.url 
        ? `https://${deploymentData.url}` 
        : null
      
      // If we have site info, use the site URL
      if (!deploymentUrl && siteId) {
        const getSiteResponse = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}`, {
          headers: {
            'Authorization': `Bearer ${netlifyToken}`
          }
        })
        if (getSiteResponse.ok) {
          const siteData = await getSiteResponse.json()
          deploymentUrl = siteData.ssl_url || siteData.url || `https://${siteData.subdomain}.netlify.app`
        }
      }

      // Save deployment info to database
      const projectName = existingSettings?.website_slug || subdomain || `tradestack-${user.id.slice(0, 8)}`
      const { error: dbError } = await supabase
        .from('website_settings')
        .upsert({
          user_id: user.id,
          website_slug: projectName,
          is_published: true,
          custom_domain: deploymentUrl || `https://${projectName}.netlify.app`,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })

      if (dbError) {
        console.error('Database error:', dbError)
      }

      return NextResponse.json({
        success: !!deploymentData,
        deploymentUrl: deploymentUrl || `https://${projectName}.netlify.app`,
        projectName,
        deploymentId: deploymentData?.id,
        siteId: siteId,
        message: deploymentData 
          ? 'Website deployed successfully to Netlify! It may take a few minutes to go live.'
          : `Site created but deployment needs retry. Error: ${deploymentError?.message || 'Unknown error'}`,
        error: deploymentError || null
      })

    } catch (netlifyError: any) {
      console.error('Netlify deployment error:', netlifyError)
      return NextResponse.json(
        { 
          error: netlifyError.message || 'Failed to deploy to Netlify',
          details: 'Make sure NETLIFY_AUTH_TOKEN is set correctly in your environment variables. Get it from: https://app.netlify.com/user/applications#personal-access-tokens'
        },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error('Error deploying website:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

