'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ClearCookiesPage() {
  const [status, setStatus] = useState('Clearing cookies...')
  const router = useRouter()

  useEffect(() => {
    // Clear all cookies client-side
    const cookies = document.cookie.split(';')
    let cleared = 0
    
    cookies.forEach(cookie => {
      const [name] = cookie.split('=')
      const cookieName = name.trim()
      
      // Delete the cookie with all possible paths and domains
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`
      
      if (cookieName.includes('sb-') || cookieName.includes('supabase')) {
        cleared++
      }
    })
    
    setStatus(`Cleared ${cleared} Supabase cookies. Redirecting to login...`)
    
    // Wait and redirect
    setTimeout(() => {
      window.location.href = '/login'
    }, 2000)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="bg-white rounded-xl p-8 shadow-lg border border-slate-200 max-w-md w-full text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Clearing Cookies</h1>
        <p className="text-slate-600">{status}</p>
      </div>
    </div>
  )
}


