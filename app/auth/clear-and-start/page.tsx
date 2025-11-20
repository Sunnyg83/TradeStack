'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function ClearAndStartContent() {
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/home'
  const retryCount = searchParams.get('retry') || '0'

  useEffect(() => {
    const startOAuth = async () => {
      // Clear all cookies first
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
      const projectRef = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1] || ''
      
      // Clear ALL Supabase cookies aggressively
      // Clear cookies with different path/domain combinations to ensure they're gone
      const cookieNames = new Set<string>()
      document.cookie.split(';').forEach(cookie => {
        const [name] = cookie.trim().split('=')
        if (
          name.startsWith('sb-') ||
          (projectRef && name.includes(projectRef)) ||
          name.includes('auth-token') ||
          name.includes('code-verifier') ||
          name.includes('verifier')
        ) {
          cookieNames.add(name.trim())
        }
      })
      
      // Clear each cookie with multiple combinations
      cookieNames.forEach(name => {
        // Clear with root path
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
        // Clear with domain
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`
        // Clear without domain
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=;`
        // Clear with .domain (for subdomain cookies)
        if (window.location.hostname.includes('.')) {
          const domain = '.' + window.location.hostname.split('.').slice(-2).join('.')
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain};`
        }
      })
      
      // Wait longer for cookies to clear
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Now start OAuth with fresh cookies
      const supabase = createClient()
      const redirectUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}&retry=${retryCount}`
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: false,
        },
      })

      if (error) {
        console.error('OAuth error:', error)
        window.location.href = `/login?error=${encodeURIComponent(error.message)}`
        return
      }

      if (data?.url) {
        window.location.href = data.url
      }
    }

    startOAuth()
  }, [next])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-slate-600">Starting Google sign-in...</p>
      </div>
    </div>
  )
}

export default function ClearAndStartPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    }>
      <ClearAndStartContent />
    </Suspense>
  )
}

