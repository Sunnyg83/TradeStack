import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    console.error('Missing Supabase environment variables')
    throw new Error('Missing Supabase environment variables')
  }

  // CRITICAL: Must provide cookie handlers or it defaults to localStorage
  // which the server cannot read!
  return createBrowserClient(url, key, {
    cookies: {
      getAll() {
        return document.cookie.split(';').map(cookie => {
          const [name, ...v] = cookie.trim().split('=')
          const value = v.join('=')
          return { name, value }
        }).filter(c => c.name && c.value)
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          let cookie = `${name}=${value}`
          
          if (options?.maxAge) {
            cookie += `; max-age=${options.maxAge}`
          }
          
          if (options?.path) {
            cookie += `; path=${options.path}`
          } else {
            cookie += '; path=/'
          }
          
          if (options?.sameSite) {
            cookie += `; samesite=${options.sameSite}`
          } else {
            cookie += '; samesite=lax'
          }
          
          if (window.location.protocol === 'https:' || options?.secure) {
            cookie += '; secure'
          }
          
          document.cookie = cookie
          console.log('[Client] Set cookie:', name)
        })
      }
    }
  })
}

