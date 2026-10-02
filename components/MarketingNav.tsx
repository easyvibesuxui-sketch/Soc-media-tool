'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Sparkles, Menu, X, Zap, LogOut, User } from 'lucide-react'
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export default function MarketingNav() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<SupabaseUser | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured()) return
    const sb = getSupabase()
    sb.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null))
    const { data: listener } = sb.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    if (!isSupabaseConfigured()) return
    await getSupabase().auth.signOut()
    router.push('/')
    router.refresh() // re-run server components without the session
  }

  const avatar = user?.user_metadata?.avatar_url as string | undefined
  const initials = (user?.email ?? 'U')[0].toUpperCase()

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-md group-hover:shadow-violet-200 transition-shadow">
            <Sparkles size={16} className="text-white" />
          </div>
          <span className="font-extrabold text-gray-900 text-lg tracking-tight">
            PostCraft<span className="text-violet-600"> AI</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/tool" className="text-sm font-medium text-gray-600 hover:text-violet-600 transition-colors">
            Tool
          </Link>
          <Link href="/blog" className="text-sm font-medium text-gray-600 hover:text-violet-600 transition-colors">
            Blog
          </Link>
          <Link href="/about" className="text-sm font-medium text-gray-600 hover:text-violet-600 transition-colors">
            About
          </Link>
          <Link href="/contact" className="text-sm font-medium text-gray-600 hover:text-violet-600 transition-colors">
            Contact
          </Link>
        </nav>

        {/* CTA / Auth */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <Link
                href="/tool"
                className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white font-semibold hover:opacity-90 transition-all shadow-md hover:shadow-violet-200"
              >
                <Zap size={14} className="text-yellow-300" />
                Open Tool
              </Link>
              {/* Avatar + sign out */}
              <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
                {avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatar} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-bold">
                    {initials}
                  </div>
                )}
                <button
                  onClick={handleSignOut}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  title="Sign out"
                >
                  <LogOut size={15} />
                </button>
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-violet-600 transition-colors">
                Sign In
              </Link>
              <Link
                href="/login"
                className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white font-semibold hover:opacity-90 transition-all shadow-md hover:shadow-violet-200"
              >
                <Zap size={14} className="text-yellow-300" />
                Try Free
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
          onClick={() => setOpen(o => !o)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-2">
          {[
            { href: '/tool', label: 'Tool' },
            { href: '/blog', label: 'Blog' },
            { href: '/about', label: 'About' },
            { href: '/contact', label: 'Contact' },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-violet-50 hover:text-violet-600 transition-colors"
            >
              {label}
            </Link>
          ))}
          {user ? (
            <>
              <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500">
                <User size={14} />
                {user.email}
              </div>
              <button
                onClick={() => { setOpen(false); handleSignOut() }}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50"
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-violet-50 hover:text-violet-600"
              >
                Sign In
              </Link>
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-2 mt-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white font-semibold text-sm"
              >
                <Zap size={14} />
                Try Free
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  )
}
