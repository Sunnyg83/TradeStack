import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const next = searchParams.get('next') || '/home'
  const retryCount = searchParams.get('retry') || '0'
  
  // Create response that clears all Supabase cookies
  const response = NextResponse.redirect(new URL('/auth/clear-and-start', request.url))
  
  // Clear all Supabase cookies by setting them to expire
  const allCookies = request.cookies.getAll()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const projectRef = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1] || ''
  
  allCookies.forEach(cookie => {
    if (
      cookie.name.startsWith('sb-') ||
      (projectRef && cookie.name.includes(projectRef)) ||
      cookie.name.includes('auth-token') ||
      cookie.name.includes('code-verifier') ||
      cookie.name.includes('code_verifier')
    ) {
      // Delete the cookie with multiple path/domain combinations to ensure it's cleared
      response.cookies.delete(cookie.name)
      // Set to expire in the past
      response.cookies.set(cookie.name, '', {
        expires: new Date(0),
        path: '/',
        maxAge: 0,
        httpOnly: true,
        sameSite: 'lax',
      })
      // Also try with root path
      response.cookies.set(cookie.name, '', {
        expires: new Date(0),
        path: '/',
        maxAge: 0,
      })
    }
  })
  
  // Add next and retry parameters to the redirect URL
  const redirectUrl = new URL('/auth/clear-and-start', request.url)
  redirectUrl.searchParams.set('next', next)
  redirectUrl.searchParams.set('retry', retryCount)
  
  return NextResponse.redirect(redirectUrl)
}

