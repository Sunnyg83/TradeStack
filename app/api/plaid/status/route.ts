import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile with Plaid info
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('plaid_access_token, plaid_item_id, bank_account_id, bank_account_name, bank_account_mask, bank_account_type, plaid_account_status')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (!profile.plaid_access_token || profile.plaid_account_status !== 'connected') {
      return NextResponse.json({
        connected: false,
        status: 'not_connected',
      })
    }

    return NextResponse.json({
      connected: true,
      status: profile.plaid_account_status || 'connected',
      account: {
        id: profile.bank_account_id,
        name: profile.bank_account_name,
        mask: profile.bank_account_mask,
        type: profile.bank_account_type,
      },
    })
  } catch (error: any) {
    console.error('Error checking Plaid status:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to check bank account status' },
      { status: 500 }
    )
  }
}

