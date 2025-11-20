'use client'

import { useEffect } from 'react'

export default function ResetPage() {
  useEffect(() => {
    async function reset() {
      console.log('🧹 Clearing all cookies and storage...')
      
      // Clear ALL cookies
      const allCookies = document.cookie.split(';')
      allCookies.forEach(cookie => {
        const [name] = cookie.split('=')
        const cookieName = name.trim()
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`
      })
      
      // Clear localStorage
      localStorage.clear()
      
      // Clear sessionStorage
      sessionStorage.clear()
      
      // Clear server cookies
      await fetch('/api/auth/clear-cookies').catch(() => {})
      
      console.log('✅ All cookies and storage cleared!')
      
      // Wait and redirect
      setTimeout(() => {
        window.location.href = '/login'
      }, 1000)
    }
    
    reset()
  }, [])
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="text-center p-8 bg-white rounded-2xl shadow-xl border border-slate-200">
        <div className="mb-4 text-6xl">🧹</div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Cleaning up...</h1>
        <p className="text-slate-600">Clearing all cookies and storage</p>
        <p className="text-sm text-slate-400 mt-2">Redirecting to login...</p>
      </div>
    </div>
  )
}


