import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/home'
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  const retryCount = parseInt(requestUrl.searchParams.get('retry') || '0')

  console.log('OAuth callback received:', { 
    code: code ? 'present' : 'missing', 
    error, 
    next,
    retryCount,
    url: requestUrl.toString() 
  })

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, errorDescription)
    const loginUrl = new URL('/login', requestUrl.origin)
    loginUrl.searchParams.set('error', errorDescription || error || 'Authentication failed')
    return NextResponse.redirect(loginUrl)
  }

  if (!code) {
    console.error('No authorization code received in callback')
    const loginUrl = new URL('/login', requestUrl.origin)
    loginUrl.searchParams.set('error', 'No authorization code received. Please try again.')
    return NextResponse.redirect(loginUrl)
  }

  // Create response object - CRITICAL: must be created before Supabase client
  const response = NextResponse.next({ request })
  
  // Extract and validate code verifier cookie BEFORE Supabase tries to read it
  const allCookies = request.cookies.getAll()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const projectRef = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1] || ''
  
  // Find the code verifier cookie
  const codeVerifierCookie = allCookies.find(c => 
    c.name.includes('code-verifier') || 
    c.name.includes('code_verifier') ||
    (c.name.includes('verifier') && c.name.includes(projectRef))
  )
  
  // Clear ALL Supabase cookies from response EXCEPT the code verifier
  // This prevents stale cookie errors from corrupted cookies
  allCookies.forEach(cookie => {
    if (
      (cookie.name.startsWith('sb-') || 
       (projectRef && cookie.name.includes(projectRef)) ||
       cookie.name.includes('auth-token')) &&
      !cookie.name.includes('code-verifier') &&
      !cookie.name.includes('code_verifier') &&
      !(cookie.name.includes('verifier') && cookie.name.includes(projectRef))
    ) {
      // Clear corrupted Supabase cookies
      response.cookies.delete(cookie.name)
      response.cookies.set(cookie.name, '', {
        expires: new Date(0),
        path: '/',
        maxAge: 0,
      })
    }
  })
  
  // If no code verifier cookie, redirect to login
  if (!codeVerifierCookie || !codeVerifierCookie.value) {
    console.error('No code verifier cookie found')
    const loginUrl = new URL('/login', requestUrl.origin)
    loginUrl.searchParams.set('error', 'Session expired. Please try signing in again.')
    return NextResponse.redirect(loginUrl)
  }
  
  // Create Supabase client - only pass the code verifier cookie and non-Supabase cookies
  // This prevents stale cookie errors
  let supabase
  try {
    supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            // Only return the code verifier cookie and non-Supabase cookies
            // This prevents Supabase SSR from trying to decode corrupted cookies
            return allCookies.filter(cookie => {
              // Always include the code verifier cookie
              if (cookie.name === codeVerifierCookie.name) {
                return true
              }
              // Include non-Supabase cookies
              if (!cookie.name.startsWith('sb-') && 
                  !(projectRef && cookie.name.includes(projectRef)) &&
                  !cookie.name.includes('auth-token')) {
                return true
              }
              // Exclude all other Supabase cookies to prevent stale cookie errors
              return false
            })
          },
          setAll(cookiesToSet) {
            try {
              // Set cookies on response
              cookiesToSet.forEach(({ name, value, options }) => {
                try {
                  request.cookies.set(name, value)
                  response.cookies.set(name, value, {
                    ...options,
                    path: options?.path || '/',
                    sameSite: (options?.sameSite as 'lax' | 'strict' | 'none') || 'lax',
                    httpOnly: options?.httpOnly !== false,
                    secure: options?.secure || false,
                  })
                } catch (cookieErr) {
                  // Silently handle cookie setting errors
                  console.warn(`Error setting cookie ${name}:`, cookieErr)
                }
              })
            } catch (err) {
              // Silently handle cookie setting errors
              console.warn('Error in setAll:', err)
            }
          },
        },
      }
    )
  } catch (err) {
    // If Supabase client creation fails, redirect to login
    console.error('Error creating Supabase client:', err)
    const loginUrl = new URL('/login', requestUrl.origin)
    loginUrl.searchParams.set('error', 'Failed to initialize authentication. Please try again.')
    return NextResponse.redirect(loginUrl)
  }

  try {
    // Exchange the code for a session
    // Supabase will look for the code_verifier in cookies automatically
    console.log('Attempting to exchange code for session...')
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error('Error exchanging code for session:', exchangeError)
      console.error('Error details:', {
        message: exchangeError.message,
        status: exchangeError.status,
        code: exchangeError.code,
      })
      
      // If PKCE fails, redirect to login - don't retry automatically to prevent loops
      // The user can try again manually after clearing cookies if needed
      if (exchangeError.message?.includes('code verifier') || exchangeError.message?.includes('PKCE')) {
        console.error('PKCE error - code verifier cookie is corrupted or missing')
        const loginUrl = new URL('/login', requestUrl.origin)
        loginUrl.searchParams.set('error', 'Session expired. Please try signing in again.')
        return NextResponse.redirect(loginUrl)
      }
      
      // For other errors, redirect to login with error message
      const loginUrl = new URL('/login', requestUrl.origin)
      loginUrl.searchParams.set('error', exchangeError.message || 'Failed to authenticate. Please try again.')
      return NextResponse.redirect(loginUrl)
    }

    if (!data?.session) {
      console.error('No session created after code exchange')
      const loginUrl = new URL('/login', requestUrl.origin)
      loginUrl.searchParams.set('error', 'Failed to create session. Please try again.')
      return NextResponse.redirect(loginUrl)
    }

    console.log('Session created successfully, checking user profile...')

    // Check if user has completed onboarding
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      // Check if profile exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      // If no profile exists, redirect to onboarding
      if (!profile && !profileError) {
        console.log('No profile found, redirecting to onboarding')
        const onboardingUrl = new URL('/onboarding', requestUrl.origin)
        // Create redirect and copy cookies
        const redirectResponse = NextResponse.redirect(onboardingUrl)
        response.cookies.getAll().forEach(cookie => {
          redirectResponse.cookies.set(cookie.name, cookie.value, {
            path: '/',
            sameSite: 'lax',
            httpOnly: true,
          })
        })
        return redirectResponse
      }
    }

    // Success - redirect to home/dashboard
    console.log('Authentication successful, redirecting to:', next)
    const redirectUrl = new URL(next, requestUrl.origin)
    
    // Create redirect response and copy all cookies from response
    const redirectResponse = NextResponse.redirect(redirectUrl)
    
    // Copy all cookies from response to redirectResponse
    response.cookies.getAll().forEach(cookie => {
      redirectResponse.cookies.set(cookie.name, cookie.value, {
        path: '/',
        sameSite: 'lax',
        httpOnly: true,
      })
    })
    
    return redirectResponse
  } catch (err: any) {
    console.error('Unexpected error in callback:', err)
    const loginUrl = new URL('/login', requestUrl.origin)
    loginUrl.searchParams.set('error', 'An unexpected error occurred. Please try again.')
    return NextResponse.redirect(loginUrl)
  }
}

