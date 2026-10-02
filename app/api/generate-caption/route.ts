export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { callAI, GenerateContentParams, PLATFORM_CONFIG, TONE_LABELS, DEFAULT_MODEL_ID } from '@/lib/groq'
import { guardRequest, recordUsage } from '@/lib/api-guard'

export async function POST(req: NextRequest) {
  try {
    const guard = await guardRequest(req)
    if (!guard.ok) return guard.response

    const body: GenerateContentParams & { modelId?: string; mode?: 'caption' | 'description' | 'fix' } = await req.json()
    const { topic, platform, tone, language, modelId = DEFAULT_MODEL_ID, mode = 'caption' } = body

    if (!topic || !platform || !tone || !language) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const config = PLATFORM_CONFIG[platform]
    const toneLabel = TONE_LABELS[tone]
    const langMap: Record<string, string> = {
      ka: 'Georgian (ქართული)', es: 'Spanish', fr: 'French', de: 'German', ru: 'Russian', en: 'English',
    }
    const lang = langMap[language] ?? 'English'

    let systemPrompt = ''
    let userPrompt = ''

    if (mode === 'fix') {
      systemPrompt = `You are an expert social media copywriter. The user gives you a rough caption or description. Fix it: improve grammar, make it more engaging, better tone (${toneLabel}), appropriate for ${config.label}. Write in ${lang}. Return ONLY the improved text, no explanation.`
      userPrompt = `Fix and improve this text: "${topic}"`
    } else if (mode === 'description') {
      systemPrompt = `You are an expert social media content strategist. Write a short, punchy description/label for a ${config.label} post. Tone: ${toneLabel}. Max 150 characters. Write in ${lang}. Return ONLY the description, no explanation, no quotes.`
      userPrompt = `Write a short label/description for a post about: "${topic}"`
    } else {
      systemPrompt = `You are an expert social media copywriter. Create an engaging ${config.label} caption. Tone: ${toneLabel}. Max length: ${config.maxCaptionLength} characters. Write in ${lang}. Return ONLY the caption text, no quotes, no explanation.`
      userPrompt = `Write a ${config.label} caption about: "${topic}"`
    }

    const caption = await callAI(modelId, {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: mode === 'description' ? 100 : 600,
      temperature: 0.8,
    })

    return NextResponse.json({ caption })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to generate caption'
    console.error('generate-caption error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
