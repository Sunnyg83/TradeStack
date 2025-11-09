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
  const [success, setSuccess] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const supabase = createClient()
      // Use window.location.origin which will be correct in production (https://trade-stack.vercel.app)
      // Make sure to also configure redirect URLs in Supabase dashboard (see SUPABASE_REDIRECT_SETUP.md)
      const redirectUrl = `${window.location.origin}/onboarding`
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
        },
      })

      if (error) {
        // Check if user already exists
        if (error.message.includes('already registered') || error.message.includes('User already registered')) {
          setError('An account with this email already exists. Please sign in or use forgot password if you don\'t remember your password.')
          return
        }
        throw error
      }

      // Check if email confirmation is required
      if (data.user && !data.session) {
        // Email confirmation required - show success message
        setSuccess(true)
        return
      }

      // If we have a session, go directly to onboarding
      if (data.session) {
        router.push('/onboarding')
        router.refresh()
      }
    } catch (error: any) {
      console.error('Signup error:', error)
      // Only set error if we haven't already set a custom one
      if (!error.message.includes('already registered')) {
        setError(error.message || 'An error occurred')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    setError('')
    setLoading(true)

    try {
      const supabase = createClient()
      const redirectUrl = `${window.location.origin}/auth/callback?next=/onboarding`
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      })

      if (error) throw error
      // User will be redirected to Google, then back to callback
    } catch (error: any) {
      setError(error.message || 'Failed to sign up with Google')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950">
      {/* Dark Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_70%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(14,165,233,0.08),transparent_70%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(56,189,248,0.08),transparent_70%)]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20"></div>
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md">
          {!success && (
            <div className="mb-8 text-center">
              <Link href="/" className="inline-flex items-center gap-2 mb-8">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/50">
                  <span className="text-white font-bold text-lg">T</span>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  TradeStack
                </span>
              </Link>
              <h1 className="mb-2 text-3xl font-bold text-white">Create Account</h1>
              <p className="text-slate-300">Start growing your trade business today</p>
            </div>
          )}

          {success ? (
            <div className="rounded-xl bg-slate-800/60 backdrop-blur-xl border border-blue-500/20 p-8 shadow-xl">
              <div className="text-center">
                <div className="mb-4 flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <h2 className="mb-2 text-2xl font-bold text-white">Check Your Email!</h2>
                <p className="mb-4 text-slate-300">
                  We've sent a confirmation email to <strong className="text-white">{email}</strong>
                </p>
                <p className="mb-6 text-sm text-slate-400">
                  Please click the confirmation link in your email to activate your account. Once confirmed, you can sign in and complete your profile setup.
                </p>
                <Link
                  href="/login"
                  className="inline-block rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 font-semibold text-white transition-all hover:from-blue-500 hover:to-cyan-500 shadow-lg shadow-blue-500/50 hover:shadow-xl"
                >
                  Go to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSignup} className="space-y-6 rounded-xl bg-slate-800/60 backdrop-blur-xl border border-blue-500/20 p-8 shadow-xl">
              {error && (
                <div className="rounded-lg bg-red-950/30 border border-red-500/20 p-3 text-sm text-red-400">
                  <p className="mb-2">{error}</p>
                  {error.includes('already exists') && (
                    <div className="mt-3 flex gap-2">
                      <Link
                        href="/login"
                        className="text-blue-400 hover:text-blue-300 underline text-xs"
                      >
                        Sign In
                      </Link>
                      <span className="text-slate-500">•</span>
                      <Link
                        href="/forgot-password"
                        className="text-blue-400 hover:text-blue-300 underline text-xs"
                      >
                        Forgot Password
                      </Link>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-300">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-2 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-300">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-2 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="••••••••"
                />
                <p className="mt-1 text-xs text-slate-400">Minimum 6 characters</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-3 font-semibold text-white transition-all hover:from-blue-500 hover:to-cyan-500 shadow-lg shadow-blue-500/50 hover:shadow-xl disabled:opacity-50"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-slate-800/60 text-slate-400">Or continue with</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignup}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-600 bg-slate-900/50 px-4 py-3 font-semibold text-white transition-all hover:bg-slate-900/70 hover:border-slate-500 disabled:opacity-50"
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
                {loading ? 'Signing up...' : 'Sign up with Google'}
              </button>
            </form>
          )}

          {!success && (
            <p className="mt-6 text-center text-slate-300">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium">
                Sign in
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

