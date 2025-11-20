'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { loginAction } from './actions'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [clearingCookies, setClearingCookies] = useState(false)

  useEffect(() => {
    // Check for error in URL params (from OAuth callback)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const errorParam = params.get('error')
      const debugErrorParam = params.get('debug_error')

      // In dev, log raw Supabase error details to the browser console for debugging
      if (debugErrorParam) {
        try {
          const raw = decodeURIComponent(debugErrorParam)
          // This will NOT show to end users, only in DevTools console
          // so you can see the exact Supabase error message
          console.log('[OAuth debug error from Supabase]', raw)
        } catch (e) {
          console.log('[OAuth debug error param present but could not be decoded]', debugErrorParam)
        }
      }

      if (errorParam) {
        const errorMsg = decodeURIComponent(errorParam)
        setError(errorMsg)
        
        // If it's a PKCE error, automatically clear cookies and show helpful message
        if (errorMsg.includes('PKCE') || errorMsg.includes('code verifier')) {
          // Clear all Supabase cookies automatically
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
          const projectRef = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1] || ''
          
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
          
          cookieNames.forEach(name => {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`
          })
          
          // Update error message to be more user-friendly
          setError('Session expired. Cookies have been cleared automatically. Please try signing in again.')
        }
        
        // Clean up URL
        window.history.replaceState({}, '', window.location.pathname)
      }
    }
  }, [])

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    console.log('[Login] Starting login...')
    
    // Create FormData from controlled state values
    const formData = new FormData()
    formData.append('email', email)
    formData.append('password', password)
    
    try {
      const result = await loginAction(formData)
      
      if (result?.error) {
        console.error('[Login] Error:', result.error)
        setError(result.error)
        setLoading(false)
      }
      // If no error, the server action will redirect
    } catch (error: any) {
      console.log('[Login] Caught error:', error)
      // Server actions throw on redirect - this is expected
      if (error?.message?.includes('NEXT_REDIRECT') || error?.digest?.includes('NEXT_REDIRECT')) {
        // Success - redirecting
        console.log('[Login] ✅ Redirect successful!')
        return
      }
      setError(error.message || 'An unexpected error occurred')
      setLoading(false)
    }
  }

  const handleClearCookies = async () => {
    setClearingCookies(true)
    
    try {
      // Call server API to clear cookies
      await fetch('/api/auth/clear-cookies')
      
      // Also clear client-side
      const cookies = document.cookie.split(';')
      cookies.forEach(cookie => {
        const [name] = cookie.split('=')
        const cookieName = name.trim()
        
        // Delete the cookie with all possible paths and domains
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`
      })
      
      setError('')
      setTimeout(() => {
        window.location.reload()
      }, 500)
    } catch (err) {
      setClearingCookies(false)
      setError('Failed to clear cookies')
    }
  }

  const handleGoogleLogin = async () => {
    setError('')
    setLoading(true)

    try {
      // Don't clear cookies before OAuth - Supabase needs to set the code verifier cookie
      // The callback route will handle corrupted cookies if needed
      const supabase = createClient()
      const redirectUrl = `${window.location.origin}/auth/callback?next=/home`
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: false,
        },
      })

      if (error) {
        console.error('OAuth error:', error)
        throw error
      }

      if (data?.url) {
        window.location.href = data.url
      } else {
        console.warn('No redirect URL returned from Supabase OAuth')
        setLoading(false)
      }
    } catch (error: any) {
      console.error('Google sign-in error:', error)
      setError(error.message || 'Failed to sign in with Google')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-white">
      {/* Light Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.05),transparent_70%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.04),transparent_70%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(59,130,246,0.04),transparent_70%)]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30"></div>
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-2 mb-8">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
                TradeStack
              </span>
            </Link>
            <h1 className="mb-2 text-3xl font-bold text-slate-900">Welcome Back</h1>
            <p className="text-slate-600">Sign in to your TradeStack account</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6 rounded-xl bg-white backdrop-blur-xl border border-slate-200 p-8 shadow-lg">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm">
                <div className="text-red-600 mb-2">{error}</div>
                {(error.includes('stale') || error.includes('cookie') || error.includes('session')) && (
                  <button
                    type="button"
                    onClick={handleClearCookies}
                    disabled={clearingCookies}
                    className="text-xs text-blue-600 hover:text-blue-500 underline"
                  >
                    {clearingCookies ? 'Clearing cookies...' : 'Clear cookies and try again'}
                  </button>
                )}
              </div>
            )}
            
            {success && (
              <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-600 flex items-center gap-2">
                <span>✅</span>
                <span>Login successful! Redirecting...</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-blue-600 hover:text-blue-500"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition-all hover:bg-blue-500 shadow-lg shadow-blue-500/30 hover:shadow-xl disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300"></div>
              </div>
              <div className="relative flex flex-col items-center gap-2 text-sm">
                <span className="px-2 bg-white text-slate-600">Or continue with</span>
                <button
                  type="button"
                  disabled
                  className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 font-semibold text-slate-400 cursor-not-allowed"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google sign-in temporarily disabled
                </button>
                <p className="text-xs text-slate-500">
                  You can still sign in with email and password while we fix Google.
                </p>
              </div>
            </div>
          </form>

          <p className="mt-6 text-center text-slate-600">
            Don't have an account?{' '}
            <Link href="/signup" className="text-blue-600 hover:text-blue-500 font-medium">
              Sign up
            </Link>
          </p>
          
          <p className="mt-2 text-center text-xs text-slate-500">
            Having trouble logging in?{' '}
            <button
              type="button"
              onClick={handleClearCookies}
              disabled={clearingCookies}
              className="text-blue-600 hover:text-blue-500 underline"
            >
              {clearingCookies ? 'Clearing...' : 'Clear cookies'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

