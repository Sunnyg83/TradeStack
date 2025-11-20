import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const redirectTo = searchParams.get('redirect') || '/dashboard'
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    // User is authenticated, redirect to dashboard
    return NextResponse.redirect(new URL(redirectTo, request.url))
  }
  
  // No user found, redirect back to login
  return NextResponse.redirect(new URL('/login', request.url))
}


