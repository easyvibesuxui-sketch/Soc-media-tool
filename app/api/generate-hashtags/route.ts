export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { callAI, GenerateContentParams, PLATFORM_CONFIG, DEFAULT_MODEL_ID } from '@/lib/groq'
import { guardRequest, recordUsage } from '@/lib/api-guard'

export async function POST(req: NextRequest) {
  try {
    const guard = await guardRequest(req)
    if (!guard.ok) return guard.response

    const body: GenerateContentParams & { modelId?: string } = await req.json()
    const { topic, platform, tone, modelId = DEFAULT_MODEL_ID } = body

    if (!topic || !platform || !tone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const config = PLATFORM_CONFIG[platform]
    const { min, max } = config.hashtagCount

    const raw = await callAI(modelId, {
      messages: [
        {
          role: 'system',
          content: `You are a social media hashtag expert.
Generate exactly ${min}-${max} relevant hashtags for ${config.label}.
Return ONLY the hashtags separated by spaces, starting each with #.
No explanation, no extra text. Example: #coffee #morning #lifestyle`,
        },
        {
          role: 'user',
          content: `Generate hashtags for a ${config.label} post about: "${topic}"`,
        },
      ],
      max_tokens: 200,
      temperature: 0.6,
    })

    const hashtags = raw
      .split(/\s+/)
      .filter((tag) => tag.startsWith('#'))
      .slice(0, max)

    return NextResponse.json({ hashtags })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to generate hashtags'
    console.error('generate-hashtags error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
