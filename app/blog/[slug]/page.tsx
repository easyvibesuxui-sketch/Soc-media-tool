'use client'

import { useState, useEffect, useCallback, use } from 'react'
import Link from 'next/link'
import { ArrowLeft, Clock, Loader2, RefreshCw, ArrowRight, Tag } from 'lucide-react'
import MarketingNav from '@/components/MarketingNav'
import MarketingFooter from '@/components/MarketingFooter'
import { BLOG_POSTS } from '@/lib/blog'

// Very minimal Markdown → JSX renderer
function renderMarkdown(md: string) {
  const lines = md.split('\n')
  const elements: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className="text-xl font-extrabold text-gray-900 mt-8 mb-3">{inlineRender(line.slice(3))}</h2>)
    } else if (line.startsWith('### ')) {
      elements.push(<h3 key={i} className="text-base font-bold text-gray-900 mt-5 mb-2">{inlineRender(line.slice(4))}</h3>)
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      const items: string[] = []
      while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
        items.push(lines[i].slice(2))
        i++
      }
      elements.push(
        <ul key={`ul-${i}`} className="list-disc pl-5 space-y-1.5 my-3">
          {items.map((item, j) => <li key={j} className="text-sm text-gray-700 leading-relaxed">{inlineRender(item)}</li>)}
        </ul>
      )
      continue
    } else if (/^\d+\. /.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\. /, ''))
        i++
      }
      elements.push(
        <ol key={`ol-${i}`} className="list-decimal pl-5 space-y-1.5 my-3">
          {items.map((item, j) => <li key={j} className="text-sm text-gray-700 leading-relaxed">{inlineRender(item)}</li>)}
        </ol>
      )
      continue
    } else if (line.startsWith('> ')) {
      elements.push(
        <blockquote key={i} className="border-l-4 border-violet-400 pl-4 my-4 italic text-gray-600 text-sm">
          {inlineRender(line.slice(2))}
        </blockquote>
      )
    } else if (line.trim() === '') {
      // skip blank lines (paragraph spacing handled by the elements)
    } else {
      elements.push(<p key={i} className="text-sm text-gray-700 leading-relaxed my-2">{inlineRender(line)}</p>)
    }
    i++
  }
  return elements
}

function inlineRender(text: string): React.ReactNode {
  // Handle **bold**, *italic*, [link](href)
  const parts: React.ReactNode[] = []
  let remaining = text
  let idx = 0

  while (remaining.length > 0) {
    // Link [text](href)
    const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/)
    if (linkMatch) {
      parts.push(
        <Link key={idx++} href={linkMatch[2]} className="text-violet-600 underline hover:text-violet-800">
          {linkMatch[1]}
        </Link>
      )
      remaining = remaining.slice(linkMatch[0].length)
      continue
    }
    // Bold **text**
    const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/)
    if (boldMatch) {
      parts.push(<strong key={idx++} className="font-semibold text-gray-900">{boldMatch[1]}</strong>)
      remaining = remaining.slice(boldMatch[0].length)
      continue
    }
    // Italic *text*
    const italicMatch = remaining.match(/^\*([^*]+)\*/)
    if (italicMatch) {
      parts.push(<em key={idx++}>{italicMatch[1]}</em>)
      remaining = remaining.slice(italicMatch[0].length)
      continue
    }
    // Code `text`
    const codeMatch = remaining.match(/^`([^`]+)`/)
    if (codeMatch) {
      parts.push(<code key={idx++} className="bg-gray-100 text-violet-700 px-1 py-0.5 rounded text-xs font-mono">{codeMatch[1]}</code>)
      remaining = remaining.slice(codeMatch[0].length)
      continue
    }
    // Plain character
    const nextSpecial = remaining.search(/\[|\*\*|\*|`/)
    if (nextSpecial === -1) {
      parts.push(remaining)
      break
    }
    parts.push(remaining.slice(0, nextSpecial))
    remaining = remaining.slice(nextSpecial)
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>
}

export default function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [content, setContent] = useState<string | null>(null)
  const [title, setTitle] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const post = BLOG_POSTS.find(p => p.slug === slug)

  // Fetches and applies the article. `loading` already starts as true, so the
  // mount path must NOT set it synchronously — React 19 flags a synchronous
  // setState inside an effect. Only the manual Retry button resets it.
  const loadPost = useCallback(async (isRetry = false) => {
    if (isRetry) {
      setLoading(true)
      setError(null)
    }
    try {
      const res = await fetch(`/api/generate-blog?slug=${encodeURIComponent(slug)}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setTitle(data.title)
      setContent(data.content)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load post')
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    // Ignore a resolved fetch from a previous slug if the user navigated away.
    let cancelled = false
    void (async () => {
      await loadPost()
      if (cancelled) return
    })()
    return () => { cancelled = true }
  }, [loadPost])

  const relatedPosts = BLOG_POSTS.filter(p => p.slug !== slug).slice(0, 3)

  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />

      <main className="max-w-3xl mx-auto px-4 py-12">
        {/* Back */}
        <Link href="/blog" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-violet-600 transition-colors mb-8">
          <ArrowLeft size={14} />
          Back to Blog
        </Link>

        {/* Post meta */}
        {post && (
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs font-semibold bg-violet-100 text-violet-700 px-2.5 py-1 rounded-full flex items-center gap-1">
                <Tag size={10} />{post.category}
              </span>
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Clock size={10} />{post.readTime}
              </span>
              <span className="text-xs text-gray-400">{post.date}</span>
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">
              {post.emoji} {title || post.title}
            </h1>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-3">
            <Loader2 size={28} className="animate-spin text-violet-400" />
            <p className="text-sm text-gray-400">Generating article with Gemini AI…</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center">
            <p className="text-sm text-red-500 mb-4">{error}</p>
            <button
              onClick={() => loadPost(true)}
              className="flex items-center gap-2 mx-auto px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
            >
              <RefreshCw size={13} />
              Retry
            </button>
          </div>
        ) : content ? (
          <article className="prose-custom">
            {/* Intro highlight */}
            <div className="bg-violet-50 border border-violet-100 rounded-2xl p-5 mb-6">
              <p className="text-sm text-violet-700 font-medium leading-relaxed">{post?.excerpt}</p>
            </div>
            {renderMarkdown(content)}
          </article>
        ) : null}

        {/* CTA box */}
        <div className="mt-12 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-2xl p-7 text-center">
          <h3 className="text-xl font-extrabold text-white mb-2">Put this into practice — right now</h3>
          <p className="text-violet-100 text-sm mb-5">Use PostCraft AI to generate your first AI-powered social post in under a minute.</p>
          <Link
            href="/tool"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-violet-700 font-bold text-sm hover:bg-violet-50 transition-all"
          >
            Try PostCraft AI Free
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Related posts */}
        {relatedPosts.length > 0 && (
          <div className="mt-12">
            <h3 className="text-lg font-extrabold text-gray-900 mb-5">Related Articles</h3>
            <div className="grid sm:grid-cols-3 gap-4">
              {relatedPosts.map(rp => (
                <Link key={rp.slug} href={`/blog/${rp.slug}`} className="group block">
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all">
                    <p className="text-xs text-gray-400 mb-1.5">{rp.category}</p>
                    <h4 className="text-sm font-bold text-gray-900 group-hover:text-violet-700 transition-colors leading-snug">
                      {rp.emoji} {rp.title}
                    </h4>
                    <p className="text-xs text-violet-600 mt-2 flex items-center gap-1 group-hover:gap-2 transition-all">
                      Read <ArrowRight size={10} />
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      <MarketingFooter />
    </div>
  )
}
