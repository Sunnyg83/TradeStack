'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function ClientCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const run = async () => {
      const code = searchParams.get('code')
      const next = searchParams.get('next') || '/home'

      if (!code) {
        // No code – send back to login
        router.replace(
          `/login?error=${encodeURIComponent(
            'No authorization code received. Please try again.'
          )}`
        )
        return
      }

      try {
        const supabase = createClient()
        console.log('[Client callback] Exchanging code for session...', {
          codeLength: code.length,
        })

        const { data, error } = await supabase.auth.exchangeCodeForSession(code)

        if (error || !data?.session) {
          console.error(
            '[Client callback] Error exchanging code for session:',
            error
          )
          const message =
            error?.message || 'Sign in failed. Please try again.'
          router.replace(
            `/login?error=${encodeURIComponent(message)}`
          )
          return
        }

        console.log('[Client callback] Session created, redirecting to', next)
        router.replace(next)
      } catch (err: any) {
        console.error('[Client callback] Unexpected error:', err)
        router.replace(
          `/login?error=${encodeURIComponent(
            'An unexpected error occurred. Please try again.'
          )}`
        )
      }
    }

    run()
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-slate-600">Completing sign-in...</p>
      </div>
    </div>
  )
}

export default function ClientCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading...</p>
          </div>
        </div>
      }
    >
      <ClientCallbackContent />
    </Suspense>
  )
}



