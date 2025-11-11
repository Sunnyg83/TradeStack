import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get social media accounts
    const { data: accounts, error } = await supabase
      .from('social_media_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch accounts' },
        { status: 500 }
      )
    }

    const facebookAccount = accounts?.find(acc => acc.platform === 'facebook')
    const hasFacebook = !!facebookAccount
    const hasInstagram = !!facebookAccount?.instagram_account_id

    return NextResponse.json({
      facebook: {
        connected: hasFacebook,
        pageName: facebookAccount?.page_name || null,
        hasInstagram: hasInstagram,
        instagramUsername: facebookAccount?.instagram_username || null,
      },
    })
  } catch (error: any) {
    console.error('Error checking Facebook status:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}


