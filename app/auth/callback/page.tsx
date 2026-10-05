'use client'

import { Suspense, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase'
import { safeNext } from '@/lib/auth'

// Landing page for every emailed auth link (confirm sign-up, reset password)
// and OAuth. supabase-js itself turns the URL into a session while it
// initialises (detectSessionInUrl) — this page must NOT exchange anything a
// second time. It used to call exchangeCodeForSession() after the client had
// already consumed the code, which always failed and bounced people back to
// "request a new link" in a loop.
function Callback() {
  const router = useRouter()
  const params = useSearchParams()
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true

    // Read the fragment BEFORE touching the client: it clears the hash once it
    // has taken the tokens out of it.
    const hash = new URLSearchParams(window.location.hash.slice(1))
    const linkType = hash.get('type') ?? params.get('type')
    const next = safeNext(params.get('next'))
    const isReset = linkType === 'recovery' || next === '/reset-password'

    // Expired / already-used links come back as error=…&error_code=… (hash or query).
    if (hash.get('error') || hash.get('error_code') || params.get('error') || params.get('error_code')) {
      router.replace(isReset ? '/forgot-password?reason=expired' : '/auth/error?reason=expired')
      return
    }

    if (!isSupabaseConfigured()) {
      router.replace('/auth/error')
      return
    }

    const sb = getSupabase()
    const go = () => router.replace(isReset ? '/reset-password' : next)

    // getSession() waits for initialisation, i.e. for the URL to be processed.
    sb.auth.getSession().then(async ({ data }) => {
      if (data.session) return go()

      // Links e-mailed before the switch to the implicit flow still carry a
      // PKCE ?code=. That only works in the browser that requested it.
      const code = params.get('code')
      if (code) {
        const { error } = await sb.auth.exchangeCodeForSession(code)
        if (!error) return go()
        // Sign-up links verify the address before redirecting, so the email is
        // confirmed even though this browser can't finish the sign-in.
        router.replace(isReset ? '/forgot-password?reason=expired' : '/login?verified=1')
        return
      }

      router.replace(isReset ? '/forgot-password?reason=expired' : '/auth/error')
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
