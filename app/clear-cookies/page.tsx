'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function ClearCookiesPage() {
  const [status, setStatus] = useState<'idle' | 'clearing' | 'done'>('idle')
  const router = useRouter()

  const clearAll = async () => {
    setStatus('clearing')
    
    try {
      // Sign out from Supabase
      try {
        const supabase = createClient()
        await supabase.auth.signOut()
      } catch (e) {
        console.log('Supabase sign out failed (expected if cookies corrupted)')
      }
      
      // Clear ALL cookies aggressively
      const cookies = document.cookie.split(";")
      
      // Clear each cookie with all possible path/domain combinations
      cookies.forEach((cookie) => {
        const [name] = cookie.trim().split("=")
        if (name) {
          // Clear with different path combinations
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname}`
        }
      })
      
      // Clear localStorage
      localStorage.clear()
      
      // Clear sessionStorage
      sessionStorage.clear()
      
      // Clear IndexedDB
      if (window.indexedDB) {
        const dbs = await window.indexedDB.databases()
        dbs.forEach(db => {
          if (db.name) window.indexedDB.deleteDatabase(db.name)
        })
      }
      
      setStatus('done')
      
      console.log('✅ Everything cleared!')
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        window.location.href = '/login' // Hard reload
      }, 2000)
    } catch (err) {
      console.error('Error clearing:', err)
      setStatus('done')
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-slate-800 rounded-xl p-8 border border-blue-500/20">
        <h1 className="text-3xl font-bold mb-4">🍪 Clear Cookies</h1>
        
        {status === 'idle' && (
          <>
            <p className="text-slate-300 mb-6">
              This will clear all cookies, localStorage, and sign you out.
              Use this if you're getting stale cookie errors.
            </p>
            
            <button
              onClick={clearAll}
              className="w-full bg-red-600 hover:bg-red-500 px-4 py-3 rounded-lg font-semibold mb-4"
            >
              🗑️ Clear Everything
            </button>
            
            <Link
              href="/login"
              className="block w-full text-center text-blue-400 hover:underline"
            >
              ← Back to Login
            </Link>
          </>
        )}
        
        {status === 'clearing' && (
          <div className="text-center">
            <div className="animate-spin text-6xl mb-4">⏳</div>
            <p className="text-xl">Clearing...</p>
          </div>
        )}
        
        {status === 'done' && (
          <div className="text-center">
            <div className="text-6xl mb-4">✅</div>
            <p className="text-xl mb-2">All cleared!</p>
            <p className="text-slate-400">Redirecting to login...</p>
          </div>
        )}
      </div>
    </div>
  )
}
