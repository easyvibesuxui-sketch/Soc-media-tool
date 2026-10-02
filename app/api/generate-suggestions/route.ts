export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { callAI, PLATFORM_CONFIG, Platform, Tone, DEFAULT_MODEL_ID } from '@/lib/groq'
import { guardRequest, recordUsage } from '@/lib/api-guard'

export async function POST(req: NextRequest) {
  try {
    const guard = await guardRequest(req)
    if (!guard.ok) return guard.response

    const { platform, topic, tone, caption, hashtags, tab, modelId = DEFAULT_MODEL_ID } = await req.json()

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 })
    }

    const config = PLATFORM_CONFIG[(platform as Platform) ?? 'instagram_post']

    const tabContext: Record<string, string> = {
      platform: `The user is choosing which platform to post on. Give one concise tip about why ${config.label} is or isn't ideal for their topic.`,
      image: `The user is generating a visual for their post. Give one specific visual style or composition tip for "${topic}" on ${config.label}.`,
      caption: `The user has this caption draft: "${caption?.slice(0, 200) ?? '(none yet)'}". Give one targeted improvement tip for tone, hook, or structure.`,
      hashtags: `The user has these hashtags: ${hashtags?.slice(0, 8).join(', ') ?? '(none yet)'}. Give one actionable tip to improve their hashtag strategy for ${config.label}.`,
      overview: `The user is about to publish. Their topic is "${topic}" on ${config.label} with tone "${tone}". Give one final pre-publish tip for maximum reach.`,
    }

    const suggestion = await callAI(modelId, {
      messages: [
        {
          role: 'system',
          content: `You are a social media expert coach. Give exactly ONE short, specific, actionable tip (2-3 sentences max). No bullet points. No headers. Be direct and concrete — avoid generic advice.`,
        },
        {
          role: 'user',
          content: `Topic: "${topic}"\nPlatform: ${config.label}\nTone: ${tone}\n\nContext: ${tabContext[tab] ?? tabContext.platform}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 120,
    })

    return NextResponse.json({ suggestion })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Could not generate suggestion'
    console.error('Suggestion error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
