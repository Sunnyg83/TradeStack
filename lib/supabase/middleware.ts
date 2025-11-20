import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // Skip Supabase processing for auth routes to prevent stale cookie errors
  // Auth routes handle their own cookie management
  if (request.nextUrl.pathname.startsWith('/auth')) {
    return NextResponse.next()
  }
  
  // Check if Supabase env vars are configured
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    // Allow access to setup page, but block dashboard routes
    if (request.nextUrl.pathname.startsWith('/dashboard') || 
        request.nextUrl.pathname.startsWith('/onboarding')) {
      const url = request.nextUrl.clone()
      url.pathname = '/setup-required'
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  let supabase
  try {
    supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            try {
              const cookies = request.cookies.getAll()
              // Filter out corrupted cookies
              return cookies.filter(c => {
                if (!c.value || c.value.length === 0) return false
                
                // Skip if value looks like it's a JSON string (corrupted)
                if (c.value.startsWith('{"') || c.value.startsWith('%7B%22')) {
                  console.warn('[Middleware] Skipping corrupted cookie:', c.name)
                  return false
                }
                
                // Check for corrupted/non-UTF8 characters
                if (c.value.includes('�')) return false
                
                return true
              })
            } catch (err) {
              console.warn('Error reading cookies in middleware:', err)
              return []
            }
          },
        setAll(cookiesToSet) {
          try {
            // Update request cookies
            cookiesToSet.forEach(({ name, value, options }) => {
              try {
                request.cookies.set(name, value)
              } catch (err) {
                console.warn(`Error setting request cookie ${name}:`, err)
              }
            })
            
            // Create new response and set cookies properly
            supabaseResponse = NextResponse.next({
              request,
            })
            
            cookiesToSet.forEach(({ name, value, options }) => {
              try {
                supabaseResponse.cookies.set(name, value, {
                  ...options,
                  path: options?.path || '/',
                  sameSite: (options?.sameSite as 'lax' | 'strict' | 'none') || 'lax',
                })
              } catch (err) {
                console.warn(`Error setting response cookie ${name}:`, err)
              }
            })
          } catch (err) {
            // Silently handle cookie setting errors
            console.warn('Error in middleware setAll:', err)
          }
        },
      },
    }
  )
  } catch (err) {
    // If Supabase client creation fails, just continue without auth
    console.warn('Error creating Supabase client in middleware:', err)
    return NextResponse.next()
  }

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // Only proceed if Supabase client was created successfully
  if (!supabase) {
    return NextResponse.next()
  }

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    console.log('[Middleware] Auth check:', {
      pathname: request.nextUrl.pathname,
      hasUser: !!user,
      userId: user?.id,
      cookieCount: request.cookies.getAll().filter(c => c.name.includes('sb-')).length
    })

    if (
      !user &&
      !request.nextUrl.pathname.startsWith('/login') &&
      !request.nextUrl.pathname.startsWith('/signup') &&
      !request.nextUrl.pathname.startsWith('/forgot-password') &&
      !request.nextUrl.pathname.startsWith('/reset-password') &&
      !request.nextUrl.pathname.startsWith('/reset-auth') &&
      !request.nextUrl.pathname.startsWith('/reset') &&
      !request.nextUrl.pathname.startsWith('/auth') &&
      !request.nextUrl.pathname.startsWith('/clear-cookies') &&
      !request.nextUrl.pathname.startsWith('/api/facebook/connect') &&
      !request.nextUrl.pathname.startsWith('/biz') &&
      !request.nextUrl.pathname.startsWith('/website') &&
      !request.nextUrl.pathname.startsWith('/api') &&
      !request.nextUrl.pathname.startsWith('/setup-required') &&
      request.nextUrl.pathname !== '/'
    ) {
      // no user, potentially respond by redirecting the user to the login page
      console.log('[Middleware] No user found, redirecting to login from:', request.nextUrl.pathname)
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
  } catch (error) {
    console.error('[Middleware] Error checking auth:', error)
    // If auth check fails, allow public routes
    if (
      !request.nextUrl.pathname.startsWith('/dashboard') &&
      !request.nextUrl.pathname.startsWith('/onboarding')
    ) {
      return NextResponse.next()
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object instead of the supabaseResponse object

  return supabaseResponse
}

