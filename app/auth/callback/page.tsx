'use client'

import { Suspense, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase'

// The code exchange has to happen in the browser: the PKCE verifier was stored
// here by signInWithOAuth/signUp, and the session must end up here too. A
// server route can see neither, which is why the old route.ts never worked.
function Callback() {
  const router = useRouter()
  const params = useSearchParams()
  const started = useRef(false)

  useEffect(() => {
    // Strict mode runs effects twice; a code can only be exchanged once.
    if (started.current) return
    started.current = true

    const code = params.get('code')
    // Only same-site paths — "//evil.com" or "/\evil.com" would leave the site.
    const rawNext = params.get('next') ?? '/tool'
    const next = /^\/(?![/\\])/.test(rawNext) ? rawNext : '/tool'

    if (!code || !isSupabaseConfigured()) {
      router.replace('/auth/error')
      return
    }

    getSupabase().auth.exchangeCodeForSession(code).then(({ error }) => {
      router.replace(error ? '/auth/error' : next)
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
