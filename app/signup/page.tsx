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
              {loading ? '⏳ Creating account...' : '✨ Create Account'}
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

