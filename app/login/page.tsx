'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail, Loader2, MailCheck } from 'lucide-react'
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase'
import { callbackUrl, friendlyAuthError, passwordIsValid, safeNext } from '@/lib/auth'
import { Alert, AuthShell, PasswordField, PasswordRules, SubmitButton, inputClass } from '@/components/auth/AuthUI'

// Google sign-in needs a Google Cloud OAuth client configured in Supabase.
// Until then the button would only lead to a raw "provider not enabled" error.
const GOOGLE_ENABLED = process.env.NEXT_PUBLIC_GOOGLE_AUTH === '1'

const RESEND_COOLDOWN_S = 60

// lucide has no Google mark (its `Chrome` icon is the browser logo), so the
// official multicolour "G" is inlined.
function GoogleLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  )
}

type Mode = 'signin' | 'signup'

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const next = safeNext(params.get('next'))
  // ?verified=1: email link opened in another browser — confirmed, but no session here.
  const verified = params.get('verified') === '1'

  const [mode, setMode] = useState<Mode>(() => {
    const m = params.get('mode')
    if (m === 'signin' || m === 'signup') return m
    return verified || params.has('next') ? 'signin' : 'signup'
  })
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<{ code: string; message: string } | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  // After sign-up we swap the form for a "check your email" screen.
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)
  const [resending, setResending] = useState(false)

  // Already signed in → no reason to see this page.
  useEffect(() => {
    if (!isSupabaseConfigured()) return
    getSupabase().auth.getSession().then(({ data }) => {
      if (data.session) router.replace(next)
    })
  }, [router, next])

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  const switchMode = (m: Mode) => {
    setMode(m)
    setError(null)
    setInfo(null)
    setConfirm('')
  }

  const passwordsMatch = password === confirm
  const signupBlocked = mode === 'signup' && (!passwordIsValid(password) || !passwordsMatch)

  const resendConfirmation = async (to: string) => {
    setResending(true)
    setError(null)
    setInfo(null)
    try {
      const { error } = await getSupabase().auth.resend({
        type: 'signup',
        email: to,
        options: { emailRedirectTo: callbackUrl(next) },
      })
      if (error) throw error
      setInfo(`We sent a new confirmation link to ${to}.`)
      setCooldown(RESEND_COOLDOWN_S)
    } catch (err) {
      setError(friendlyAuthError(err))
    } finally {
      setResending(false)
    }
  }

  const handleGoogle = async () => {
    setGoogleLoading(true)
    setError(null)
    const { error } = await getSupabase().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callbackUrl(next) },
    })
    // On success the browser navigates away; only failures land here.
    if (error) {
      setError(friendlyAuthError(error))
      setGoogleLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isSupabaseConfigured()) {
      setError({ code: '', message: 'Sign-in is not configured on this deployment.' })
      return
    }
    if (signupBlocked) return
    setLoading(true)
    setError(null)
    setInfo(null)
    const addr = email.trim()
    try {
      if (mode === 'signup') {
        const { data, error } = await getSupabase().auth.signUp({
          email: addr,
          password,
          options: { emailRedirectTo: callbackUrl(next) },
        })
        if (error) throw error
        // For an already-registered address Supabase returns a fake success
        // (no email is sent, to avoid revealing which emails exist) with an
        // empty `identities` list.
        if (data.user && data.user.identities?.length === 0) {
          switchMode('signin')
          setError({ code: 'user_already_exists', message: 'An account with this email already exists. Sign in, or reset your password if you forgot it.' })
          return
        }
        // Email confirmation off → Supabase signs the user in straight away.
        if (data.session) {
          router.replace(next)
          return
        }
        setSentTo(addr)
        setCooldown(RESEND_COOLDOWN_S)
      } else {
        const { error } = await getSupabase().auth.signInWithPassword({ email: addr, password })
        if (error) throw error
        router.replace(next)
      }
    } catch (err) {
      setError(friendlyAuthError(err))
    } finally {
      setLoading(false)
    }
  }

  // ── "Check your email" screen ─────────────────────────────────────
  if (sentTo) {
    return (
      <div className="text-center">
        <div className="w-14 h-14 rounded-full bg-violet-50 flex items-center justify-center mx-auto mb-4">
          <MailCheck size={26} className="text-violet-600" />
        </div>
        <h1 className="text-xl font-extrabold text-gray-900 mb-2">Check your email</h1>
        <p className="text-sm text-gray-500 mb-1">We sent a confirmation link to</p>
        <p className="text-sm font-semibold text-gray-900 mb-4 break-all">{sentTo}</p>
        <p className="text-xs text-gray-400 mb-6">
          Open the link <strong>in this same browser</strong> to finish signing in.
          Not there? Check spam or promotions.
        </p>

        <div className="space-y-3 text-left">
          {info && <Alert tone="success">{info}</Alert>}
          {error && <Alert tone="error">{error.message}</Alert>}
        </div>

        <button
          type="button"
          onClick={() => resendConfirmation(sentTo)}
          disabled={cooldown > 0 || resending}
          className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-700 hover:border-violet-300 hover:bg-violet-50 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
        >
          {resending && <Loader2 size={15} className="animate-spin" />}
          {cooldown > 0 ? `Resend email in ${cooldown}s` : 'Resend email'}
        </button>
        <button
          type="button"
          onClick={() => { setSentTo(null); setInfo(null); setError(null); setPassword(''); setConfirm('') }}
          className="block w-full mt-3 text-xs text-gray-500 hover:text-violet-600"
        >
          Wrong email? Use a different one
        </button>
        <button
          type="button"
          onClick={() => { setSentTo(null); switchMode('signin') }}
          className="block w-full mt-2 text-xs text-gray-500 hover:text-violet-600"
        >
          Already confirmed? Sign in
        </button>
      </div>
    )
  }

  // ── Sign in / sign up form ────────────────────────────────────────
  return (
    <>
      <div className="flex bg-gray-100 rounded-xl p-1 mb-6" role="tablist">
        {(['signup', 'signin'] as const).map(m => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => switchMode(m)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              mode === m ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {m === 'signup' ? 'Create account' : 'Sign in'}
          </button>
        ))}
      </div>

      {verified && mode === 'signin' && (
        <div className="mb-4"><Alert tone="success">Email confirmed. Sign in with your email and password.</Alert></div>
      )}

      <h1 className="text-xl font-extrabold text-gray-900 mb-1">
        {mode === 'signup' ? 'Create your free account' : 'Welcome back'}
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        {mode === 'signup'
          ? '5 free generations per day. No credit card.'
          : 'Sign in to keep creating.'}
      </p>

      {GOOGLE_ENABLED && (
        <>
          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border-2 border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:border-violet-300 hover:bg-violet-50 disabled:opacity-60 transition-all mb-4"
          >
            {googleLoading ? <Loader2 size={16} className="animate-spin" /> : <GoogleLogo />}
            Continue with Google
          </button>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">or use email</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
        </>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            id="email"
            required
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            className={inputClass}
          />
        </div>

        <PasswordField
          id="password"
          value={password}
          onChange={setPassword}
          placeholder={mode === 'signup' ? 'Create a password' : 'Your password'}
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
        />

        {mode === 'signup' && (
          <>
            <PasswordRules password={password} />
            <PasswordField
              id="confirm"
              value={confirm}
              onChange={setConfirm}
              placeholder="Repeat password"
              autoComplete="new-password"
              invalid={confirm.length > 0 && !passwordsMatch}
            />
            {confirm.length > 0 && !passwordsMatch && (
              <p className="text-xs text-red-500">Passwords don&apos;t match.</p>
            )}
          </>
        )}

        {mode === 'signin' && (
          <div className="text-right -mt-1">
            <Link
              href={`/forgot-password${email ? `?email=${encodeURIComponent(email.trim())}` : ''}`}
              className="text-xs font-semibold text-violet-600 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        )}

        {error && (
          <Alert tone="error">
            {error.message}
            {error.code === 'email_not_confirmed' && email && (
              <>
                {' '}
                <button
                  type="button"
                  onClick={() => resendConfirmation(email.trim())}
                  disabled={resending || cooldown > 0}
                  className="font-semibold underline disabled:opacity-60"
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend confirmation email'}
                </button>
              </>
            )}
            {error.code === 'invalid_credentials' && (
              <>
                {' '}
                <Link href={`/forgot-password?email=${encodeURIComponent(email.trim())}`} className="font-semibold underline">
                  Reset your password
                </Link>
              </>
            )}
          </Alert>
        )}
        {info && <Alert tone="success">{info}</Alert>}

        <SubmitButton loading={loading} disabled={signupBlocked}>
          {mode === 'signup' ? 'Create account' : 'Sign in'}
        </SubmitButton>
      </form>

      <p className="text-center text-xs text-gray-400 mt-4">
        {mode === 'signin' ? (
          <>Don&apos;t have an account?{' '}
            <button type="button" onClick={() => switchMode('signup')} className="text-violet-600 font-semibold hover:underline">Create one free</button>
          </>
        ) : (
          <>Already have an account?{' '}
            <button type="button" onClick={() => switchMode('signin')} className="text-violet-600 font-semibold hover:underline">Sign in</button>
          </>
        )}
      </p>
    </>
  )
}

export default function LoginPage() {
  return (
    <AuthShell>
      {/* useSearchParams needs a Suspense boundary to keep the shell prerendered. */}
      <Suspense fallback={<div className="h-80 flex items-center justify-center"><Loader2 className="animate-spin text-violet-400" /></div>}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  )
}
