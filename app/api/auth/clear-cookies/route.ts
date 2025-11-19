import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const response = NextResponse.next()
  
  // Clear all Supabase cookies by setting them to expire
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const projectRef = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1] || ''
  
  // Get all cookies and clear Supabase ones
  const allCookies = request.cookies.getAll()
  allCookies.forEach(cookie => {
    if (
      cookie.name.startsWith('sb-') ||
      (projectRef && cookie.name.includes(projectRef)) ||
      cookie.name.includes('auth-token') ||
      cookie.name.includes('code-verifier')
    ) {
      // Delete the cookie
      response.cookies.delete(cookie.name)
      // Also set to expire
      response.cookies.set(cookie.name, '', {
        expires: new Date(0),
        path: '/',
        maxAge: 0,
      })
    }
  })
  
  return response
}

