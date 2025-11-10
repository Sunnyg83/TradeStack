import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { adTemplateId, platform, caption } = await request.json()

    if (!adTemplateId || !platform || !caption) {
      return NextResponse.json(
        { error: 'adTemplateId, platform, and caption are required' },
        { status: 400 }
      )
    }

    if (!['facebook', 'instagram'].includes(platform)) {
      return NextResponse.json(
        { error: 'Platform must be facebook or instagram' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify ad template belongs to user
    const { data: template, error: templateError } = await supabase
      .from('ad_templates')
      .select('*')
      .eq('id', adTemplateId)
      .eq('user_id', user.id)
      .single()

    if (templateError || !template) {
      return NextResponse.json(
        { error: 'Ad template not found' },
        { status: 404 }
      )
    }

    // Get social media account
    const { data: socialAccount, error: accountError } = await supabase
      .from('social_media_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('platform', 'facebook')
      .eq('is_active', true)
      .single()

    if (accountError || !socialAccount) {
      return NextResponse.json(
        { error: 'Facebook account not connected. Please connect your Facebook account first.' },
        { status: 400 }
      )
    }

    // Create ad post record
    const { data: adPost, error: postError } = await supabase
      .from('ad_posts')
      .insert({
        ad_template_id: adTemplateId,
        user_id: user.id,
        platform,
        status: 'pending',
      })
      .select()
      .single()

    if (postError) {
      return NextResponse.json(
        { error: 'Failed to create post record' },
        { status: 500 }
      )
    }

    try {
      let postId: string | null = null

      if (platform === 'facebook') {
        // Post to Facebook Page
        const fbResponse = await fetch(
          `https://graph.facebook.com/v18.0/${socialAccount.page_id}/feed`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: caption,
              access_token: socialAccount.access_token,
            }),
          }
        )

        if (!fbResponse.ok) {
          const errorData = await fbResponse.json()
          throw new Error(errorData.error?.message || 'Failed to post to Facebook')
        }

        const fbData = await fbResponse.json()
        postId = fbData.id

      } else if (platform === 'instagram') {
        // Check if Instagram is connected
        if (!socialAccount.instagram_account_id) {
          throw new Error('Instagram account not connected to your Facebook Page. Please connect Instagram Business Account to your Facebook Page.')
        }

        const headlinePreview = template.headline?.toString() || template.service || 'TradeStack'
        const truncatedPreview = headlinePreview.substring(0, 40)
        const fallbackImageUrl =
          process.env.NEXT_PUBLIC_INSTAGRAM_PLACEHOLDER_IMAGE_URL ||
          `https://placehold.co/1080x1080.png?text=${encodeURIComponent(truncatedPreview || 'TradeStack')}`

        const imageUrl = fallbackImageUrl

        // Step 1: Create media container
        const mediaResponse = await fetch(
          `https://graph.facebook.com/v18.0/${socialAccount.instagram_account_id}/media`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              image_url: imageUrl,
              caption,
              access_token: socialAccount.access_token,
            }).toString(),
          }
        )

        if (!mediaResponse.ok) {
          const errorData = await mediaResponse.json().catch(() => ({}))
          throw new Error(errorData.error?.message || 'Failed to upload media to Instagram')
        }

        const mediaData = await mediaResponse.json()
        const creationId = mediaData.id

        if (!creationId) {
          throw new Error('Instagram media creation failed without an ID')
        }

        // Step 2: Publish media container
        const publishResponse = await fetch(
          `https://graph.facebook.com/v18.0/${socialAccount.instagram_account_id}/media_publish`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              creation_id: creationId,
              access_token: socialAccount.access_token,
            }).toString(),
          }
        )

        if (!publishResponse.ok) {
          const errorData = await publishResponse.json().catch(() => ({}))
          throw new Error(errorData.error?.message || 'Failed to publish Instagram media')
        }

        const publishData = await publishResponse.json()
        postId = publishData.id || creationId
      }

      // Update ad post record
      await supabase
        .from('ad_posts')
        .update({
          post_id: postId,
          status: 'posted',
          posted_at: new Date().toISOString(),
        })
        .eq('id', adPost.id)

      return NextResponse.json({
        success: true,
        postId,
        platform,
        message: `Successfully posted to ${platform === 'facebook' ? 'Facebook' : 'Instagram'}`,
      })

    } catch (error: any) {
      // Update ad post record with error
      await supabase
        .from('ad_posts')
        .update({
          status: 'failed',
          error_message: error.message,
        })
        .eq('id', adPost.id)

      return NextResponse.json(
        { error: error.message || 'Failed to post to social media' },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('Error posting to social media:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

