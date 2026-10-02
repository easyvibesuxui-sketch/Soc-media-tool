// Unified AI client — supports HuggingFace, Groq, Google Gemini (all free tiers)

// ── Model registry ────────────────────────────────────────────────────

export const FREE_MODELS = [
  {
    id: 'groq-llama-70b',
    label: 'GPT-OSS 120B',
    provider: 'groq' as const,
    model: 'openai/gpt-oss-120b',
    badge: 'Groq',
    badgeColor: 'bg-orange-100 text-orange-700',
    description: 'ყველაზე ჭკვიანი & სწრაფი',
    envVar: 'GROQ_API_KEY',
    url: 'https://console.groq.com',
  },
  {
    id: 'groq-mixtral',
    label: 'GPT-OSS 20B',
    provider: 'groq' as const,
    model: 'openai/gpt-oss-20b',
    badge: 'Groq',
    badgeColor: 'bg-orange-100 text-orange-700',
    description: 'მრავალენოვანი, სწრაფი',
    envVar: 'GROQ_API_KEY',
    url: 'https://console.groq.com',
  },
  {
    id: 'gemini-flash',
    label: 'Gemini Flash Lite',
    provider: 'gemini' as const,
    model: 'gemini-flash-lite-latest',
    badge: 'Google',
    badgeColor: 'bg-blue-100 text-blue-700',
    description: 'Google-ის სმარტი & უფასო',
    envVar: 'GEMINI_API_KEY',
    url: 'https://aistudio.google.com',
  },
  {
    id: 'gemini-flash-2',
    label: 'Gemini Flash',
    provider: 'gemini' as const,
    model: 'gemini-flash-latest',
    badge: 'Google',
    badgeColor: 'bg-blue-100 text-blue-700',
    description: 'Google-ის უახლესი მოდელი',
    envVar: 'GEMINI_API_KEY',
    url: 'https://aistudio.google.com',
  },
  {
    id: 'hf-mistral',
    label: 'Mistral 7B',
    provider: 'huggingface' as const,
    model: 'mistralai/Mistral-7B-Instruct-v0.3',
    badge: 'HF',
    badgeColor: 'bg-yellow-100 text-yellow-700',
    description: 'სტაბილური, კარგი ხარისხი',
    envVar: 'HF_TOKEN',
    url: 'https://huggingface.co/settings/tokens',
  },
  {
    id: 'hf-qwen-72b',
    label: 'Qwen 2.5 72B',
    provider: 'huggingface' as const,
    model: 'Qwen/Qwen2.5-72B-Instruct',
    badge: 'HF',
    badgeColor: 'bg-yellow-100 text-yellow-700',
    description: 'HF-ის ყველაზე ძლიერი',
    envVar: 'HF_TOKEN',
    url: 'https://huggingface.co/settings/tokens',
  },
  {
    id: 'hf-llama-8b',
    label: 'Llama 3.1 8B',
    provider: 'huggingface' as const,
    model: 'meta-llama/Llama-3.1-8B-Instruct',
    badge: 'HF',
    badgeColor: 'bg-yellow-100 text-yellow-700',
    description: 'Meta-ს მოდელი, მსუბუქი',
    envVar: 'HF_TOKEN',
    url: 'https://huggingface.co/settings/tokens',
  },
] as const

export type ModelId = typeof FREE_MODELS[number]['id']
export type Provider = 'groq' | 'gemini' | 'huggingface'

export const DEFAULT_MODEL_ID: ModelId = 'gemini-flash-2'

// ── Unified callAI ────────────────────────────────────────────────────

interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface CallOptions {
  messages: Message[]
  temperature?: number
  max_tokens?: number
}

function dispatch(config: typeof FREE_MODELS[number], opts: CallOptions): Promise<string> {
  switch (config.provider) {
    case 'groq':        return callGroq(config.model, opts)
    case 'gemini':      return callGemini(config.model, opts)
    case 'huggingface': return callHuggingFace(config.model, opts)
    default:            throw new Error('Unknown provider')
  }
}

/** Transient upstream failures worth retrying: rate limit / overloaded / 5xx. */
function isTransient(err: unknown): boolean {
  const m = err instanceof Error ? err.message : String(err)
  return /\b(429|500|502|503|504)\b/.test(m) || /UNAVAILABLE|high demand|overloaded/i.test(m)
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

/**
 * Calls the requested model, retrying transient errors, then failing over to
 * other configured providers. Gemini free tier returns 503 "high demand"
 * fairly often — without this, a single blip breaks caption generation.
 */
export async function callAI(modelId: string, opts: CallOptions): Promise<string> {
  const primary =
    FREE_MODELS.find(m => m.id === modelId) ??
    FREE_MODELS.find(m => m.id === DEFAULT_MODEL_ID)!

  const hasKey = (m: typeof FREE_MODELS[number]) => !!process.env[m.envVar]

  // Primary first, then one model per other provider that has a key configured.
  const chain = [primary]
  for (const m of FREE_MODELS) {
    if (m.id === primary.id) continue
    if (!hasKey(m)) continue
    if (chain.some(c => c.provider === m.provider)) continue
    chain.push(m)
  }

  let lastErr: unknown = new Error('No AI provider configured')

  for (const model of chain) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const out = await dispatch(model, opts)
        if (out) return out
        lastErr = new Error(`${model.id} returned empty content`)
        break // empty isn't transient; move to next provider
      } catch (err) {
        lastErr = err
        if (!isTransient(err) || attempt === 2) break
        await sleep(600 * (attempt + 1)) // 600ms, 1.2s
      }
    }
  }

  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr))
}

// ── Groq ──────────────────────────────────────────────────────────────

async function callGroq(model: string, opts: CallOptions): Promise<string> {
  const key = process.env.GROQ_API_KEY
  if (!key) throw new Error('GROQ_API_KEY is missing in .env.local — get it free at console.groq.com')

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: opts.messages,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.max_tokens ?? 500,
      // Groq's remaining chat models are gpt-oss reasoning models. At default
      // effort they spend the whole token budget thinking and return an empty
      // `content`; "low" makes them answer directly.
      reasoning_effort: 'low',
    }),
  })
  if (!res.ok) throw new Error(`Groq error ${res.status}: ${await res.text()}`)
  const data = await res.json()
  const msg = data?.choices?.[0]?.message
  // If the model still put everything in `reasoning`, use that rather than
  // returning empty and triggering a needless provider failover.
  return (msg?.content?.trim() || msg?.reasoning?.trim() || '')
}

// ── Google Gemini ─────────────────────────────────────────────────────

async function callGemini(model: string, opts: CallOptions): Promise<string> {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('GEMINI_API_KEY is missing in .env.local — get it free at aistudio.google.com')

  // Use OpenAI-compatible Gemini endpoint
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: opts.messages,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.max_tokens ?? 500,
    }),
  })
  if (!res.ok) throw new Error(`Gemini error ${res.status}: ${await res.text()}`)
  const data = await res.json()
  // Gemini sometimes returns an array-wrapped error body even with a 200.
  if (Array.isArray(data)) throw new Error(`Gemini error: ${JSON.stringify(data).slice(0, 200)}`)
  return data?.choices?.[0]?.message?.content?.trim() ?? ''
}

// ── HuggingFace ───────────────────────────────────────────────────────

async function callHuggingFace(model: string, opts: CallOptions): Promise<string> {
  const key = process.env.HF_TOKEN
  if (!key) throw new Error('HF_TOKEN is missing in .env.local — get it free at huggingface.co/settings/tokens')

  // Try new router first, fall back to legacy endpoint
  const endpoints = [
    `https://router.huggingface.co/hf-inference/models/${model}/v1/chat/completions`,
    `https://api-inference.huggingface.co/models/${model}/v1/chat/completions`,
  ]

  let lastError = ''
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: opts.messages,
          temperature: opts.temperature ?? 0.7,
          max_tokens: opts.max_tokens ?? 500,
        }),
        signal: AbortSignal.timeout(30000),
      })
      if (!res.ok) {
        lastError = `HuggingFace error ${res.status}: ${await res.text()}`
        continue
      }
      const data = await res.json()
      return data.choices[0]?.message?.content?.trim() ?? ''
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e)
    }
  }
  throw new Error(`HuggingFace failed: ${lastError}`)
}

// ── Legacy compat (used by existing API routes) ───────────────────────

export function getGroq() {
  return {
    chat: {
      completions: {
        create: (opts: { model?: string; messages: Message[]; temperature?: number; max_tokens?: number }) =>
          Promise.resolve({ choices: [{ message: { content: '' } }] }), // unused — routes now call callAI directly
      },
    },
  }
}

// ── Platform config ───────────────────────────────────────────────────

export type Platform =
  | 'instagram_post' | 'instagram_story' | 'reels'
  | 'tiktok' | 'youtube_shorts'
  | 'twitter' | 'linkedin'
  | 'facebook_post' | 'facebook_story'

export type Tone = 'casual' | 'professional' | 'funny' | 'inspirational' | 'educational'
export type Language = 'en' | 'ka' | 'es' | 'fr' | 'de' | 'ru'

export interface GenerateContentParams {
  topic: string
  platform: Platform
  tone: Tone
  language: Language
  modelId?: string
}

export const PLATFORM_CONFIG: Record<Platform, {
  label: string; width: number; height: number
  maxCaptionLength: number; hashtagCount: { min: number; max: number }; aspectRatio: string
  group: string; icon: string
}> = {
  instagram_post:  { label: 'Instagram Post',   width: 1080, height: 1080, maxCaptionLength: 2200, hashtagCount: { min: 15, max: 20 }, aspectRatio: '1:1',    group: 'Instagram', icon: '📸' },
  instagram_story: { label: 'Instagram Story',  width: 1080, height: 1920, maxCaptionLength: 2200, hashtagCount: { min: 15, max: 20 }, aspectRatio: '9:16',   group: 'Instagram', icon: '📖' },
  reels:           { label: 'Reels',            width: 1080, height: 1920, maxCaptionLength: 2200, hashtagCount: { min: 10, max: 15 }, aspectRatio: '9:16',   group: 'Instagram', icon: '🎬' },
  tiktok:          { label: 'TikTok',           width: 1080, height: 1920, maxCaptionLength: 2200, hashtagCount: { min: 5,  max: 10 }, aspectRatio: '9:16',   group: 'TikTok',    icon: '🎵' },
  youtube_shorts:  { label: 'YouTube Shorts',   width: 1080, height: 1920, maxCaptionLength: 5000, hashtagCount: { min: 3,  max: 8  }, aspectRatio: '9:16',   group: 'YouTube',   icon: '▶️' },
  twitter:         { label: 'X / Twitter',      width: 1200, height: 675,  maxCaptionLength: 280,  hashtagCount: { min: 1,  max: 2  }, aspectRatio: '16:9',   group: 'X',         icon: '✖️' },
  linkedin:        { label: 'LinkedIn',         width: 1200, height: 628,  maxCaptionLength: 3000, hashtagCount: { min: 3,  max: 5  }, aspectRatio: '1.91:1', group: 'LinkedIn',  icon: '💼' },
  facebook_post:   { label: 'Facebook Post',    width: 1200, height: 630,  maxCaptionLength: 63206,hashtagCount: { min: 5,  max: 10 }, aspectRatio: '1.91:1', group: 'Facebook',  icon: '👍' },
  facebook_story:  { label: 'Facebook Story',   width: 1080, height: 1920, maxCaptionLength: 63206,hashtagCount: { min: 5,  max: 10 }, aspectRatio: '9:16',   group: 'Facebook',  icon: '📲' },
}

export const TONE_LABELS: Record<Tone, string> = {
  casual:        '😊 Casual',
  professional:  '💼 Professional',
  funny:         '😂 Funny',
  inspirational: '🌟 Inspirational',
  educational:   '📚 Educational',
}

export const LANGUAGE_LABELS: Record<Language, string> = {
  en: '🇬🇧 English',
  ka: '🇬🇪 ქართული',
  es: '🇪🇸 Spanish',
  fr: '🇫🇷 French',
  de: '🇩🇪 German',
  ru: '🇷🇺 Russian',
}

export const FREE_DAILY_LIMIT = 5
