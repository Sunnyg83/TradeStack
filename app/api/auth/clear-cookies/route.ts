import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()
  
  let deleted = 0
  // Delete ALL Supabase cookies
  allCookies.forEach(cookie => {
    if (cookie.name.includes('sb-') || cookie.name.includes('supabase')) {
      try {
        cookieStore.delete(cookie.name)
        deleted++
      } catch (err) {
        console.error('Failed to delete cookie:', cookie.name, err)
      }
    }
  })
  
  return NextResponse.json({ 
    success: true,
    deleted,
    message: `Cleared ${deleted} cookies`
  })
}
