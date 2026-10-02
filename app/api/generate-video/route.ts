export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { PLATFORM_CONFIG, Platform } from '@/lib/groq'
import { guardRequest, recordUsage } from '@/lib/api-guard'

export async function POST(req: NextRequest) {
  try {
    const guard = await guardRequest(req)
    if (!guard.ok) return guard.response

    const { prompt, platform } = await req.json()

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const config = PLATFORM_CONFIG[(platform as Platform) ?? 'instagram_post']
    const width = Math.min(config.width, 1280)
    const height = Math.min(config.height, 720)

    // Pollinations video generation
    const encodedPrompt = encodeURIComponent(prompt)
    const videoUrl = `https://video.pollinations.ai/prompt/${encodedPrompt}?model=ltx-video&width=${width}&height=${height}&nologo=true`

    // Verify the URL is reachable with a HEAD request
    try {
      const check = await fetch(videoUrl, { method: 'HEAD', signal: AbortSignal.timeout(35000) })
      if (!check.ok) {
        return NextResponse.json({ error: 'Video generation failed' }, { status: 500 })
      }
    } catch {
      // If HEAD fails, still return the URL — client will handle errors
    }

    return NextResponse.json({ videoUrl })
  } catch (error) {
    console.error('Video generation error:', error)
    return NextResponse.json({ error: 'Video generation failed' }, { status: 500 })
  }
}
