import Link from 'next/link'
import { BLOG_POSTS } from '@/lib/blog'
import { ArrowRight, Clock, Tag } from 'lucide-react'
import MarketingNav from '@/components/MarketingNav'
import MarketingFooter from '@/components/MarketingFooter'

export const metadata = {
  title: 'Blog — PostCraft AI',
  description: 'Tips, guides and strategies for social media content creation, AI tools, and growing your audience.',
}


const CATEGORIES = ['All', 'AI & Content', 'Platform Strategy', 'Copywriting', 'Growth', 'YouTube', 'AI Tools']

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />

      {/* Hero */}
      <section className="bg-gradient-to-br from-violet-50 to-fuchsia-50 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-3">Blog</h1>
          <p className="text-gray-500 text-lg">AI strategies, platform guides, and content creation tips to grow your audience faster.</p>
        </div>
      </section>

      {/* Category pills */}
      <section className="border-b border-gray-100 py-4 bg-white sticky top-16 z-30">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORIES.map(cat => (
              <span
                key={cat}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors ${cat === 'All' ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-violet-100 hover:text-violet-700'}`}
              >
                {cat}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Posts grid */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4">
          {/* Featured post */}
          <Link href={`/blog/${BLOG_POSTS[0].slug}`} className="group block mb-8">
            <div className="bg-gradient-to-br from-violet-50 to-fuchsia-50 rounded-2xl p-8 border border-violet-100 hover:shadow-lg transition-all">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold bg-violet-600 text-white px-2.5 py-1 rounded-full">Featured</span>
                <span className="text-xs text-gray-400 flex items-center gap-1"><Tag size={10} />{BLOG_POSTS[0].category}</span>
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 group-hover:text-violet-700 transition-colors mb-3">
                {BLOG_POSTS[0].emoji} {BLOG_POSTS[0].title}
              </h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-4">{BLOG_POSTS[0].excerpt}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>{BLOG_POSTS[0].date}</span>
                  <span className="flex items-center gap-1"><Clock size={10} />{BLOG_POSTS[0].readTime}</span>
                </div>
                <span className="flex items-center gap-1 text-xs font-semibold text-violet-600 group-hover:gap-2 transition-all">
                  Read more <ArrowRight size={12} />
                </span>
              </div>
            </div>
          </Link>

          {/* Rest of posts */}
          <div className="grid sm:grid-cols-2 gap-5">
            {BLOG_POSTS.slice(1).map(post => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="group block">
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all h-full">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs text-gray-400 flex items-center gap-1"><Tag size={10} />{post.category}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm group-hover:text-violet-700 transition-colors mb-2 leading-snug">
                    {post.emoji} {post.title}
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed mb-4 line-clamp-3">{post.excerpt}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>{post.date}</span>
                      <span className="flex items-center gap-1"><Clock size={10} />{post.readTime}</span>
                    </div>
                    <span className="text-xs font-semibold text-violet-600 flex items-center gap-1 group-hover:gap-2 transition-all">
                      Read <ArrowRight size={11} />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-xl mx-auto px-4 text-center">
          <h3 className="text-xl font-extrabold text-gray-900 mb-2">Ready to put these tips to work?</h3>
          <p className="text-gray-500 text-sm mb-5">Generate your first AI-powered post in under a minute.</p>
          <Link
            href="/tool"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white font-bold text-sm hover:opacity-90 shadow-lg transition-all"
          >
            Try PostCraft AI Free
            <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  )
}

