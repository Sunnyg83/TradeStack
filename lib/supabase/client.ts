import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !key) {
      console.error('Missing Supabase environment variables. Please check your .env.local file.')
      // Return a mock client to prevent crashes
      return createBrowserClient('https://placeholder.supabase.co', 'placeholder-key')
    }

    return createBrowserClient(url, key)
  } catch (error) {
    console.error('Error creating Supabase client:', error)
    // Return a mock client to prevent crashes
    return createBrowserClient('https://placeholder.supabase.co', 'placeholder-key')
  }
}

