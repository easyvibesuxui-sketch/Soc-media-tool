import { Platform, PLATFORM_CONFIG } from './groq'

// Available Pollinations models (in fallback order)
// 'flux' = highest quality but sometimes overloaded (503)
// 'turbo' = fast, reliable, good quality
// 'flux-realism' = photorealistic style
export const POLLINATIONS_MODELS = ['turbo', 'flux', 'flux-realism'] as const
export type PollinationsModel = typeof POLLINATIONS_MODELS[number]

export function buildPollinationsUrl(
  prompt: string,
  platform: Platform,
  seed?: number,
  model: PollinationsModel = 'turbo'
): string {
  const config = PLATFORM_CONFIG[platform]
  const randomSeed = seed ?? Math.floor(Math.random() * 1000000)

  // Trim prompt to avoid URL length issues (max ~400 chars)
  const trimmedPrompt = prompt.length > 400 ? prompt.slice(0, 400) : prompt
  const encodedPrompt = encodeURIComponent(trimmedPrompt)

  return (
    `https://image.pollinations.ai/prompt/${encodedPrompt}` +
    `?width=${config.width}&height=${config.height}` +
    `&seed=${randomSeed}&nologo=true&model=${model}&nofeed=true`
  )
}
