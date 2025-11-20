import { NextRequest, NextResponse } from 'next/server'

// Lightweight server-side callback:
// - Validates query params
// - Redirects to client-side callback where the Supabase browser client
//   will perform exchangeCodeForSession (bypassing SSR PKCE issues).

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/home'
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  console.log('OAuth callback received (server redirect only):', {
    code: code ? 'present' : 'missing',
    error,
    next,
    url: requestUrl.toString(),
  })

  // If the provider returned an error, send the user back to login
  if (error) {
    console.error('OAuth error (from provider):', error, errorDescription)
    const loginUrl = new URL('/login', requestUrl.origin)
    loginUrl.searchParams.set(
      'error',
      errorDescription || error || 'Authentication failed. Please try again.'
    )
    return NextResponse.redirect(loginUrl)
  }

  // If there is no code, we cannot continue the flow
  if (!code) {
    console.error('No authorization code received in callback')
    const loginUrl = new URL('/login', requestUrl.origin)
    loginUrl.searchParams.set(
      'error',
      'No authorization code received. Please try again.'
    )
    return NextResponse.redirect(loginUrl)
  }

  // Redirect to client-side callback page which will handle exchangeCodeForSession
  const clientCallbackUrl = new URL('/auth/client-callback', requestUrl.origin)
  clientCallbackUrl.searchParams.set('code', code)
  clientCallbackUrl.searchParams.set('next', next)

  return NextResponse.redirect(clientCallbackUrl)
}



