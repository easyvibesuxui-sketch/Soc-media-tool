export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { callAI, GenerateContentParams, PLATFORM_CONFIG, DEFAULT_MODEL_ID } from '@/lib/groq'
import { buildPollinationsUrl } from '@/lib/pollinations'
import { guardRequest, recordUsage } from '@/lib/api-guard'

// ── Portable base64 ───────────────────────────────────────────────────
// `Buffer` is Node-only. Encoding by hand keeps this route runnable on any
// runtime (Cloudflare Workers / edge) without a nodejs_compat shim.
function toBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let binary = ''
  const CHUNK = 0x8000 // avoid blowing the call stack on large images
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK))
  }
  return btoa(binary)
}

// ── Gemini image generation (“Nano Banana”) ───────────────────────────
// Tried in order. These are image-capable models on the Gemini API; the
// older gemini-2.0-flash-exp was retired by Google. Image generation is a
// PAID feature — on a free-tier key every model here returns 429
// RESOURCE_EXHAUSTED, and we fall through to Pollinations below.
const GEMINI_IMAGE_MODELS = [
  'gemini-3.1-flash-image',   // Nano Banana 2
  'gemini-2.5-flash-image',   // Nano Banana
]

async function generateWithGemini(prompt: string): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY
  if (!key) return null

  for (const model of GEMINI_IMAGE_MODELS) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `Generate a high-quality, photorealistic social media image: ${prompt}` }] }],
            generationConfig: { responseModalities: ['IMAGE'] },
          }),
          signal: AbortSignal.timeout(40000),
        }
      )

      if (!res.ok) {
        // 429 = free tier without image-gen billing. Not worth retrying the
        // next Gemini model, they share the same quota — go to Pollinations.
        if (res.status === 429) {
          console.warn(`Gemini image quota exhausted (${model}) — falling back to Pollinations`)
          return null
        }
        console.warn(`Gemini image error ${res.status} on ${model}`)
        continue
      }

      const data = await res.json()
      const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> =
        data?.candidates?.[0]?.content?.parts ?? []
      const imgPart = parts.find(p => p.inlineData)
      if (imgPart?.inlineData) {
        return `data:${imgPart.inlineData.mimeType};base64,${imgPart.inlineData.data}`
      }
    } catch (e) {
      console.warn(`Gemini image gen failed on ${model}:`, e)
    }
  }
  return null
}

export async function POST(req: NextRequest) {
  try {
    const guard = await guardRequest(req)
    if (!guard.ok) return guard.response

    const body: GenerateContentParams & {
      seed?: number
      modelId?: string
      imageModelId?: string
      existingPrompt?: string   // skip AI generation if provided
    } = await req.json()

    const {
      topic, platform, tone, language,
      seed, modelId = DEFAULT_MODEL_ID,
      imageModelId = 'gemini',
      existingPrompt,
    } = body

    if (!platform) return NextResponse.json({ error: 'platform is required' }, { status: 400 })

    const config = PLATFORM_CONFIG[platform]

    // Step 1: get or generate prompt
    let prompt = existingPrompt ?? ''
    if (!prompt) {
      if (!topic || !tone || !language) {
        return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
      }
      prompt = await callAI(modelId, {
        messages: [
          {
            role: 'system',
            content: `You are an expert social media image prompt engineer.
Generate a concise, vivid image prompt for AI image generation.
The image should suit a ${config.label} (${config.aspectRatio} aspect ratio).
Return ONLY the image prompt, no explanation, no quotes.`,
          },
          {
            role: 'user',
            content: `Topic: "${topic}", Tone: ${tone}, Platform: ${config.label}
Create a high-quality image prompt that visually represents this topic perfectly for social media.`,
          },
        ],
        max_tokens: 200,
        temperature: 0.7,
      })
      prompt = prompt || topic
    }

    // Step 2: generate image — try Gemini first, fall back to Pollinations
    if (imageModelId === 'gemini' || imageModelId === 'pollinations') {
      // Try Gemini imagen
      if (imageModelId === 'gemini') {
        const geminiUrl = await generateWithGemini(prompt)
        if (geminiUrl) {
          await recordUsage(guard.userId, guard.isPaid)
          return NextResponse.json({ imageUrl: geminiUrl, imagePrompt: prompt })
        }
        console.warn('Gemini image gen failed, falling back to Pollinations')
      }

      // Pollinations fallback — sequential model attempts
      const models = ['turbo', 'flux', 'flux-realism'] as const
      let lastErr = ''
      for (const model of models) {
        const polUrl = buildPollinationsUrl(prompt, platform, seed, model)
        try {
          const polRes = await fetch(polUrl, {
            signal: AbortSignal.timeout(45000),
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PostCraftAI/1.0)' },
          })
          if (!polRes.ok) {
            lastErr = `Pollinations ${model} → ${polRes.status}`
            await new Promise(r => setTimeout(r, 1000))
            continue
          }
          const buf = await polRes.arrayBuffer()
          if (buf.byteLength < 1000) {
            lastErr = `Pollinations ${model} → tiny response (${buf.byteLength} bytes)`
            await new Promise(r => setTimeout(r, 1000))
            continue
          }
          const b64 = toBase64(buf)
          const mime = polRes.headers.get('content-type') ?? 'image/jpeg'
          await recordUsage(guard.userId, guard.isPaid)
          return NextResponse.json({ imageUrl: `data:${mime};base64,${b64}`, imagePrompt: prompt })
        } catch (e) {
          lastErr = e instanceof Error ? e.message : String(e)
          await new Promise(r => setTimeout(r, 1000))
        }
      }
      throw new Error(`All image providers failed: ${lastErr}`)
    }

    // HuggingFace FLUX uncensored
    if (imageModelId === 'hf-flux-uncensored') {
      const hfToken = process.env.HF_TOKEN
      if (!hfToken) throw new Error('HF_TOKEN is missing in .env.local')
      const res = await fetch(
        'https://api-inference.huggingface.co/models/shauray/FLUX-UNCENSORED-merged',
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${hfToken}`, 'Content-Type': 'application/json', Accept: 'image/jpeg' },
          body: JSON.stringify({ inputs: prompt }),
          signal: AbortSignal.timeout(60000),
        }
      )
      if (!res.ok) throw new Error(`HF image error ${res.status}: ${await res.text()}`)
      const base64 = toBase64(await res.arrayBuffer())
      await recordUsage(guard.userId, guard.isPaid)
      return NextResponse.json({ imageUrl: `data:image/jpeg;base64,${base64}`, imagePrompt: prompt })
    }

    throw new Error(`Unknown imageModelId: ${imageModelId}`)

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to generate image'
    console.error('generate-image error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
