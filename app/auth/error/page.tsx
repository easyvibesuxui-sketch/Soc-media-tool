import Link from 'next/link'
import { Sparkles, AlertCircle } from 'lucide-react'

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 flex flex-col items-center justify-center px-4">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-200">
          <Sparkles size={18} className="text-white" />
        </div>
        <span className="font-extrabold text-gray-900 text-xl">
          PostCraft<span className="text-violet-600"> AI</span>
        </span>
      </Link>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-10 max-w-sm w-full text-center">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={28} className="text-red-500" />
        </div>
        <h1 className="text-xl font-extrabold text-gray-900 mb-2">Authentication failed</h1>
        <p className="text-sm text-gray-500 mb-6">
          Something went wrong during sign-in. This can happen if the link expired or was already used.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white font-bold text-sm hover:opacity-90 transition-all shadow-md shadow-violet-200"
        >
          Try again
        </Link>
        <Link href="/" className="block mt-3 text-xs text-gray-400 hover:text-gray-600 transition-colors">
          Back to home
        </Link>
      </div>
    </div>
  )
}
