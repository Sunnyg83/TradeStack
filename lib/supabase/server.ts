import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Missing Supabase environment variables')
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          // Filter out any corrupted cookies
          const allCookies = cookieStore.getAll()
          const validCookies = allCookies.filter(cookie => {
            // Skip if value looks like it's a JSON string (corrupted)
            if (cookie.value && cookie.value.startsWith('{"')) {
              console.warn('[Server] Skipping corrupted cookie:', cookie.name)
              // Delete the corrupted cookie
              try {
                cookieStore.delete(cookie.name)
              } catch {}
              return false
            }
            return true
          })
          console.log('[Server] Valid cookies:', validCookies.map(c => c.name))
          return validCookies
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              const cookieOptions = {
                ...options,
                path: options?.path || '/',
                sameSite: (options?.sameSite as 'lax' | 'strict' | 'none') || 'lax',
                secure: process.env.NODE_ENV === 'production',
                httpOnly: options?.httpOnly ?? false,
              }
              cookieStore.set(name, value, cookieOptions)
              console.log('[Server] Set cookie:', name, 'with options:', cookieOptions)
            })
          } catch (error) {
            console.error('[Server] Error setting cookies:', error)
          }
        },
      },
    }
  )
}

