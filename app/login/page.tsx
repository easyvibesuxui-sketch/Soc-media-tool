'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Sparkles, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase'

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

// /auth/callback sends people here with ?verified=1 when the email link was
// opened in a different browser/profile: Supabase already confirmed the
// address, but the PKCE verifier lives in the original browser, so no session
// could be created here. They just need to sign in with their password.
// Isolated behind Suspense so useSearchParams doesn't opt the page out of prerendering.
function VerifiedNotice({ onSignIn }: { onSignIn: () => void }) {
  const params = useSearchParams()
  if (params.get('verified') !== '1') return null
  return (
    <div className="bg-green-50 border border-green-200 text-green-700 text-xs rounded-lg px-3 py-2 mb-4">
      Email confirmed. Sign in with your email and password.{' '}
      <button type="button" onClick={onSignIn} className="font-semibold underline">
        Sign in
      </button>
    </div>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'signin' | 'signup'>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleGoogle = async () => {
    if (!isSupabaseConfigured()) { setError('Auth not configured — add Supabase keys to .env.local'); return }
    setGoogleLoading(true)
    setError(null)
    try {
      await getSupabase().auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback?next=/tool` },
      })
    } catch {
      setError('Google sign-in failed. Try again.')
      setGoogleLoading(false)
    }
  }

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isSupabaseConfigured()) { setError('Auth not configured — add Supabase keys to .env.local'); return }
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      if (mode === 'signup') {
        const { data, error } = await getSupabase().auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/tool` },
        })
        if (error) throw error
        // For an already-registered address Supabase returns a fake success
        // (no email is sent, to avoid revealing which emails exist) with an
        // empty `identities` list. Say so instead of "check your email".
        if (data.user && data.user.identities?.length === 0) {
          setMode('signin')
          setError('An account with this email already exists. Sign in with your password.')
          return
        }
        setSuccess('Check your email — click the confirmation link to activate your account.')
      } else {
        const { error } = await getSupabase().auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/tool')
        router.refresh() // re-run server components with the new session
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mb-8 group">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-200 group-hover:shadow-violet-300 transition-shadow">
          <Sparkles size={18} className="text-white" />
        </div>
        <span className="font-extrabold text-gray-900 text-xl">
          PostCraft<span className="text-violet-600"> AI</span>
        </span>
      </Link>

      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-100/60 p-8">
          {/* Tabs */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            {(['signup', 'signin'] as const).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(null); setSuccess(null) }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                  mode === m ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {m === 'signup' ? 'Get Started' : 'Sign In'}
              </button>
            ))}
          </div>

          <Suspense fallback={null}>
            <VerifiedNotice onSignIn={() => { setMode('signin'); setError(null); setSuccess(null) }} />
          </Suspense>

          <h1 className="text-xl font-extrabold text-gray-900 mb-1">
            {mode === 'signup' ? 'Create your free account' : 'Welcome back'}
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            {mode === 'signup'
              ? '5 free generations per day. No credit card.'
              : 'Continue creating scroll-stopping content.'}
          </p>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border-2 border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:border-violet-300 hover:bg-violet-50 disabled:opacity-60 transition-all mb-4"
          >
            {googleLoading ? <Loader2 size={16} className="animate-spin" /> : <GoogleLogo />}
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">or use email</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Email form */}
          <form onSubmit={handleEmail} className="space-y-3">
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                required
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-300 transition-all"
              />
            </div>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                required
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? 'Create a password (6+ chars)' : 'Your password'}
                minLength={6}
                className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-300 transition-all"
              />
              <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg px-3 py-2">{error}</div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 text-xs rounded-lg px-3 py-2">{success}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white font-bold text-sm hover:opacity-90 disabled:opacity-60 transition-all shadow-md shadow-violet-200"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              {mode === 'signup' ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          {mode === 'signin' && (
            <p className="text-center text-xs text-gray-400 mt-4">
              Don&apos;t have an account?{' '}
              <button onClick={() => setMode('signup')} className="text-violet-600 font-semibold hover:underline">
                Sign up free
              </button>
            </p>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-5">
          By continuing you agree to our{' '}
          <Link href="/terms" className="underline hover:text-gray-600">Terms</Link>
          {' '}&amp;{' '}
          <Link href="/privacy" className="underline hover:text-gray-600">Privacy Policy</Link>
        </p>
      </div>
    </div>
  )
}
