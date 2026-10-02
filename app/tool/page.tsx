'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Sparkles, ArrowRight, ArrowLeft, Check, Loader2,
  RefreshCw, Download, Copy, ImageOff, Wand2, Upload,
  ChevronDown, ChevronUp, Video, Hash, FileText,
  CheckCircle, Instagram, Youtube, Twitter,
} from 'lucide-react'
import { Platform, Tone, Language, TONE_LABELS, LANGUAGE_LABELS, PLATFORM_CONFIG, DEFAULT_MODEL_ID, ModelId } from '@/lib/groq'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase'

// ── Types ────────────────────────────────────────────────────────────
type Step = 1 | 2 | 3 | 4

// ── Platform data ────────────────────────────────────────────────────
const PLATFORM_GROUPS = [
  {
    group: 'Instagram',
    color: 'from-pink-500 to-rose-500',
    bg: 'bg-pink-50 border-pink-200',
    activeBg: 'bg-pink-500',
    Icon: Instagram,
    platforms: ['instagram_post', 'instagram_story', 'reels'] as Platform[],
  },
  {
    group: 'TikTok',
    color: 'from-gray-900 to-gray-700',
    bg: 'bg-gray-50 border-gray-200',
    activeBg: 'bg-gray-800',
    Icon: Video,
    platforms: ['tiktok'] as Platform[],
  },
  {
    group: 'YouTube',
    color: 'from-red-500 to-red-600',
    bg: 'bg-red-50 border-red-200',
    activeBg: 'bg-red-500',
    Icon: Youtube,
    platforms: ['youtube_shorts'] as Platform[],
  },
  {
    group: 'X / Twitter',
    color: 'from-sky-500 to-blue-600',
    bg: 'bg-sky-50 border-sky-200',
    activeBg: 'bg-sky-500',
    Icon: Twitter,
    platforms: ['twitter'] as Platform[],
  },
  {
    group: 'LinkedIn',
    color: 'from-blue-600 to-blue-700',
    bg: 'bg-blue-50 border-blue-200',
    activeBg: 'bg-blue-600',
    Icon: () => <span className="text-white text-xs font-bold">in</span>,
    platforms: ['linkedin'] as Platform[],
  },
  {
    group: 'Facebook',
    color: 'from-blue-500 to-indigo-600',
    bg: 'bg-indigo-50 border-indigo-200',
    activeBg: 'bg-blue-600',
    Icon: () => <span className="text-white text-xs font-bold">f</span>,
    platforms: ['facebook_post', 'facebook_story'] as Platform[],
  },
]

// ── Helpers ──────────────────────────────────────────────────────────
function useCopy() {
  const [copied, setCopied] = useState<string | null>(null)
  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }
  return { copied, copy }
}

// ── Step indicator ────────────────────────────────────────────────────
const STEP_LABELS = ['Platform', 'Visuals', 'Content', 'Overview']

function StepBar({ step, completed }: { step: Step; completed: Set<Step> }) {
  return (
    <div className="flex items-center justify-between mb-8">
      {STEP_LABELS.map((label, i) => {
        const num = (i + 1) as Step
        const active = step === num
        const done = completed.has(num) && step > num
        return (
          <div key={num} className="flex items-center gap-2">
            {i > 0 && <div className={cn('flex-1 h-0.5 w-8 sm:w-12', done || step > num ? 'bg-violet-400' : 'bg-gray-200')} />}
            <div className="flex flex-col items-center gap-1">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all',
                active ? 'border-violet-500 bg-violet-500 text-white shadow-lg shadow-violet-200'
                  : done ? 'border-green-400 bg-green-400 text-white'
                  : step > num ? 'border-violet-300 bg-violet-100 text-violet-600'
                  : 'border-gray-200 bg-white text-gray-400'
              )}>
                {done ? <Check size={13} /> : num}
              </div>
              <span className={cn('text-[10px] font-semibold hidden sm:block', active ? 'text-violet-600' : 'text-gray-400')}>
                {label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Authed fetch headers ─────────────────────────────────────────────
// Attaches the Supabase access token so API routes can verify identity
// and enforce the daily limit server-side.
async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (isSupabaseConfigured()) {
    const { data } = await getSupabase().auth.getSession()
    if (data.session?.access_token) {
      headers.Authorization = `Bearer ${data.session.access_token}`
    }
  }
  return headers
}

// ── Main component ────────────────────────────────────────────────────
export default function ToolPage() {
  const router = useRouter()
  const [authState, setAuthState] = useState<'checking' | 'authed'>(
    isSupabaseConfigured() ? 'checking' : 'authed' // dev mode without Supabase: skip guard
  )

  // Auth guard — redirect to login if not signed in
  useEffect(() => {
    if (!isSupabaseConfigured()) return
    getSupabase().auth.getSession().then(({ data }) => {
      if (data.session) setAuthState('authed')
      else router.replace('/login?next=/tool')
    })
  }, [router])

  const [quotaError, setQuotaError] = useState<string | null>(null)
  const [step, setStep] = useState<Step>(1)
  const [completed, setCompleted] = useState<Set<Step>>(new Set())

  // Step 1
  const [platform, setPlatform] = useState<Platform>('instagram_post')
  const [topic, setTopic] = useState('')
  const [tone, setTone] = useState<Tone>('casual')
  const [language, setLanguage] = useState<Language>('en')

  // Step 2
  const [imageVariants, setImageVariants] = useState<(string | null)[]>([null, null, null, null])
  const [loadingSlots, setLoadingSlots] = useState<number[]>([])
  const [selectedVariant, setSelectedVariant] = useState(0)
  const [imagePrompt, setImagePrompt] = useState('')
  const [promptOpen, setPromptOpen] = useState(true)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [generatingVideo, setGeneratingVideo] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)

  // Step 3
  const [caption, setCaption] = useState('')
  const [hashtags, setHashtags] = useState<string[]>([])
  const [description, setDescription] = useState('')
  const [generatingCaption, setGeneratingCaption] = useState(false)
  const [generatingHashtags, setGeneratingHashtags] = useState(false)
  const [generatingDescription, setGeneratingDescription] = useState(false)

  // UI
  const [error, setError] = useState<string | null>(null)
  const { copied, copy } = useCopy()

  const config = PLATFORM_CONFIG[platform]
  const selectedUrl = uploadedImage ?? imageVariants[selectedVariant]

  // ── Image generation ─────────────────────────────────────────────
  const generateOneSlot = async (idx: number, existingPrompt?: string, isRetry = false): Promise<void> => {
    const seed = Math.floor(Math.random() * 999999)
    setLoadingSlots(p => [...p.filter(i => i !== idx), idx])
    setImageVariants(p => { const n = [...p]; n[idx] = null; return n })
    try {
      const body: Record<string, unknown> = { platform, imageModelId: 'gemini', seed, modelId: DEFAULT_MODEL_ID }
      if (existingPrompt) body.existingPrompt = existingPrompt
      else Object.assign(body, { topic, tone, language })

      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify(body),
      })
      const d = await res.json()

      // Auth / quota problems are final — don't burn a retry on them.
      if (res.status === 401) {
        router.replace('/login?next=/tool')
        return
      }
      if (res.status === 429) {
        setQuotaError(d.error ?? 'Daily limit reached.')
        return
      }

      if (d.imageUrl) {
        setImageVariants(p => { const n = [...p]; n[idx] = d.imageUrl; return n })
        if (d.imagePrompt && !existingPrompt) setImagePrompt(d.imagePrompt)
      } else if (!isRetry) {
        setLoadingSlots(p => p.filter(i => i !== idx))
        await new Promise(r => setTimeout(r, 2000))
        return generateOneSlot(idx, existingPrompt, true)
      }
    } finally {
      setLoadingSlots(p => p.filter(i => i !== idx))
    }
  }

  const generateAllImages = async (existingPrompt?: string) => {
    if (!topic.trim() && !existingPrompt) return
    setUploadedImage(null)
    setVideoUrl(null)
    setImageVariants([null, null, null, null])
    setSelectedVariant(0)
    setLoadingSlots([0, 1, 2, 3])

    // Slot 0 first (also fetches the AI prompt)
    const seed0 = Math.floor(Math.random() * 999999)
    const body: Record<string, unknown> = existingPrompt
      ? { platform, imageModelId: 'gemini', seed: seed0, modelId: DEFAULT_MODEL_ID, existingPrompt }
      : { topic, platform, tone, language, modelId: DEFAULT_MODEL_ID, imageModelId: 'gemini', seed: seed0 }
    const res = await fetch('/api/generate-image', {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(body),
    })
    const d = await res.json()
    setLoadingSlots(p => p.filter(i => i !== 0))
    if (d.imageUrl) {
      setImageVariants(p => { const n = [...p]; n[0] = d.imageUrl; return n })
      const prompt = d.imagePrompt ?? existingPrompt ?? topic
      if (!existingPrompt) setImagePrompt(prompt)
      // Remaining 3 sequentially
      for (const i of [1, 2, 3]) await generateOneSlot(i, prompt)
    } else {
      setLoadingSlots([])
    }
  }

  // ── Upload image ──────────────────────────────────────────────────
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      setUploadedImage(ev.target?.result as string)
      setImageVariants([null, null, null, null])
      setVideoUrl(null)
    }
    reader.readAsDataURL(file)
  }

  // ── Video ─────────────────────────────────────────────────────────
  const generateVideo = async () => {
    if (!imagePrompt) return
    setGeneratingVideo(true)
    try {
      const res = await fetch('/api/generate-video', {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({ prompt: imagePrompt, platform }),
      })
      const d = await res.json()
      if (d.videoUrl) setVideoUrl(d.videoUrl)
    } finally {
      setGeneratingVideo(false)
    }
  }

  // ── Caption / Hashtags / Description ─────────────────────────────
  const generateCaption = async () => {
    if (!topic.trim()) return
    setGeneratingCaption(true)
    setCaption('')
    try {
      const res = await fetch('/api/generate-caption', {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({ topic, platform, tone, language, modelId: DEFAULT_MODEL_ID }),
      })
      const d = await res.json()
      setCaption(d.caption ?? '')
    } finally { setGeneratingCaption(false) }
  }

  const generateHashtags = async () => {
    if (!topic.trim()) return
    setGeneratingHashtags(true)
    setHashtags([])
    try {
      const res = await fetch('/api/generate-hashtags', {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({ topic, platform, tone, language, modelId: DEFAULT_MODEL_ID }),
      })
      const d = await res.json()
      setHashtags(d.hashtags ?? [])
    } finally { setGeneratingHashtags(false) }
  }

  const generateDescription = async () => {
    if (!topic.trim()) return
    setGeneratingDescription(true)
    setDescription('')
    try {
      const res = await fetch('/api/generate-caption', {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({ topic, platform, tone, language, modelId: DEFAULT_MODEL_ID, mode: 'description' }),
      })
      const d = await res.json()
      setDescription(d.caption ?? '')
    } finally { setGeneratingDescription(false) }
  }

  const fixText = async (text: string, setter: (v: string) => void) => {
    const res = await fetch('/api/generate-caption', {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({ topic: text, platform, tone, language, modelId: DEFAULT_MODEL_ID, mode: 'fix' }),
    })
    const d = await res.json()
    if (d.caption) setter(d.caption)
  }

  // ── Navigation ────────────────────────────────────────────────────
  const goNext = () => {
    if (step === 1 && !topic.trim()) { setError('Please enter a topic to continue'); return }
    setError(null)
    setCompleted(p => { const s = new Set(p); s.add(step); return s })
    const next = (step + 1) as Step
    setStep(next)
    if (next === 2 && imageVariants.every(v => !v) && !loadingSlots.length && !uploadedImage) generateAllImages()
    if (next === 3) {
      if (!caption && !generatingCaption) generateCaption()
      if (!hashtags.length && !generatingHashtags) generateHashtags()
      if (!description && !generatingDescription) generateDescription()
    }
  }

  const goBack = () => {
    setError(null)
    setStep(p => Math.max(1, p - 1) as Step)
  }

  // ── Download ──────────────────────────────────────────────────────
  const download = (url: string, name: string) => {
    const a = document.createElement('a')
    a.href = url
    a.download = name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const isLoading = loadingSlots.length > 0

  // Don't render the tool until we know the visitor is signed in —
  // otherwise the UI flashes before the redirect to /login.
  if (authState === 'checking') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-violet-50/40 via-white to-fuchsia-50/30">
        <Loader2 size={28} className="animate-spin text-violet-500 mb-3" />
        <p className="text-sm text-gray-400">Loading your workspace…</p>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50/40 via-white to-fuchsia-50/30">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center">
              <Sparkles size={13} className="text-white" />
            </div>
            <span className="font-extrabold text-gray-900 text-sm">
              PostCraft<span className="text-violet-600"> AI</span>
            </span>
          </Link>
          <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
            Step {step} of 4
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <StepBar step={step} completed={completed} />

        {quotaError && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <Sparkles size={16} className="text-amber-500 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800">Daily limit reached</p>
              <p className="text-xs text-amber-700 mt-0.5">{quotaError}</p>
            </div>
            <button
              onClick={() => setQuotaError(null)}
              className="text-amber-400 hover:text-amber-600 text-lg leading-none"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">

          {/* ══ STEP 1: Platform + Topic ══ */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900 mb-1">Where are you posting?</h2>
                <p className="text-sm text-gray-500">Choose your platform — PostCraft AI adapts image sizes, captions and hashtag counts automatically.</p>
              </div>

              {/* Platform grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {PLATFORM_GROUPS.map(({ group, color, bg, activeBg, Icon, platforms }) =>
                  platforms.map(p => {
                    const cfg = PLATFORM_CONFIG[p]
                    const active = platform === p
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPlatform(p)}
                        className={cn(
                          'flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left',
                          active
                            ? `border-violet-400 bg-violet-50 shadow-md shadow-violet-100`
                            : `border-gray-200 hover:border-violet-300 hover:bg-violet-50/50`
                        )}
                      >
                        <div className={cn('w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center flex-shrink-0', color)}>
                          <Icon size={15} className="text-white" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-900 truncate">{cfg.label}</p>
                          <p className="text-[10px] text-gray-400">{cfg.aspectRatio}</p>
                        </div>
                        {active && <Check size={13} className="ml-auto text-violet-500 flex-shrink-0" />}
                      </button>
                    )
                  })
                )}
              </div>

              {/* Topic */}
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">
                  What&apos;s your post about? <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={e => { setTopic(e.target.value); setError(null) }}
                  onKeyDown={e => e.key === 'Enter' && goNext()}
                  placeholder='e.g. "morning coffee routine", "startup growth tips", "travel in Tbilisi"'
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-300 transition-all"
                />
                {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
              </div>

              {/* Tone + Language */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">Tone</label>
                  <select
                    value={tone}
                    onChange={e => setTone(e.target.value as Tone)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-violet-300"
                  >
                    {(Object.entries(TONE_LABELS) as [Tone, string][]).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">Language</label>
                  <select
                    value={language}
                    onChange={e => setLanguage(e.target.value as Language)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-violet-300"
                  >
                    {(Object.entries(LANGUAGE_LABELS) as [Language, string][]).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Info strip */}
              <div className="flex flex-wrap gap-2 text-xs text-gray-500 bg-gray-50 rounded-xl px-4 py-3">
                <span className="font-semibold text-gray-700">{config.label}</span>
                <span>·</span><span>{config.width}×{config.height}px</span>
                <span>·</span><span>Max {config.maxCaptionLength} chars</span>
                <span>·</span><span>{config.hashtagCount.min}–{config.hashtagCount.max} hashtags</span>
              </div>
            </div>
          )}

          {/* ══ STEP 2: Visuals ══ */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-extrabold text-gray-900 mb-1">Create your visual</h2>
                  <p className="text-sm text-gray-500">Generate AI images, upload your own, or make a video.</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <label className="flex items-center gap-1.5 cursor-pointer px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-all">
                    <Upload size={13} />
                    Upload
                    <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                  </label>
                  <button
                    type="button"
                    onClick={() => generateAllImages(imagePrompt || undefined)}
                    disabled={isLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-all"
                  >
                    <RefreshCw size={12} className={cn(isLoading && 'animate-spin')} />
                    Regenerate
                  </button>
                </div>
              </div>

              {/* Uploaded image view */}
              {uploadedImage && (
                <div className="relative rounded-2xl overflow-hidden border-2 border-violet-400">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={uploadedImage} alt="Uploaded" className="w-full max-h-64 object-contain bg-gray-50" />
                  <div className="absolute top-2 left-2 bg-violet-600 text-white text-xs px-2 py-0.5 rounded-full font-semibold">Your image</div>
                  <button
                    onClick={() => setUploadedImage(null)}
                    className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full"
                  >remove</button>
                </div>
              )}

              {/* Prompt editor */}
              {!uploadedImage && (
                <div className="rounded-xl border border-gray-200 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setPromptOpen(o => !o)}
                    className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Wand2 size={13} className="text-violet-500" />
                      <span className="text-xs font-bold text-gray-600">Image Prompt</span>
                      {imagePrompt && (
                        <span className="text-[10px] text-gray-400 truncate max-w-[160px] hidden sm:block">{imagePrompt}</span>
                      )}
                    </div>
                    {promptOpen ? <ChevronUp size={13} className="text-gray-400" /> : <ChevronDown size={13} className="text-gray-400" />}
                  </button>
                  {promptOpen && (
                    <div className="p-3 space-y-2 bg-white">
                      <textarea
                        value={imagePrompt}
                        onChange={e => setImagePrompt(e.target.value)}
                        rows={2}
                        placeholder="AI writes this automatically — or edit it yourself…"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-violet-300"
                      />
                      <button
                        type="button"
                        onClick={() => generateAllImages(imagePrompt || undefined)}
                        disabled={isLoading || !imagePrompt.trim()}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 transition-all"
                      >
                        <Wand2 size={11} />
                        Generate with this prompt
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* 2×2 grid */}
              {!uploadedImage && (
                <div className="grid grid-cols-2 gap-2">
                  {[0, 1, 2, 3].map(idx => {
                    const url = imageVariants[idx]
                    const loading = loadingSlots.includes(idx)
                    const selected = selectedVariant === idx && !!url
                    const aspect = Math.min(config.width / config.height, 1.5)

                    return (
                      <div
                        key={idx}
                        onClick={() => url && !loading && setSelectedVariant(idx)}
                        className={cn(
                          'relative rounded-xl overflow-hidden border-2 cursor-pointer group transition-all',
                          selected ? 'border-violet-500 ring-2 ring-violet-300' : 'border-transparent hover:border-violet-300',
                          !url && !loading && 'cursor-default'
                        )}
                        style={{ aspectRatio: aspect }}
                      >
                        {loading ? (
                          <div className="absolute inset-0 bg-gradient-to-br from-violet-50 to-fuchsia-50 flex flex-col items-center justify-center gap-1.5">
                            <Loader2 size={20} className="animate-spin text-violet-400" />
                            <span className="text-[10px] text-violet-400 font-medium">Generating…</span>
                          </div>
                        ) : url ? (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt={`Variant ${idx + 1}`} className="absolute inset-0 w-full h-full object-cover" />
                            {selected && (
                              <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center shadow">
                                <Check size={11} className="text-white" strokeWidth={3} />
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={e => { e.stopPropagation(); generateOneSlot(idx, imagePrompt || undefined) }}
                              className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center transition-opacity hover:bg-black/70"
                            >
                              <RefreshCw size={10} className="text-white" />
                            </button>
                          </>
                        ) : (
                          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                            <ImageOff size={18} className="text-gray-300" />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Video section */}
              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Video size={15} className="text-fuchsia-500" />
                    <span className="text-sm font-bold text-gray-800">Make a Video</span>
                    <span className="text-xs bg-fuchsia-100 text-fuchsia-600 px-2 py-0.5 rounded-full font-semibold">optional</span>
                  </div>
                </div>

                {videoUrl ? (
                  <div className="space-y-2">
                    <video src={videoUrl} autoPlay loop muted className="w-full rounded-xl max-h-48 object-contain bg-gray-900" />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={generateVideo}
                        disabled={generatingVideo}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <RefreshCw size={11} className={cn(generatingVideo && 'animate-spin')} />
                        Regenerate video
                      </button>
                      <button
                        type="button"
                        onClick={() => download(videoUrl, `postcraft-video-${Date.now()}.mp4`)}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-fuchsia-600 text-white hover:bg-fuchsia-700"
                      >
                        <Download size={11} />
                        Download video
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={generateVideo}
                    disabled={generatingVideo || (!imagePrompt && !topic)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 text-sm font-semibold hover:bg-fuchsia-100 disabled:opacity-50 transition-all"
                  >
                    {generatingVideo ? <Loader2 size={15} className="animate-spin" /> : <Video size={15} />}
                    {generatingVideo ? 'Generating video…' : 'Generate video from image'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ══ STEP 3: Content ══ */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900 mb-1">Write your content</h2>
                <p className="text-sm text-gray-500">AI-generated for {config.label}. Edit freely or regenerate.</p>
              </div>

              {/* Caption */}
              <ContentBlock
                icon={<FileText size={15} className="text-violet-500" />}
                label="Caption"
                loading={generatingCaption}
                onRegenerate={generateCaption}
                onFix={() => fixText(caption, setCaption)}
              >
                <textarea
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  rows={4}
                  placeholder="Your caption will appear here…"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-violet-300"
                />
                {caption && (
                  <p className={cn('text-xs mt-1', caption.length > config.maxCaptionLength ? 'text-red-500' : 'text-gray-400')}>
                    {caption.length}/{config.maxCaptionLength} chars
                  </p>
                )}
              </ContentBlock>

              {/* Hashtags */}
              <ContentBlock
                icon={<Hash size={15} className="text-fuchsia-500" />}
                label="Hashtags"
                loading={generatingHashtags}
                onRegenerate={generateHashtags}
              >
                {generatingHashtags ? (
                  <div className="flex items-center gap-2 py-4 text-sm text-gray-400">
                    <Loader2 size={14} className="animate-spin" /> Generating hashtags…
                  </div>
                ) : hashtags.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {hashtags.map((h, i) => (
                      <span key={i} className="inline-flex items-center gap-1 bg-violet-50 text-violet-700 text-xs px-2.5 py-1 rounded-full font-medium border border-violet-100">
                        {h}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic py-2">No hashtags yet — click Regenerate</p>
                )}
              </ContentBlock>

              {/* Description / Label */}
              <ContentBlock
                icon={<FileText size={15} className="text-pink-500" />}
                label="Description / Label"
                loading={generatingDescription}
                onRegenerate={generateDescription}
                onFix={() => fixText(description, setDescription)}
              >
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Short description or label for your post…"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-violet-300"
                />
              </ContentBlock>
            </div>
          )}

          {/* ══ STEP 4: Overview + Thank you ══ */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center pb-2">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-violet-200">
                  <CheckCircle size={28} className="text-white" />
                </div>
                <h2 className="text-2xl font-extrabold text-gray-900 mb-1">Your post is ready! 🎉</h2>
                <p className="text-sm text-gray-500">Copy each section or download your visuals below.</p>
              </div>

              {/* Image/Video preview */}
              <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Visual</p>
                <div className="flex gap-3 items-start">
                  {(selectedUrl || uploadedImage) && (
                    <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 flex-shrink-0 bg-gray-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={selectedUrl ?? uploadedImage ?? ''}
                        alt="Selected"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  {videoUrl && (
                    <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-fuchsia-200 flex-shrink-0 bg-gray-900">
                      <video src={videoUrl} autoPlay loop muted className="w-full h-full object-contain" />
                    </div>
                  )}
                  <div className="flex flex-col gap-2 flex-1">
                    {(selectedUrl || uploadedImage) && (
                      <button
                        onClick={() => download(selectedUrl ?? uploadedImage ?? '', `postcraft-image-${Date.now()}.jpg`)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 transition-all"
                      >
                        <Download size={13} />
                        Download Image
                      </button>
                    )}
                    {videoUrl && (
                      <button
                        onClick={() => download(videoUrl, `postcraft-video-${Date.now()}.mp4`)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-fuchsia-600 text-white text-xs font-bold hover:bg-fuchsia-700 transition-all"
                      >
                        <Download size={13} />
                        Download Video
                      </button>
                    )}
                    {!selectedUrl && !uploadedImage && !videoUrl && (
                      <p className="text-xs text-gray-400 italic">No visual selected — go back to Step 2</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Caption */}
              <OverviewSection
                label="Caption"
                icon={<FileText size={14} className="text-violet-500" />}
                content={caption}
                copyKey="caption"
                copied={copied}
                onCopy={() => copy(caption, 'caption')}
              />

              {/* Hashtags */}
              <OverviewSection
                label="Hashtags"
                icon={<Hash size={14} className="text-fuchsia-500" />}
                content={hashtags.join(' ')}
                copyKey="hashtags"
                copied={copied}
                onCopy={() => copy(hashtags.join(' '), 'hashtags')}
                renderContent={
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {hashtags.map((h, i) => (
                      <span key={i} className="bg-violet-50 text-violet-700 text-xs px-2 py-0.5 rounded-full border border-violet-100">{h}</span>
                    ))}
                  </div>
                }
              />

              {/* Description */}
              <OverviewSection
                label="Description / Label"
                icon={<FileText size={14} className="text-pink-500" />}
                content={description}
                copyKey="description"
                copied={copied}
                onCopy={() => copy(description, 'description')}
              />

              {/* Copy all */}
              <button
                onClick={() => copy(
                  `${caption}\n\n${hashtags.join(' ')}\n\n${description}`,
                  'all'
                )}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white font-bold text-sm hover:opacity-90 transition-all shadow-lg"
              >
                {copied === 'all' ? <CheckCircle size={16} /> : <Copy size={16} />}
                {copied === 'all' ? 'Copied everything!' : 'Copy full post package'}
              </button>

              {/* New post CTA */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1)
                    setCompleted(new Set())
                    setTopic('')
                    setImageVariants([null, null, null, null])
                    setImagePrompt('')
                    setCaption('')
                    setHashtags([])
                    setDescription('')
                    setVideoUrl(null)
                    setUploadedImage(null)
                  }}
                  className="text-sm text-violet-600 hover:text-violet-800 underline font-medium"
                >
                  Create another post →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Navigation buttons ── */}
        {step < 4 && (
          <div className="flex items-center justify-between mt-5 gap-3">
            <button
              type="button"
              onClick={goBack}
              disabled={step === 1}
              className={cn(
                'flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm font-semibold transition-all',
                step === 1 ? 'opacity-0 pointer-events-none' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              )}
            >
              <ArrowLeft size={15} />
              Back
            </button>

            <button
              type="button"
              onClick={goNext}
              disabled={step === 2 && isLoading && imageVariants.every(v => !v)}
              className="flex items-center gap-2 px-7 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white text-sm font-bold hover:opacity-90 transition-all shadow-md disabled:opacity-60"
            >
              {step === 3 ? 'See Overview' : 'Next'}
              <ArrowRight size={15} />
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

// ── ContentBlock ─────────────────────────────────────────────────────
function ContentBlock({
  icon, label, loading, onRegenerate, onFix, children,
}: {
  icon: React.ReactNode
  label: string
  loading: boolean
  onRegenerate: () => void
  onFix?: () => void
  children: React.ReactNode
}) {
  return (
    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-bold text-gray-800">{label}</span>
          {loading && <Loader2 size={13} className="animate-spin text-gray-400" />}
        </div>
        <div className="flex gap-2">
          {onFix && (
            <button
              type="button"
              onClick={onFix}
              disabled={loading}
              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 disabled:opacity-50 border border-amber-200 font-semibold"
            >
              <Wand2 size={10} />
              Fix
            </button>
          )}
          <button
            type="button"
            onClick={onRegenerate}
            disabled={loading}
            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-violet-50 text-violet-700 hover:bg-violet-100 disabled:opacity-50 border border-violet-200 font-semibold"
          >
            <RefreshCw size={10} className={cn(loading && 'animate-spin')} />
            Regenerate
          </button>
        </div>
      </div>
      {children}
    </div>
  )
}

// ── OverviewSection ──────────────────────────────────────────────────
function OverviewSection({
  label, icon, content, copyKey, copied, onCopy, renderContent,
}: {
  label: string
  icon: React.ReactNode
  content: string
  copyKey: string
  copied: string | null
  onCopy: () => void
  renderContent?: React.ReactNode
}) {
  return (
    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{label}</span>
        </div>
        <button
          onClick={onCopy}
          disabled={!content}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
            copied === copyKey
              ? 'bg-green-100 text-green-700 border border-green-200'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-violet-50 hover:text-violet-700 hover:border-violet-200'
          )}
        >
          {copied === copyKey ? <><CheckCircle size={11} /> Copied!</> : <><Copy size={11} /> Copy</>}
        </button>
      </div>
      {renderContent ?? (
        content
          ? <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{content}</p>
          : <p className="text-xs text-gray-400 italic">Not generated yet</p>
      )}
    </div>
  )
}
