'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { Sparkles, Lock, Eye, EyeOff, Check, Loader2 } from 'lucide-react'
import { PASSWORD_RULES } from '@/lib/auth'

/** Logo + card + legal footer shared by every auth page. */
export function AuthShell({ children, footer = true }: { children: ReactNode; footer?: boolean }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 flex flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="flex items-center gap-2 mb-8 group">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-200 group-hover:shadow-violet-300 transition-shadow">
          <Sparkles size={18} className="text-white" />
        </div>
        <span className="font-extrabold text-gray-900 text-xl">
          PostCraft<span className="text-violet-600"> AI</span>
        </span>
      </Link>

      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-100/60 p-8">
          {children}
        </div>
        {footer && (
          <p className="text-center text-xs text-gray-400 mt-5">
            By continuing you agree to our{' '}
            <Link href="/terms" className="underline hover:text-gray-600">Terms</Link>
            {' '}&amp;{' '}
            <Link href="/privacy" className="underline hover:text-gray-600">Privacy Policy</Link>
          </p>
        )}
      </div>
    </div>
  )
}

export function Alert({ tone, children }: { tone: 'error' | 'success' | 'info'; children: ReactNode }) {
  const styles = {
    error: 'bg-red-50 border-red-200 text-red-600',
    success: 'bg-green-50 border-green-200 text-green-700',
    info: 'bg-violet-50 border-violet-200 text-violet-700',
  }[tone]
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`border text-xs rounded-lg px-3 py-2 ${styles}`}>
      {children}
    </div>
  )
}

export function SubmitButton({ loading, children, disabled }: { loading: boolean; children: ReactNode; disabled?: boolean }) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white font-bold text-sm hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-md shadow-violet-200"
    >
      {loading && <Loader2 size={15} className="animate-spin" />}
      {children}
    </button>
  )
}

export const inputClass =
  'w-full pl-9 pr-10 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-300 transition-all'

export function PasswordField({
  value, onChange, placeholder, autoComplete, id, invalid,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  autoComplete: 'current-password' | 'new-password'
  id: string
  invalid?: boolean
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        id={id}
        required
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={invalid || undefined}
        className={`${inputClass} ${invalid ? 'border-red-300 focus:ring-red-200' : ''}`}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        aria-label={show ? 'Hide password' : 'Show password'}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  )
}

/** Live checklist under a new-password field; only shown once typing starts. */
export function PasswordRules({ password }: { password: string }) {
  if (!password) return null
  return (
    <ul className="space-y-1 text-xs" aria-label="Password requirements">
      {PASSWORD_RULES.map(r => {
        const ok = r.test(password)
        return (
          <li key={r.id} className={`flex items-center gap-1.5 ${ok ? 'text-green-600' : 'text-gray-400'}`}>
            <Check size={12} className={ok ? 'opacity-100' : 'opacity-30'} />
            {r.label}
          </li>
        )
      })}
    </ul>
  )
}
