// Blog post index — single source of truth.
// Imported by the blog pages *and* app/sitemap.ts, so it must stay
// framework-free (no 'use client', no component imports).

export const BLOG_POSTS = [
  {
    slug: 'ai-social-media-content-tips-2025',
    title: '10 Ways AI Is Changing Social Media Content Creation in 2025',
    excerpt: 'From instant image generation to multilingual captions, AI tools are transforming how creators and brands produce content. Here\'s what you need to know.',
    category: 'AI & Content',
    readTime: '6 min read',
    date: 'May 15, 2025',
    emoji: '🤖',
  },
  {
    slug: 'instagram-reels-vs-tiktok-strategy',
    title: 'Instagram Reels vs TikTok: Which Platform Should You Focus On?',
    excerpt: 'Both platforms dominate short-form video. But the right choice depends on your audience, content style and business goals. A practical comparison.',
    category: 'Platform Strategy',
    readTime: '8 min read',
    date: 'May 10, 2025',
    emoji: '📱',
  },
  {
    slug: 'perfect-instagram-caption-formula',
    title: 'The Perfect Instagram Caption Formula (With AI Examples)',
    excerpt: 'Hook, value, CTA — it sounds simple, but most captions miss the mark. We break down the proven formula that drives engagement and saves you time.',
    category: 'Copywriting',
    readTime: '5 min read',
    date: 'May 5, 2025',
    emoji: '✍️',
  },
  {
    slug: 'hashtag-strategy-2025',
    title: 'Hashtag Strategy in 2025: What Actually Works',
    excerpt: 'The algorithm has changed. Stuffing 30 hashtags no longer works. Here\'s the data-driven hashtag strategy that\'s driving real reach in 2025.',
    category: 'Growth',
    readTime: '7 min read',
    date: 'April 28, 2025',
    emoji: '#️⃣',
  },
  {
    slug: 'youtube-shorts-complete-guide',
    title: 'YouTube Shorts Complete Guide: Go From Zero to Viral',
    excerpt: 'YouTube Shorts is the fastest-growing short-form video platform. This complete guide covers everything from thumbnail hooks to posting schedules.',
    category: 'YouTube',
    readTime: '10 min read',
    date: 'April 20, 2025',
    emoji: '▶️',
  },
  {
    slug: 'gemini-ai-image-generation-social-media',
    title: 'How to Use Gemini AI for Social Media Images (Beginner Guide)',
    excerpt: 'Google Gemini can generate stunning images from a text prompt. Learn how to write image prompts that produce scroll-stopping visuals for every platform.',
    category: 'AI Tools',
    readTime: '6 min read',
    date: 'April 14, 2025',
    emoji: '🎨',
  },
]

export type BlogPost = (typeof BLOG_POSTS)[number]
