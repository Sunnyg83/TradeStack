import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // Handle OAuth error
    if (error) {
      const errorDescription = searchParams.get('error_description') || 'Facebook authorization was cancelled or failed'
      const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard/ads?error=${encodeURIComponent(errorDescription)}`
      return NextResponse.redirect(dashboardUrl)
    }

    // If we have a code, handle the OAuth callback
    if (code && state) {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        // User not authenticated, redirect to login
        const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/login`
        return NextResponse.redirect(loginUrl)
      }

      try {
        const stateData = JSON.parse(Buffer.from(state, 'base64').toString())
        const { userId, platform } = stateData

        if (userId !== user.id) {
          const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard/ads?error=${encodeURIComponent('Invalid user')}`
          return NextResponse.redirect(dashboardUrl)
        }

        // Exchange code for access token
        const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/facebook/connect`
        const appId = process.env.FACEBOOK_APP_ID
        const appSecret = process.env.FACEBOOK_APP_SECRET

        if (!appId || !appSecret) {
          const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard/ads?error=${encodeURIComponent('Facebook credentials not configured')}`
          return NextResponse.redirect(dashboardUrl)
        }

        // Exchange code for access token
        const tokenResponse = await fetch(
          `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`,
          { method: 'GET' }
        )

        if (!tokenResponse.ok) {
          const errorData = await tokenResponse.json()
          console.error('Facebook token exchange error:', errorData)
          const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard/ads?error=${encodeURIComponent('Failed to exchange code for token')}`
          return NextResponse.redirect(dashboardUrl)
        }

        const tokenData = await tokenResponse.json()
        const accessToken = tokenData.access_token

        // Get user's pages
        const pagesResponse = await fetch(
          `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`
        )

        if (!pagesResponse.ok) {
          const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard/ads?error=${encodeURIComponent('Failed to fetch Facebook pages')}`
          return NextResponse.redirect(dashboardUrl)
        }

        const pagesData = await pagesResponse.json()
        const pages = pagesData.data || []

        if (pages.length === 0) {
          const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard/ads?error=${encodeURIComponent('No Facebook pages found. Please create a Facebook Page first.')}`
          return NextResponse.redirect(dashboardUrl)
        }

        // Use the first page (user can change this later)
        const page = pages[0]
        const pageAccessToken = page.access_token
        const pageId = page.id
        const pageName = page.name

        // Get long-lived token (60 days)
        const longLivedTokenResponse = await fetch(
          `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${pageAccessToken}`
        )

        let finalAccessToken = pageAccessToken
        if (longLivedTokenResponse.ok) {
          const longLivedTokenData = await longLivedTokenResponse.json()
          finalAccessToken = longLivedTokenData.access_token
        }

        // Check if Instagram account is connected
        let instagramAccountId = null
        let instagramUsername = null

        try {
          const instagramResponse = await fetch(
            `https://graph.facebook.com/v18.0/${pageId}?fields=instagram_business_account&access_token=${finalAccessToken}`
          )

          if (instagramResponse.ok) {
            const instagramData = await instagramResponse.json()
            if (instagramData.instagram_business_account) {
              const igAccountResponse = await fetch(
                `https://graph.facebook.com/v18.0/${instagramData.instagram_business_account.id}?fields=username&access_token=${finalAccessToken}`
              )
              if (igAccountResponse.ok) {
                const igAccountData = await igAccountResponse.json()
                instagramAccountId = instagramData.instagram_business_account.id
                instagramUsername = igAccountData.username
              }
            }
          }
        } catch (error) {
          console.error('Error fetching Instagram account:', error)
          // Continue without Instagram if not connected
        }

        // Save to database (upsert)
        const { error: dbError } = await supabase
          .from('social_media_accounts')
          .upsert({
            user_id: user.id,
            platform: 'facebook',
            access_token: finalAccessToken,
            page_id: pageId,
            page_name: pageName,
            instagram_account_id: instagramAccountId,
            instagram_username: instagramUsername,
            is_active: true,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id,platform'
          })

        if (dbError) {
          console.error('Database error:', dbError)
          const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard/ads?error=${encodeURIComponent('Failed to save connection')}`
          return NextResponse.redirect(dashboardUrl)
        }

        // Redirect back to dashboard with success
        const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard/ads?connected=facebook`
        return NextResponse.redirect(dashboardUrl)

      } catch (error: any) {
        console.error('Error processing Facebook OAuth:', error)
        const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard/ads?error=${encodeURIComponent(error.message || 'Failed to connect Facebook')}`
        return NextResponse.redirect(dashboardUrl)
      }
    }

    // No code - initiate OAuth flow
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/facebook/connect`
    const appId = process.env.FACEBOOK_APP_ID
    
    if (!appId) {
      return NextResponse.json(
        { error: 'Facebook App ID not configured. Please set FACEBOOK_APP_ID in your environment variables.' },
        { status: 500 }
      )
    }

    // Facebook OAuth URL
    const scope = 'pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish,business_management'
    const stateParam = Buffer.from(JSON.stringify({ userId: user.id, platform: 'facebook' })).toString('base64')
    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${stateParam}&response_type=code`

    return NextResponse.redirect(authUrl)
  } catch (error: any) {
    console.error('Error in Facebook connect:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

