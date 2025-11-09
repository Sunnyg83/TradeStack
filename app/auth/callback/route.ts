import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/dashboard'
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, errorDescription)
    const loginUrl = new URL('/login', requestUrl.origin)
    loginUrl.searchParams.set('error', errorDescription || 'Authentication failed')
    return NextResponse.redirect(loginUrl)
  }

  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!exchangeError) {
      // Check if user has completed onboarding
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Check if profile exists
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single()

        // If no profile exists, redirect to onboarding
        if (!profile) {
          return NextResponse.redirect(new URL('/onboarding', requestUrl.origin))
        }
      }

      // Redirect to dashboard or the next parameter
      const redirectUrl = new URL(next, requestUrl.origin)
      return NextResponse.redirect(redirectUrl)
    } else {
      console.error('Error exchanging code for session:', exchangeError)
    }
  }

  // If there's an error or no code, redirect to login
  const loginUrl = new URL('/login', requestUrl.origin)
  if (!code) {
    loginUrl.searchParams.set('error', 'No authorization code received')
  }
  return NextResponse.redirect(loginUrl)
}

