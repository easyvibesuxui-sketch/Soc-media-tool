'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, KeyRound, CheckCircle2 } from 'lucide-react'
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase'
import { friendlyAuthError, passwordIsValid } from '@/lib/auth'
import { Alert, AuthShell, PasswordField, PasswordRules, SubmitButton } from '@/components/auth/AuthUI'

// Reached from the reset email via /auth/callback, which has already exchanged
// the recovery code for a session. Without that session there's nothing to update.
export default function ResetPasswordPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'checking' | 'ready' | 'no-session' | 'done'>('checking')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured()) return
    getSupabase().auth.getSession().then(({ data }) => {
      setStatus(data.session ? 'ready' : 'no-session')
    })
  }, [])

  useEffect(() => {
    if (status !== 'done') return
    const t = setTimeout(() => router.replace('/tool'), 1500)
    return () => clearTimeout(t)
  }, [status, router])

  const matches = password === confirm
  const blocked = !passwordIsValid(password) || !matches

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (blocked) return
    setLoading(true)
    setError(null)
    try {
      const { error } = await getSupabase().auth.updateUser({ password })
      if (error) throw error
      setStatus('done')
    } catch (err) {
      setError(friendlyAuthError(err).message)
    } finally {
      setLoading(false)
    }
  }

  if (!isSupabaseConfigured()) {
    return <AuthShell footer={false}><Alert tone="error">Password reset is not configured on this deployment.</Alert></AuthShell>
  }

  if (status === 'checking') {
    return (
      <AuthShell footer={false}>
        <div className="h-48 flex items-center justify-center"><Loader2 className="animate-spin text-violet-400" /></div>
      </AuthShell>
    )
  }

  if (status === 'no-session') {
    return (
      <AuthShell footer={false}>
        <div className="text-center">
          <h1 className="text-xl font-extrabold text-gray-900 mb-2">This link isn&apos;t valid anymore</h1>
          <p className="text-sm text-gray-500 mb-6">
            Reset links expire after a while, work only once, and must be opened in the browser you requested them from.
          </p>
          <Link
            href="/forgot-password"
            className="inline-flex items-center justify-center w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white font-bold text-sm hover:opacity-90 transition-all shadow-md shadow-violet-200"
          >
            Request a new link
          </Link>
          <Link href="/login?mode=signin" className="block mt-3 text-xs text-gray-500 hover:text-violet-600">Back to sign in</Link>
        </div>
      </AuthShell>
    )
  }

  if (status === 'done') {
    return (
      <AuthShell footer={false}>
        <div className="text-center">
          <CheckCircle2 size={40} className="text-green-500 mx-auto mb-3" />
          <h1 className="text-xl font-extrabold text-gray-900 mb-2">Password updated</h1>
          <p className="text-sm text-gray-500">Taking you to PostCraft…</p>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell footer={false}>
      <div className="w-12 h-12 rounded-full bg-violet-50 flex items-center justify-center mb-4">
        <KeyRound size={22} className="text-violet-600" />
      </div>
      <h1 className="text-xl font-extrabold text-gray-900 mb-1">Set a new password</h1>
      <p className="text-sm text-gray-500 mb-6">Choose a password you haven&apos;t used here before.</p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <PasswordField id="new-password" value={password} onChange={setPassword} placeholder="New password" autoComplete="new-password" />
        <PasswordRules password={password} />
        <PasswordField
          id="confirm-password"
          value={confirm}
          onChange={setConfirm}
          placeholder="Repeat new password"
          autoComplete="new-password"
          invalid={confirm.length > 0 && !matches}
        />
        {confirm.length > 0 && !matches && <p className="text-xs text-red-500">Passwords don&apos;t match.</p>}
        {error && <Alert tone="error">{error}</Alert>}
        <SubmitButton loading={loading} disabled={blocked}>Update password</SubmitButton>
      </form>
    </AuthShell>
  )
}
