import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()
  
  // Delete all Supabase cookies
  allCookies.forEach(cookie => {
    if (cookie.name.includes('sb-') || cookie.name.includes('supabase')) {
      cookieStore.delete(cookie.name)
    }
  })
  
  return NextResponse.json({ 
    message: 'All Supabase cookies cleared',
    cleared: allCookies.filter(c => c.name.includes('sb-') || c.name.includes('supabase')).length
  })
}


