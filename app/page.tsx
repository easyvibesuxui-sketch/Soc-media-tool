import Link from 'next/link'
import {
  Sparkles, Zap, ArrowRight, Check, Star,
  Image as ImageIcon, Type, Hash, LayoutTemplate,
  Instagram, Youtube, Twitter, Video, Globe, Facebook,
} from 'lucide-react'
import MarketingNav from '@/components/MarketingNav'
import MarketingFooter from '@/components/MarketingFooter'

const PLATFORMS = [
  { icon: Instagram, label: 'Instagram', color: 'from-pink-500 to-rose-500' },
  { icon: Video, label: 'TikTok', color: 'from-gray-900 to-gray-700' },
  { icon: Youtube, label: 'YouTube', color: 'from-red-500 to-red-600' },
  { icon: Twitter, label: 'X / Twitter', color: 'from-sky-500 to-blue-600' },
  { icon: Facebook, label: 'Facebook', color: 'from-blue-600 to-blue-700' },
  { icon: Globe, label: 'LinkedIn', color: 'from-blue-500 to-cyan-600' },
]

const STEPS = [
  {
    num: '01',
    icon: LayoutTemplate,
    title: 'Pick your platform',
    desc: 'Choose Instagram, TikTok, YouTube Shorts, Reels, X, Facebook or LinkedIn. PostCraft AI auto-adjusts image sizes, caption limits and hashtag counts.',
    color: 'bg-violet-100 text-violet-600',
  },
  {
    num: '02',
    icon: ImageIcon,
    title: 'Generate 4 AI images',
    desc: 'Powered by Google Gemini. Type a topic and get 4 unique variants instantly — or upload your own image and let AI enhance it. Animate into a short video with one click.',
    color: 'bg-fuchsia-100 text-fuchsia-600',
  },
  {
    num: '03',
    icon: Type,
    title: 'AI-written caption + hashtags',
    desc: 'Gemini writes a scroll-stopping caption and research-backed hashtag set in your language and tone. Edit anything, or regenerate in one click.',
    color: 'bg-pink-100 text-pink-600',
  },
  {
    num: '04',
    icon: Hash,
    title: 'Copy, download & post',
    desc: 'Preview your complete post. Copy the caption, copy hashtags, download the image or video — everything is one click away. Ready to paste into your app.',
    color: 'bg-rose-100 text-rose-600',
  },
]

const FEATURES = [
  { emoji: '🎨', title: '4-image AI grid', desc: 'Four unique visual variants every time. Pick the best one or regenerate.' },
  { emoji: '🤖', title: 'Gemini-powered', desc: 'Google\'s Gemini AI writes captions, hashtags and image prompts with stunning quality.' },
  { emoji: '🌍', title: '6 languages', desc: 'English, Georgian, Spanish, French, German and Russian — natively.' },
  { emoji: '🎬', title: 'Video from image', desc: 'Turn any AI image into a short looping video. Perfect for Reels & TikTok.' },
  { emoji: '📋', title: 'One-click copy', desc: 'Copy caption, hashtags or the full post package instantly.' },
  { emoji: '📐', title: 'Platform-perfect sizes', desc: '1:1 posts, 9:16 stories, 16:9 banners — always the right dimensions.' },
  { emoji: '♾️', title: 'Free to use', desc: 'No credit card. Start generating immediately with the free tier.' },
  { emoji: '🔒', title: 'Privacy first', desc: 'Your content is never stored or used to train AI models.' },
]

const TESTIMONIALS = [
  { name: 'Sophia M.', handle: '@sophiacreates', avatar: 'S', text: 'PostCraft AI cut my content creation time from 2 hours to 10 minutes. The AI images are stunning and the captions actually sound like ME.', platform: 'Instagram creator, 84k followers' },
  { name: 'Daniel K.', handle: '@dkmarketing', avatar: 'D', text: 'I manage 12 brand accounts. This tool is now part of every single content workflow. The multi-language support is a game changer.', platform: 'Social media manager' },
  { name: 'Lena T.', handle: '@lenatbiz', avatar: 'L', text: 'Finally an AI tool that understands LinkedIn tone. My engagement went up 3x in the first week. Absolutely worth it.', platform: 'LinkedIn thought leader' },
]

const FREE_FEATURES = ['5 generations / day', 'All 6 platforms', '4 AI image variants', 'Caption + hashtags', 'Video generation', 'Multi-language support']
const PRO_FEATURES = ['Unlimited generations', 'Everything in Free', 'Priority image generation', 'Advanced AI models', 'Bulk generation', 'Priority support']

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 pt-20 pb-24">
        {/* Background blobs */}
        <div className="pointer-events-none absolute -top-20 -left-20 w-96 h-96 rounded-full bg-violet-100 opacity-60 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 w-96 h-96 rounded-full bg-fuchsia-100 opacity-60 blur-3xl" />

        <div className="relative max-w-5xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <Sparkles size={12} />
            Powered by Google Gemini AI
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
            Create viral social content
            <br />
            <span className="bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
              in seconds with AI
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Generate on-brand images, scroll-stopping captions and targeted hashtags for Instagram, TikTok, YouTube, Facebook, X and more — all from a single topic.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
            <Link
              href="/login"
              className="flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white font-bold text-base hover:opacity-90 transition-all shadow-xl hover:shadow-violet-300 hover:-translate-y-0.5"
            >
              <Zap size={17} className="text-yellow-300" />
              Start for Free
              <ArrowRight size={17} />
            </Link>
            <a
              href="#how-it-works"
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl border border-gray-200 bg-white text-gray-700 font-semibold text-base hover:bg-gray-50 transition-all"
            >
              See how it works
            </a>
          </div>

          {/* Platform pills */}
          <div className="flex flex-wrap justify-center gap-2">
            {PLATFORMS.map(({ icon: Icon, label, color }) => (
              <div
                key={label}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-xl border border-gray-200 shadow-sm text-xs font-medium text-gray-700"
              >
                <div className={`w-4 h-4 rounded-md bg-gradient-to-br ${color} flex items-center justify-center`}>
                  <Icon size={9} className="text-white" />
                </div>
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Social proof bar ── */}
      <section className="bg-gray-900 py-4">
        <div className="max-w-5xl mx-auto px-4 flex flex-wrap items-center justify-center gap-8">
          {[
            { num: '50k+', label: 'Posts Generated' },
            { num: '6', label: 'Platforms Supported' },
            { num: '6', label: 'Languages' },
            { num: '100%', label: 'Free to Start' },
          ].map(({ num, label }) => (
            <div key={label} className="text-center">
              <p className="text-xl font-extrabold text-white">{num}</p>
              <p className="text-xs text-gray-400">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">
              From topic to post in 4 steps
            </h2>
            <p className="text-gray-500 text-lg">No design skills needed. No copywriting experience required.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map(({ num, icon: Icon, title, desc, color }) => (
              <div key={num} className="relative bg-gray-50 rounded-2xl p-6 hover:shadow-md transition-shadow">
                <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center">
                  <span className="text-xs font-black text-gray-400">{num}</span>
                </div>
                <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-4`}>
                  <Icon size={20} />
                </div>
                <h3 className="font-bold text-gray-900 text-sm mb-2">{title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white font-bold text-sm hover:opacity-90 shadow-lg hover:shadow-violet-200 transition-all"
            >
              <Sparkles size={15} />
              Try it now — it&apos;s free
            </Link>
          </div>
        </div>
      </section>

      {/* ── Features grid ── */}
      <section id="features" className="py-20 bg-gradient-to-br from-violet-50 to-fuchsia-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">
              Everything you need to go viral
            </h2>
            <p className="text-gray-500 text-lg">One tool. Every platform. Zero friction.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map(({ emoji, title, desc }) => (
              <div
                key={title}
                className="bg-white rounded-2xl p-5 border border-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div className="text-2xl mb-3">{emoji}</div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">{title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">
              Loved by creators worldwide
            </h2>
            <p className="text-gray-500 text-lg">Join thousands of creators who save hours every week.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {TESTIMONIALS.map(({ name, handle, avatar, text, platform }) => (
              <div key={name} className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={12} className="fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-gray-700 leading-relaxed mb-4">&ldquo;{text}&rdquo;</p>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-white text-xs font-bold">
                    {avatar}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900">{name} · <span className="font-normal text-gray-400">{handle}</span></p>
                    <p className="text-[10px] text-gray-400">{platform}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">
              Simple, transparent pricing
            </h2>
            <p className="text-gray-500 text-lg">Start free. Upgrade when you need more.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* Free */}
            <div className="bg-white rounded-2xl border border-gray-200 p-7 shadow-sm">
              <p className="text-sm font-semibold text-gray-500 mb-1">Free</p>
              <div className="flex items-end gap-1 mb-5">
                <span className="text-4xl font-extrabold text-gray-900">$0</span>
                <span className="text-sm text-gray-400 mb-1">/month</span>
              </div>
              <ul className="space-y-2.5 mb-7">
                {FREE_FEATURES.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    <Check size={14} className="text-green-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/login"
                className="block text-center py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all"
              >
                Get started
              </Link>
            </div>

            {/* Pro */}
            <div className="relative bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-2xl p-7 shadow-xl">
              <div className="absolute -top-3 right-6 bg-yellow-400 text-gray-900 text-xs font-bold px-3 py-1 rounded-full">
                MOST POPULAR
              </div>
              <p className="text-sm font-semibold text-violet-200 mb-1">Pro</p>
              <div className="flex items-end gap-1 mb-5">
                <span className="text-4xl font-extrabold text-white">$29</span>
                <span className="text-sm text-violet-200 mb-1">/month</span>
              </div>
              <ul className="space-y-2.5 mb-7">
                {PRO_FEATURES.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-white">
                    <Check size={14} className="text-yellow-300 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button className="w-full py-2.5 rounded-xl bg-white text-violet-700 text-sm font-bold hover:bg-violet-50 transition-all">
                Upgrade to Pro
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-20 bg-gradient-to-br from-violet-600 to-fuchsia-600">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Start creating scroll-stopping content today
          </h2>
          <p className="text-violet-100 text-lg mb-8">
            Free forever. No credit card. Takes 30 seconds to your first post.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white text-violet-700 font-extrabold text-base hover:bg-violet-50 transition-all shadow-2xl hover:shadow-violet-800/30 hover:-translate-y-0.5"
          >
            <Sparkles size={18} />
            Create my first post
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  )
}
