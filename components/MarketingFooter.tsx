import Link from 'next/link'
import { Sparkles } from 'lucide-react'

export default function MarketingFooter() {
  const year = new Date().getFullYear()
  return (
    <footer className="border-t border-gray-100 bg-white mt-16">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid sm:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="sm:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center">
                <Sparkles size={13} className="text-white" />
              </div>
              <span className="font-extrabold text-gray-900 text-base">
                PostCraft<span className="text-violet-600"> AI</span>
              </span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              AI-powered social media content generator. Create stunning posts for every platform in seconds.
            </p>
          </div>

          {/* Product */}
          <div>
            <p className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-3">Product</p>
            <ul className="space-y-2">
              {[
                { href: '/tool', label: 'Content Generator' },
                { href: '/blog', label: 'Blog' },
                { href: '/#features', label: 'Features' },
                { href: '/#pricing', label: 'Pricing' },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-xs text-gray-500 hover:text-violet-600 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <p className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-3">Company</p>
            <ul className="space-y-2">
              {[
                { href: '/about', label: 'About' },
                { href: '/contact', label: 'Contact' },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-xs text-gray-500 hover:text-violet-600 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-3">Legal</p>
            <ul className="space-y-2">
              {[
                { href: '/privacy', label: 'Privacy Policy' },
                { href: '/terms', label: 'Terms of Service' },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-xs text-gray-500 hover:text-violet-600 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-400">© {year} PostCraft AI. All rights reserved.</p>
          <p className="text-xs text-gray-400">Powered by Google Gemini · Pollinations.ai</p>
        </div>
      </div>
    </footer>
  )
}
