'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('[Server Action] Login error:', error)
    if (error.message.includes('Email not confirmed')) {
      return { error: 'Please confirm your email before signing in.' }
    } else if (error.message.includes('Invalid login credentials')) {
      return { error: 'Invalid email or password.' }
    }
    
    return { error: error.message }
  }

  if (!data.session) {
    return { error: 'Failed to create session' }
  }

  console.log('[Server Action] ✅ Login successful! User:', data.user.id)
  console.log('[Server Action] Session ID:', data.session.access_token.substring(0, 20) + '...')
  
  // Check if user has completed onboarding by checking if they have a profile
  console.log('[Server Action] Checking for profile...')
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', data.user.id)
    .maybeSingle() // Use maybeSingle instead of single to avoid errors if not found

  if (profileError) {
    console.error('[Server Action] Profile check error:', profileError)
  }

  console.log('[Server Action] Profile result:', profile ? 'Found' : 'Not found')

  // Revalidate the entire app to ensure middleware sees new cookies
  revalidatePath('/', 'layout')
  
  if (profile) {
    // User has completed onboarding → go to dashboard
    console.log('[Server Action] 🎯 Redirecting to /dashboard')
    redirect('/dashboard')
  } else {
    // First-time user → go to onboarding
    console.log('[Server Action] 🎯 Redirecting to /onboarding')
    redirect('/onboarding')
  }
}

