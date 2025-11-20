'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function DebugAuthPage() {
  const [status, setStatus] = useState<any>({})
  const [cookies, setCookies] = useState<string[]>([])
  
  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient()
      
      // Get current user
      const { data: { user }, error } = await supabase.auth.getUser()
      
      // Get all cookies
      const allCookies = document.cookie.split(';').map(c => c.trim())
      
      setStatus({
        hasUser: !!user,
        userId: user?.id,
        userEmail: user?.email,
        error: error?.message,
        timestamp: new Date().toISOString()
      })
      
      setCookies(allCookies)
    }
    
    checkAuth()
  }, [])
  
  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">🔍 Auth Debug Info</h1>
      
      <div className="space-y-6">
        <div className="bg-slate-800 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">User Status</h2>
          <pre className="bg-slate-950 p-4 rounded overflow-auto text-xs">
            {JSON.stringify(status, null, 2)}
          </pre>
        </div>
        
        <div className="bg-slate-800 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Cookies ({cookies.length})</h2>
          <div className="bg-slate-950 p-4 rounded overflow-auto text-xs space-y-1">
            {cookies.length === 0 ? (
              <p className="text-red-400">No cookies found</p>
            ) : (
              cookies.map((cookie, i) => (
                <div key={i} className="border-b border-slate-700 pb-1">
                  {cookie}
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="flex gap-4">
          <a 
            href="/login"
            className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Go to Login
          </a>
          <a 
            href="/dashboard"
            className="px-6 py-3 bg-green-600 rounded-lg hover:bg-green-700"
          >
            Try Dashboard
          </a>
          <a 
            href="/onboarding"
            className="px-6 py-3 bg-purple-600 rounded-lg hover:bg-purple-700"
          >
            Try Onboarding
          </a>
        </div>
      </div>
    </div>
  )
}

