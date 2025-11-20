import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    
    const supabase = await createClient()
    
    console.log('[API Login] Attempting login for:', email)
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      console.error('[API Login] Error:', error.message)
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }
    
    if (!data.session || !data.user) {
      console.error('[API Login] No session or user returned')
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 401 }
      )
    }
    
    console.log('[API Login] Success! User:', data.user.email)
    console.log('[API Login] Session expires at:', data.session.expires_at)
    
    // Return success - cookies are set by the server client
    return NextResponse.json({
      success: true,
      redirectTo: '/dashboard'
    })
  } catch (error: any) {
    console.error('[API Login] Unexpected error:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

