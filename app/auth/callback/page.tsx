'use client'

import { Suspense, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase'
import { safeNext } from '@/lib/auth'

// The code exchange has to happen in the browser: the PKCE verifier was stored
// here by signUp / resetPasswordForEmail / signInWithOAuth, and the session must
// end up here too. A server route can see neither.
function Callback() {
  const router = useRouter()
  const params = useSearchParams()
  const started = useRef(false)

  useEffect(() => {
    // Strict mode runs effects twice; a code can only be exchanged once.
    if (started.current) return
    started.current = true

    const next = safeNext(params.get('next'))
    const isReset = next === '/reset-password'

    // Expired / already-used links come back as ?error=…&error_code=… (sometimes
    // in the hash) with no code.
    const hash = new URLSearchParams(window.location.hash.slice(1))
    const errorCode = params.get('error_code') ?? hash.get('error_code')
    if (errorCode || params.get('error') || hash.get('error')) {
      router.replace(isReset ? '/forgot-password?reason=expired' : '/auth/error?reason=expired')
      return
    }

    const code = params.get('code')
    if (!code || !isSupabaseConfigured()) {
      router.replace('/auth/error')
      return
    }

    getSupabase().auth.exchangeCodeForSession(code).then(({ error }) => {
      if (!error) {
        router.replace(next)
        return
      }
      // Getting a code means Supabase already verified the link, so a failed
      // exchange almost always means it was opened in another browser/profile
      // that lacks the PKCE verifier.
      // - Sign-up: the email IS confirmed — they just need to sign in.
      // - Reset: no session means no password change — they need a new link here.
      router.replace(isReset ? '/forgot-password?reason=browser' : '/login?verified=1')
    })
  }, [params, router])

  return <Loader2 size={28} className="animate-spin text-violet-500" />
}

export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-fuchsia-50">
      <Suspense fallback={<Loader2 size={28} className="animate-spin text-violet-500" />}>
        <Callback />
      </Suspense>
    </div>
  )
}
