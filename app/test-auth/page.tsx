'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TestAuthPage() {
  const [email, setEmail] = useState('test@example.com')
  const [password, setPassword] = useState('password123')
  const [status, setStatus] = useState<string[]>([])
  const [user, setUser] = useState<any>(null)

  const addLog = (message: string) => {
    setStatus(prev => [...prev, `${new Date().toISOString()}: ${message}`])
    console.log(message)
  }

  const testSignUp = async () => {
    setStatus([])
    addLog('🧪 Testing Sign Up...')
    
    try {
      const supabase = createClient()
      addLog('✅ Supabase client created')
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })
      
      if (error) {
        addLog(`❌ Sign up error: ${error.message}`)
        return
      }
      
      addLog(`✅ Sign up successful!`)
      addLog(`User ID: ${data.user?.id}`)
      addLog(`Email: ${data.user?.email}`)
      addLog(`Session: ${data.session ? 'Yes' : 'No'}`)
      setUser(data.user)
    } catch (err: any) {
      addLog(`❌ Exception: ${err.message}`)
    }
  }

  const testSignIn = async () => {
    setStatus([])
    addLog('🧪 Testing Sign In...')
    
    try {
      const supabase = createClient()
      addLog('✅ Supabase client created')
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        addLog(`❌ Sign in error: ${error.message}`)
        return
      }
      
      addLog(`✅ Sign in successful!`)
      addLog(`User ID: ${data.user?.id}`)
      addLog(`Email: ${data.user?.email}`)
      addLog(`Session: ${data.session ? 'Yes' : 'No'}`)
      setUser(data.user)
    } catch (err: any) {
      addLog(`❌ Exception: ${err.message}`)
    }
  }

  const testGetUser = async () => {
    setStatus([])
    addLog('🧪 Testing Get User...')
    
    try {
      const supabase = createClient()
      addLog('✅ Supabase client created')
      
      const { data, error } = await supabase.auth.getUser()
      
      if (error) {
        addLog(`❌ Get user error: ${error.message}`)
        return
      }
      
      if (data.user) {
        addLog(`✅ User found!`)
        addLog(`User ID: ${data.user.id}`)
        addLog(`Email: ${data.user.email}`)
        setUser(data.user)
      } else {
        addLog(`⚠️ No user logged in`)
      }
    } catch (err: any) {
      addLog(`❌ Exception: ${err.message}`)
    }
  }

  const testSignOut = async () => {
    setStatus([])
    addLog('🧪 Testing Sign Out...')
    
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        addLog(`❌ Sign out error: ${error.message}`)
        return
      }
      
      addLog(`✅ Sign out successful!`)
      setUser(null)
    } catch (err: any) {
      addLog(`❌ Exception: ${err.message}`)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">🧪 Auth Test Page</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Test Credentials */}
          <div className="bg-slate-800 rounded-lg p-6 border border-blue-500/20">
            <h2 className="text-xl font-bold text-white mb-4">Test Credentials</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white"
                />
              </div>
            </div>
          </div>

          {/* Current User */}
          <div className="bg-slate-800 rounded-lg p-6 border border-blue-500/20">
            <h2 className="text-xl font-bold text-white mb-4">Current User</h2>
            {user ? (
              <div className="space-y-2 text-sm">
                <p className="text-green-400">✅ Logged In</p>
                <p className="text-slate-300">ID: {user.id}</p>
                <p className="text-slate-300">Email: {user.email}</p>
              </div>
            ) : (
              <p className="text-slate-400">No user logged in</p>
            )}
          </div>
        </div>

        {/* Test Buttons */}
        <div className="bg-slate-800 rounded-lg p-6 border border-blue-500/20 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Tests</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={testSignUp}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-3 rounded-lg font-semibold transition"
            >
              Sign Up
            </button>
            <button
              onClick={testSignIn}
              className="bg-green-600 hover:bg-green-500 text-white px-4 py-3 rounded-lg font-semibold transition"
            >
              Sign In
            </button>
            <button
              onClick={testGetUser}
              className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-3 rounded-lg font-semibold transition"
            >
              Get User
            </button>
            <button
              onClick={testSignOut}
              className="bg-red-600 hover:bg-red-500 text-white px-4 py-3 rounded-lg font-semibold transition"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Status Log */}
        <div className="bg-slate-800 rounded-lg p-6 border border-blue-500/20">
          <h2 className="text-xl font-bold text-white mb-4">Status Log</h2>
          <div className="bg-slate-900 rounded p-4 max-h-96 overflow-auto">
            {status.length === 0 ? (
              <p className="text-slate-500 text-sm">Click a test button to see results...</p>
            ) : (
              <div className="space-y-1">
                {status.map((log, i) => (
                  <div key={i} className="text-sm font-mono text-slate-300">
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 flex gap-4">
          <a href="/signup" className="text-blue-400 hover:text-blue-300">→ Go to Sign Up</a>
          <a href="/login" className="text-blue-400 hover:text-blue-300">→ Go to Login</a>
          <a href="/dashboard" className="text-blue-400 hover:text-blue-300">→ Go to Dashboard</a>
        </div>
      </div>
    </div>
  )
}

