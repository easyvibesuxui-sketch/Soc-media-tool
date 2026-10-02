// Blog posts are deterministic per slug, so the generated article is cached
// in-process and revalidated daily. Without this, every page view (including
// every crawler hit) would bill a fresh Gemini call.
export const revalidate = 86400
import { NextRequest, NextResponse } from 'next/server'
import { callAI, DEFAULT_MODEL_ID } from '@/lib/groq'

const cache = new Map<string, { title: string; content: string }>()

const BLOG_TOPICS: Record<string, { title: string; outline: string }> = {
  'ai-social-media-content-tips-2025': {
    title: '10 Ways AI Is Changing Social Media Content Creation in 2025',
    outline: 'Write a comprehensive, SEO-optimized blog post about how AI is changing social media content creation in 2025. Cover: AI image generation (Gemini, Midjourney), AI copywriting, automated hashtag research, multi-language content, video generation from images, personalization, A/B testing with AI, scheduling optimization, analytics insights, and trend prediction. Include practical tips creators can use today. Use subheadings, bullet points, and real examples. Aim for 800-1000 words. Tone: informative, practical, enthusiastic.',
  },
  'instagram-reels-vs-tiktok-strategy': {
    title: 'Instagram Reels vs TikTok: Which Platform Should You Focus On?',
    outline: 'Write a detailed comparison between Instagram Reels and TikTok for content creators and brands in 2025. Cover: audience demographics, algorithm differences, content formats, monetization options, analytics tools, brand opportunities, organic reach potential, and ideal content styles for each. Include a recommendation framework based on different creator goals. 800-1000 words. Practical, data-informed tone.',
  },
  'perfect-instagram-caption-formula': {
    title: 'The Perfect Instagram Caption Formula (With AI Examples)',
    outline: 'Write a practical guide to writing perfect Instagram captions. Cover the hook-value-CTA formula, character limits, line breaks and spacing tricks, emoji usage, storytelling in captions, asking questions to drive comments, and how AI tools can help. Include 5 real caption examples across different niches (food, fitness, business, travel, personal brand). Show before/after caption rewrites. 700-900 words. Friendly, instructional tone.',
  },
  'hashtag-strategy-2025': {
    title: 'Hashtag Strategy in 2025: What Actually Works',
    outline: 'Write an evidence-based guide to hashtag strategy in 2025. Cover how algorithms have changed, the decline of mass hashtag use, niche vs. broad hashtags, hashtag research methods, platform differences (Instagram, TikTok, LinkedIn, Twitter/X), branded hashtags, and how AI tools can suggest optimal tags. Include a tiered hashtag strategy framework. 800-950 words. Data-driven, authoritative tone.',
  },
  'youtube-shorts-complete-guide': {
    title: 'YouTube Shorts Complete Guide: Go From Zero to Viral',
    outline: 'Write a comprehensive beginner-to-advanced guide for YouTube Shorts in 2025. Cover: what makes Shorts different from long-form YouTube, the algorithm, ideal video length, hook strategies in first 2 seconds, thumbnail best practices, titles and descriptions, posting frequency, using Shorts to grow main channel subscribers, monetization options, and common mistakes. 1000-1200 words. Step-by-step, encouraging tone.',
  },
  'gemini-ai-image-generation-social-media': {
    title: 'How to Use Gemini AI for Social Media Images (Beginner Guide)',
    outline: 'Write a beginner-friendly guide to using Google Gemini AI for generating social media images. Cover: what Gemini image generation can do, writing effective image prompts, prompt structure (subject + style + platform + mood), platform-specific image sizes, common prompt mistakes, combining text overlay with AI images, legal and copyright considerations for AI-generated images, and tools like PostCraft AI that make the process easier. 750-900 words. Approachable, tutorial-style tone.',
  },
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const slug = searchParams.get('slug')

  if (!slug || !BLOG_TOPICS[slug]) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }

  // Already generated this slug — serve it without calling Gemini again.
  const cached = cache.get(slug)
  if (cached) return NextResponse.json(cached)

  const { title, outline } = BLOG_TOPICS[slug]

  try {
    // Go through callAI rather than fetching Gemini directly: it retries
    // transient 503 "high demand" responses and fails over to another
    // provider, which a one-shot fetch here could not do.
    const content = await callAI(DEFAULT_MODEL_ID, {
      messages: [
        {
          role: 'system',
          content: `You are an expert social media strategist and content writer. Write blog posts in clean Markdown format. Use ## for H2 headings, ### for H3, **bold**, bullet lists. Do NOT include the main H1 title — start from the introduction paragraph. Write naturally for human readers. Include 1-2 internal links in the format [PostCraft AI](/tool) where relevant.`,
        },
        { role: 'user', content: outline },
      ],
      max_tokens: 4000,
      temperature: 0.7,
    })

    if (!content) throw new Error('Empty article returned')

    cache.set(slug, { title, content })
    return NextResponse.json({ title, content })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to generate post'
    console.error('generate-blog error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
