'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function TestLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleTest = async () => {
    setLoading(true)
    setResult(null)
    console.log('🧪 TEST: Starting login test...')
    
    try {
      const supabase = createClient()
      console.log('🧪 TEST: Client created')
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      console.log('🧪 TEST: Response:', { data, error })
      
      setResult({
        success: !error,
        message: error ? error.message : 'Login successful!',
        user: data?.user,
        session: data?.session ? 'Yes' : 'No',
      })
    } catch (err: any) {
      console.error('🧪 TEST: Exception:', err)
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
          <Link href="/login" className="text-blue-400 hover:underline">
            ← Back to Login
          </Link>
        </div>

        <h1 className="text-4xl font-bold mb-8">🧪 Login Test Page</h1>
        
        <div className="bg-slate-800 rounded-lg p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2 text-white"
              placeholder="testuser@gmail.com"
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
            className="w-full bg-blue-600 hover:bg-blue-500 px-4 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '⏳ Testing...' : '🧪 Test Login'}
          </button>
        </div>

        {result && (
          <div className={`mt-6 p-6 rounded-lg ${result.success ? 'bg-green-500/10 border border-green-500/50' : 'bg-red-500/10 border border-red-500/50'}`}>
            <h2 className="text-xl font-bold mb-4">
              {result.success ? '✅ Success!' : '❌ Failed'}
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
              
              {result.session && (
                <div>
                  <strong>Has Session:</strong> {result.session}
                </div>
              )}
            </div>

            {result.success && (
              <div className="mt-4 pt-4 border-t border-green-500/30">
                <p className="text-green-400 font-semibold">
                  ✅ Auth is working! The issue is somewhere else.
                </p>
              </div>
            )}

            {!result.success && result.message?.includes('Email not confirmed') && (
              <div className="mt-4 pt-4 border-t border-red-500/30">
                <p className="text-red-400 font-semibold mb-2">
                  ⚠️ Email confirmation required!
                </p>
                <p className="text-sm text-slate-300">
                  Go to Supabase Dashboard → Authentication → Providers → Email → Uncheck "Confirm email"
                </p>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 p-4 bg-slate-800/50 rounded-lg text-sm text-slate-400">
          <p className="font-semibold mb-2">💡 Tip:</p>
          <p>Open your browser console (F12) to see detailed logs.</p>
        </div>
      </div>
    </div>
  )
}

