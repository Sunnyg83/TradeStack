'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function TestSignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleTest = async () => {
    setLoading(true)
    setResult(null)
    console.log('🧪 TEST SIGNUP: Starting...')
    
    try {
      const supabase = createClient()
      console.log('🧪 TEST SIGNUP: Client created')
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })
      
      console.log('🧪 TEST SIGNUP: Response:', { data, error })
      
      setResult({
        success: !error,
        message: error ? error.message : 'Signup successful!',
        user: data?.user,
        session: data?.session ? 'Yes' : 'No',
        needsConfirm: data?.user && !data?.session,
      })
    } catch (err: any) {
      console.error('🧪 TEST SIGNUP: Exception:', err)
      setResult({
        success: false,
        message: err.message,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link href="/signup" className="text-blue-400 hover:underline">
            ← Back to Signup
          </Link>
        </div>

        <h1 className="text-4xl font-bold mb-8">🧪 Signup Test Page</h1>
        
        <div className="bg-slate-800 rounded-lg p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2 text-white"
              placeholder="newemail@gmail.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2 text-white"
              placeholder="TestPassword123!"
            />
          </div>

          <button
            onClick={handleTest}
            disabled={loading || !email || !password}
            className="w-full bg-green-600 hover:bg-green-500 px-4 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '⏳ Testing...' : '🧪 Test Signup'}
          </button>
        </div>

        {result && (
          <div className={`mt-6 p-6 rounded-lg ${result.success ? 'bg-green-500/10 border border-green-500/50' : 'bg-red-500/10 border border-red-500/50'}`}>
            <h2 className="text-xl font-bold mb-4">
              {result.success ? '✅ Signup Worked!' : '❌ Failed'}
            </h2>
            
            <div className="space-y-2 text-sm">
              <div>
                <strong>Message:</strong> {result.message}
              </div>
              
              {result.user && (
                <>
                  <div>
                    <strong>User ID:</strong> {result.user.id}
                  </div>
                  <div>
                    <strong>Email:</strong> {result.user.email}
                  </div>
                </>
              )}
              
              <div>
                <strong>Has Session:</strong> {result.session}
              </div>

              {result.needsConfirm && (
                <div className="mt-4 pt-4 border-t border-yellow-500/30 text-yellow-400">
                  ⚠️ User created but no session - email confirmation required
                </div>
              )}
            </div>

            {result.success && result.session === 'Yes' && (
              <div className="mt-4 pt-4 border-t border-green-500/30">
                <p className="text-green-400 font-semibold mb-2">
                  ✅ Perfect! Signup created a session immediately.
                </p>
                <p className="text-sm text-slate-300">
                  The actual /signup page should redirect you to /onboarding now.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 p-4 bg-slate-800/50 rounded-lg text-sm text-slate-400">
          <p className="font-semibold mb-2">💡 Instructions:</p>
          <p>1. Use a NEW email (not one you've used before)</p>
          <p>2. Use at least 6 characters for password</p>
          <p>3. Open browser console (F12) to see detailed logs</p>
        </div>
      </div>
    </div>
  )
}

