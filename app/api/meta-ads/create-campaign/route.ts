import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Create a paid Meta Ads (Facebook/Instagram) campaign
 * This creates a real paid ad campaign that will charge the user's ad account
 */
export async function POST(request: NextRequest) {
  try {
    const { 
      adTemplateId, 
      platform, // 'facebook' | 'instagram' | 'both'
      budget, // Daily budget in dollars
      targeting, // Targeting options (location, age, interests, etc.)
      adAccountId, // Facebook Ad Account ID
    } = await request.json()

    if (!adTemplateId || !platform || !budget || !adAccountId) {
      return NextResponse.json(
        { error: 'adTemplateId, platform, budget, and adAccountId are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get ad template
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

    // Get social media account for access token
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

    // Get page ID (required for ad campaigns)
    if (!socialAccount.page_id) {
      return NextResponse.json(
        { error: 'Facebook Page not found. Please connect a Facebook Page.' },
        { status: 400 }
      )
    }

    const accessToken = socialAccount.access_token
    const pageId = socialAccount.page_id

    // Create ad campaign using Facebook Marketing API
    // Step 1: Create Campaign
    const campaignName = `${template.headline} - ${template.service} - ${template.city}`
    const campaignResponse = await fetch(
      `https://graph.facebook.com/v18.0/${adAccountId}/campaigns`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: campaignName,
          objective: 'CONVERSIONS', // or 'REACH', 'TRAFFIC', 'ENGAGEMENT', etc.
          status: 'PAUSED', // Start paused so user can review
          special_ad_categories: [],
          access_token: accessToken,
        }),
      }
    )

    if (!campaignResponse.ok) {
      const errorData = await campaignResponse.json()
      throw new Error(errorData.error?.message || 'Failed to create campaign')
    }

    const campaignData = await campaignResponse.json()
    const campaignId = campaignData.id

    // Step 2: Create Ad Set
    const adSetName = `${campaignName} - Ad Set`
    const dailyBudget = Math.round(budget * 100) // Convert to cents
    
    // Default targeting (can be customized)
    const defaultTargeting = {
      geo_locations: {
        cities: targeting?.cities || [{ key: template.city, radius: 25, distance_unit: 'mile' }],
      },
      age_min: targeting?.ageMin || 18,
      age_max: targeting?.ageMax || 65,
      genders: targeting?.genders || [1, 2], // Both
      interests: targeting?.interests || [],
    }

    const adSetResponse = await fetch(
      `https://graph.facebook.com/v18.0/${adAccountId}/adsets`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: adSetName,
          campaign_id: campaignId,
          billing_event: 'IMPRESSIONS',
          optimization_goal: 'OFFSITE_CONVERSIONS',
          bid_amount: 2, // Bid amount in cents
          daily_budget: dailyBudget,
          targeting: defaultTargeting,
          status: 'PAUSED',
          promoted_object: {
            page_id: pageId,
          },
          access_token: accessToken,
        }),
      }
    )

    if (!adSetResponse.ok) {
      const errorData = await adSetResponse.json()
      // Delete campaign if ad set creation fails
      await fetch(
        `https://graph.facebook.com/v18.0/${campaignId}?access_token=${accessToken}`,
        { method: 'DELETE' }
      )
      throw new Error(errorData.error?.message || 'Failed to create ad set')
    }

    const adSetData = await adSetResponse.json()
    const adSetId = adSetData.id

    // Step 3: Create Ad Creative
    const creativeName = `${campaignName} - Creative`
    const caption = platform === 'facebook' 
      ? (template.fb_caption || template.body)
      : (template.instagram_caption || template.body)

    const creativeResponse = await fetch(
      `https://graph.facebook.com/v18.0/${adAccountId}/adcreatives`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: creativeName,
          object_story_spec: {
            page_id: pageId,
            link_data: {
              message: caption,
              link: process.env.NEXT_PUBLIC_SITE_URL || 'https://your-website.com',
              name: template.headline,
              description: template.body,
            },
          },
          access_token: accessToken,
        }),
      }
    )

    if (!creativeResponse.ok) {
      const errorData = await creativeResponse.json()
      // Clean up campaign and ad set
      await fetch(
        `https://graph.facebook.com/v18.0/${campaignId}?access_token=${accessToken}`,
        { method: 'DELETE' }
      )
      throw new Error(errorData.error?.message || 'Failed to create ad creative')
    }

    const creativeData = await creativeResponse.json()
    const creativeId = creativeData.id

    // Step 4: Create Ad
    const adName = `${campaignName} - Ad`
    const adResponse = await fetch(
      `https://graph.facebook.com/v18.0/${adAccountId}/ads`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: adName,
          adset_id: adSetId,
          creative: {
            creative_id: creativeId,
          },
          status: 'PAUSED', // Start paused
          access_token: accessToken,
        }),
      }
    )

    if (!adResponse.ok) {
      const errorData = await adResponse.json()
      // Clean up campaign, ad set, and creative
      await fetch(
        `https://graph.facebook.com/v18.0/${campaignId}?access_token=${accessToken}`,
        { method: 'DELETE' }
      )
      throw new Error(errorData.error?.message || 'Failed to create ad')
    }

    const adData = await adResponse.json()
    const adId = adData.id

    // Save campaign info to database
    await supabase
      .from('ad_posts')
      .insert({
        ad_template_id: adTemplateId,
        user_id: user.id,
        platform: platform === 'both' ? 'facebook' : platform,
        post_id: adId,
        status: 'posted',
        posted_at: new Date().toISOString(),
        metadata: {
          campaign_id: campaignId,
          ad_set_id: adSetId,
          creative_id: creativeId,
          budget,
          platform,
        },
      })

    return NextResponse.json({
      success: true,
      campaign_id: campaignId,
      ad_set_id: adSetId,
      ad_id: adId,
      creative_id: creativeId,
      message: 'Ad campaign created successfully. Campaign is paused - you can activate it in Facebook Ads Manager.',
      note: 'This is a PAID ad campaign. You will be charged based on your budget when the campaign is activated.',
    })
  } catch (error: any) {
    console.error('Error creating Meta Ads campaign:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create ad campaign' },
      { status: 400 }
    )
  }
}





