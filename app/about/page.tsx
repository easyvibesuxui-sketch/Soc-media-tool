import Link from 'next/link'
import { Sparkles, Zap, Target, Heart } from 'lucide-react'
import MarketingNav from '@/components/MarketingNav'
import MarketingFooter from '@/components/MarketingFooter'

export const metadata = { title: 'About — PostCraft AI', description: 'Learn about PostCraft AI and our mission to democratize social media content creation.' }

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />

      {/* Hero */}
      <section className="bg-gradient-to-br from-violet-50 to-fuchsia-50 py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center mx-auto mb-6 shadow-xl">
            <Sparkles size={26} className="text-white" />
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
            About PostCraft AI
          </h1>
          <p className="text-lg text-gray-500 leading-relaxed">
            We believe every creator deserves professional-quality social media content — without the agency price tag or hours of effort.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 space-y-10">
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { icon: Target, color: 'bg-violet-100 text-violet-600', title: 'Our Mission', desc: 'To remove the time, skill and cost barriers that stop great ideas from becoming great content. We build tools that make every creator look like a pro.' },
              { icon: Zap, color: 'bg-fuchsia-100 text-fuchsia-600', title: 'How We Work', desc: 'We connect state-of-the-art AI models — Google Gemini for language and image generation — into a simple, guided workflow that anyone can use in minutes.' },
              { icon: Heart, color: 'bg-pink-100 text-pink-600', title: 'Our Values', desc: 'Privacy first. No unnecessary data collection. No dark patterns. Your content belongs to you — not to us, and not to train AI models.' },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="bg-gray-50 rounded-2xl p-6">
                <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-4`}>
                  <Icon size={20} />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* Story */}
          <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-4">Our Story</h2>
            <div className="text-sm text-gray-600 leading-relaxed space-y-3">
              <p>PostCraft AI started with a simple frustration: creating consistent, high-quality social media content is genuinely hard. It takes hours of design time, copywriting skills and a deep knowledge of each platform&apos;s quirks — aspect ratios, optimal caption lengths, trending hashtags.</p>
              <p>Most creators and small businesses either spend enormous time on it, hire expensive agencies, or settle for mediocre output. We thought there had to be a better way.</p>
              <p>With the arrival of powerful, free-tier AI models like Google Gemini, the pieces were finally in place to build something that felt magical. A tool that takes a single sentence — your topic — and hands you back a publication-ready post in under a minute.</p>
              <p>That&apos;s PostCraft AI. We&apos;re a small team building tools we wish existed. We hope it helps you create something great today.</p>
            </div>
          </div>

          {/* Tech stack */}
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-6 text-center">Powered by the best AI</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { name: 'Google Gemini', role: 'Text & Image AI', desc: 'Captions, hashtags, image prompts and visual generation are all powered by Google\'s Gemini models — some of the most capable AI available.', color: 'from-blue-500 to-cyan-400' },
                { name: 'Pollinations.ai', role: 'Image Generation', desc: 'Our fallback image generation partner. Provides reliable, high-quality AI images across multiple artistic styles with no API key required.', color: 'from-green-500 to-emerald-400' },
              ].map(({ name, role, desc, color }) => (
                <div key={name} className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                  <div className={`inline-block text-xs font-bold px-2.5 py-1 rounded-lg bg-gradient-to-r ${color} text-white mb-3`}>{name}</div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{role}</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center pt-4">
            <Link
              href="/tool"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white font-bold text-sm hover:opacity-90 shadow-lg transition-all"
            >
              <Sparkles size={15} />
              Try PostCraft AI — it&apos;s free
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  )
}
