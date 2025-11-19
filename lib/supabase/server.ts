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
          try {
            // Filter out corrupted cookies to prevent stale cookie errors
            const cookies = cookieStore.getAll()
            return cookies.filter(c => {
              if (!c.value || c.value.length === 0) return false
              // Check for corrupted UTF-8 (replacement characters)
              try {
                if (c.value.includes('�')) return false
                // Try to decode to validate
                decodeURIComponent(c.value)
                return true
              } catch {
                // If decoding fails, filter it out to prevent stale cookie errors
                return false
              }
            })
          } catch (err) {
            // If cookie reading fails, return empty array to prevent errors
            console.warn('Error reading cookies in server client:', err)
            return []
          }
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

