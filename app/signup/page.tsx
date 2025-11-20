'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    console.log('[Signup] Starting signup process...')
    console.log('[Signup] Email:', email)
    console.log('[Signup] Password length:', password.length)

    try {
      const supabase = createClient()
      console.log('[Signup] Supabase client created')
      
      setSuccess('Creating account...')
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      })

      if (error) {
        console.error('[Signup] Error:', error)
        setSuccess('')
        throw error
      }

      console.log('[Signup] Success! User:', data.user?.id)
      console.log('[Signup] Session:', data.session ? 'Yes' : 'No')

      if (!data.session) {
        console.warn('[Signup] ⚠️ No session created - may need email confirmation')
      }

      // Redirect to onboarding after signup
      setSuccess('Account created! Redirecting...')
      console.log('[Signup] Redirecting to onboarding...')
      
      setTimeout(() => {
        router.push('/onboarding')
        router.refresh()
      }, 500)
    } catch (error: any) {
      console.error('[Signup] Exception:', error)
      setError(error.message || 'An error occurred')
      setLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    setError('')
    setLoading(true)

    try {
      const supabase = createClient()
      const redirectUrl = `${window.location.origin}/auth/callback`
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      })

      if (error) {
        console.error('OAuth error:', error)
        throw error
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred during Google signup')
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
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-50"></div>
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-2 mb-8">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/50">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                TradeStack
              </span>
            </Link>
            <h1 className="mb-2 text-3xl font-bold text-slate-900">Create Account</h1>
            <p className="text-slate-600">Get started with your free account</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-6 rounded-xl bg-white/80 backdrop-blur-xl border border-slate-200 p-8 shadow-xl">
            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/50 p-4 text-red-400 text-sm">
                ❌ {error}
              </div>
            )}

            {success && (
              <div className="rounded-lg bg-green-500/10 border border-green-500/50 p-4 text-green-400 text-sm">
                ✅ {success}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <input
                id="password"
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
              onClick={() => console.log('[Signup] Button clicked!')}
              className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-3 font-semibold text-white transition-all hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/50 hover:scale-105 active:scale-95"
            >
              {loading ? '⏳ Creating account...' : 'Create Account'}
            </button>

            <div className="relative flex items-center justify-center">
              <span className="absolute inset-x-0 h-px bg-slate-200"></span>
              <span className="relative bg-white px-4 text-sm text-slate-500">OR</span>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignup}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 rounded-lg border-2 border-slate-300 bg-white px-4 py-3 font-semibold text-slate-700 transition-all hover:bg-slate-50 hover:border-slate-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <p className="text-center text-sm text-slate-600">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-600 hover:text-blue-500 font-medium">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

