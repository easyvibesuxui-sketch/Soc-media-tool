import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { AuthShell } from '@/components/auth/AuthUI'

export default function AuthErrorPage() {
  return (
    <AuthShell footer={false}>
      <div className="text-center">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={28} className="text-red-500" />
        </div>
        <h1 className="text-xl font-extrabold text-gray-900 mb-2">This link didn&apos;t work</h1>
        <p className="text-sm text-gray-500 mb-6">
          It may have expired or already been used. If you were confirming your email, sign in
          and we&apos;ll offer to send a fresh confirmation link.
        </p>
        <Link
          href="/login?mode=signin"
          className="inline-flex items-center justify-center w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white font-bold text-sm hover:opacity-90 transition-all shadow-md shadow-violet-200"
        >
          Go to sign in
        </Link>
        <Link href="/forgot-password" className="block mt-3 text-xs text-gray-500 hover:text-violet-600">
          Forgot your password?
        </Link>
        <Link href="/" className="block mt-2 text-xs text-gray-400 hover:text-gray-600">
          Back to home
        </Link>
      </div>
    </AuthShell>
  )
}
