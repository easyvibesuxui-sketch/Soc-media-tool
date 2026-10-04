'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Mail, MailCheck, Loader2, ArrowLeft } from 'lucide-react'
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase'
import { callbackUrl, friendlyAuthError } from '@/lib/auth'
import { Alert, AuthShell, SubmitButton, inputClass } from '@/components/auth/AuthUI'

const RESEND_COOLDOWN_S = 60

function ForgotForm() {
  const params = useSearchParams()
  // ?reason=browser|expired comes from /auth/callback when a reset link couldn't be used.
  const reason = params.get('reason')
  const [email, setEmail] = useState(params.get('email') ?? '')
  const [loading, setLoading] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  const send = async (to: string) => {
    if (!isSupabaseConfigured()) { setError('Password reset is not configured on this deployment.'); return }
    setLoading(true)
    setError(null)
    try {
      const { error } = await getSupabase().auth.resetPasswordForEmail(to, {
        redirectTo: callbackUrl('/reset-password'),
      })
      if (error) throw error
      setSentTo(to)
      setCooldown(RESEND_COOLDOWN_S)
    } catch (err) {
      setError(friendlyAuthError(err).message)
    } finally {
      setLoading(false)
    }
  }

  if (sentTo) {
    return (
      <div className="text-center">
        <div className="w-14 h-14 rounded-full bg-violet-50 flex items-center justify-center mx-auto mb-4">
          <MailCheck size={26} className="text-violet-600" />
        </div>
        <h1 className="text-xl font-extrabold text-gray-900 mb-2">Check your email</h1>
        {/* Deliberately neutral: Supabase doesn't reveal whether the address is registered. */}
        <p className="text-sm text-gray-500 mb-1">If an account exists for</p>
        <p className="text-sm font-semibold text-gray-900 mb-4 break-all">{sentTo}</p>
        <p className="text-xs text-gray-400 mb-6">
          you&apos;ll get a link to set a new password. Open it <strong>in this same browser</strong>.
          Check spam if it doesn&apos;t arrive in a minute.
        </p>
        {error && <div className="mb-3 text-left"><Alert tone="error">{error}</Alert></div>}
        <button
          type="button"
          onClick={() => send(sentTo)}
          disabled={cooldown > 0 || loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-700 hover:border-violet-300 hover:bg-violet-50 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
        >
          {loading && <Loader2 size={15} className="animate-spin" />}
          {cooldown > 0 ? `Resend link in ${cooldown}s` : 'Resend link'}
        </button>
        <button
          type="button"
          onClick={() => { setSentTo(null); setError(null) }}
          className="block w-full mt-3 text-xs text-gray-500 hover:text-violet-600"
        >
          Use a different email
        </button>
        <Link href="/login?mode=signin" className="block mt-2 text-xs text-gray-500 hover:text-violet-600">
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <>
      <Link href="/login?mode=signin" className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-violet-600 mb-4">
        <ArrowLeft size={13} /> Back to sign in
      </Link>

      {reason === 'browser' && (
        <div className="mb-4"><Alert tone="info">That reset link was opened in a different browser than the one you requested it from. Request a new link and open it here.</Alert></div>
      )}
      {reason === 'expired' && (
        <div className="mb-4"><Alert tone="info">That reset link has expired or was already used. Request a new one.</Alert></div>
      )}

      <h1 className="text-xl font-extrabold text-gray-900 mb-1">Forgot your password?</h1>
      <p className="text-sm text-gray-500 mb-6">Enter your email and we&apos;ll send you a link to set a new one.</p>

      <form onSubmit={e => { e.preventDefault(); send(email.trim()) }} className="space-y-3">
        <div className="relative">
          <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            required
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            autoFocus
            className={inputClass}
          />
        </div>
        {error && <Alert tone="error">{error}</Alert>}
        <SubmitButton loading={loading}>Send reset link</SubmitButton>
      </form>
    </>
  )
}

export default function ForgotPasswordPage() {
  return (
    <AuthShell footer={false}>
      <Suspense fallback={<div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-violet-400" /></div>}>
        <ForgotForm />
      </Suspense>
    </AuthShell>
  )
}
