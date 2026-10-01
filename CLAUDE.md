# PostCraft AI — Project Guide for Claude Code

AI social-media content generator. Next.js 16 + React 19 + TypeScript + Tailwind.
Generates images, captions and hashtags for 9 social platforms.

---

## Commands

```bash
npm run dev     # dev server on :3000
npm run build   # production build — ALWAYS run before claiming done
npm run lint    # eslint (flat config)
npx tsc --noEmit
```

**`tsc` passing is not enough.** `npm run build` catches things `tsc` cannot —
for example Next rejects non-standard exports from a `page.tsx`. Run the build.

---

## Architecture

```
app/
  page.tsx              Landing (marketing). CTAs → /login
  login/page.tsx        Sign in/up: Google OAuth + email/password
  tool/page.tsx         THE PRODUCT — 4-step wizard, client-side auth guard
  blog/page.tsx         Blog index (reads lib/blog.ts)
  blog/[slug]/page.tsx  Post — fetches AI-generated body at runtime
  about|contact|privacy|terms/   AdSense-required pages
  auth/callback/route.ts  OAuth code exchange + user upsert
  auth/error/page.tsx
  sitemap.ts, robots.ts   SEO (use NEXT_PUBLIC_SITE_URL)
  api/
    generate-image/      Gemini image → Pollinations fallback
    generate-caption/    modes: caption | description | fix
    generate-hashtags/
    generate-suggestions/
    generate-video/
    generate-blog/       PUBLIC (crawlers need it) + cached
    check-limit/         legacy, superseded by lib/api-guard.ts
    webhook/lemonsqueezy/
lib/
  groq.ts        Model registry + callAI() with retry/failover. Core AI entry point.
  api-guard.ts   Server-side auth + daily limit. Guards every AI route.
  blog.ts        BLOG_POSTS — single source of truth (pages AND sitemap import it)
  supabase.ts    getSupabase() / createAdminClient() / isSupabaseConfigured()
  pollinations.ts, utils.ts
components/
  MarketingNav.tsx     Nav with live auth state
  MarketingFooter.tsx
_unused-components/   Dead pre-redesign components. Gitignored. Safe to delete.
```

### The 4-step tool flow (`app/tool/page.tsx`)
1. Platform + topic + tone + language
2. Generate 4 image variants (or upload) → optional video
3. Caption + hashtags + description (AI, with "fix" option)
4. Overview — per-section copy buttons + downloads

---

## Non-obvious rules — read before editing

### 1. Images generate SEQUENTIALLY, never in parallel
Pollinations rate-limits hard. Firing 4 at once made 3 of 4 fail.
`generateAllImages()` does slot 0 first (it produces the shared AI prompt),
then slots 1–3 with `for...of await`. Each slot auto-retries once after 2s.
**Do not "optimize" this into `Promise.all`.**

### 2. Every AI route must call `guardRequest()`
```ts
const guard = await guardRequest(req)
if (!guard.ok) return guard.response
// ...on success:
await recordUsage(guard.userId, guard.isPaid)
```
The user id comes from the **verified Supabase JWT**, never the request body —
otherwise anyone can spoof a user or skip the limit. `/api/generate-blog` is the
one deliberate exception (crawlers must reach it); it is cached instead.

### 3. The guard FAILS CLOSED in production
No Supabase env vars + `NODE_ENV=production` → every AI route returns **503**.
This is intentional: missing config must not leave the API keys open to the world.
If a deployed site returns 503 on generation, the Supabase vars aren't set.

### 4. Always call AI through `callAI()` in `lib/groq.ts`
It retries transient 429/5xx and fails over to another provider. Gemini's free
tier returns `503 high demand` regularly — a direct `fetch` breaks on the first
blip. The blog route used to fetch Gemini directly and failed constantly.

### 5. Model names rot — verify before trusting
Every model in this project was decommissioned once already. Check live:
```bash
curl -s "https://generativelanguage.googleapis.com/v1beta/models?key=$GEMINI_API_KEY"
curl -s https://api.groq.com/openai/v1/models -H "Authorization: Bearer $GROQ_API_KEY"
```
Prefer Gemini's `*-latest` aliases so Google's next retirement doesn't break us.

### 6. Groq models are reasoning models
`openai/gpt-oss-*` put the answer in `reasoning` and leave `content` empty at
default effort. `callGroq` sends `reasoning_effort: 'low'` and falls back to the
`reasoning` field. Don't remove either.

### 7. Gemini image generation is PAID
Nano Banana (`gemini-*-image`) returns 429 on a free key. The code tries Gemini,
then falls through to Pollinations. Pollinations is what actually serves images today.

### 8. No `Buffer`, no `next/image` remote hosts
`Buffer` was replaced with a portable `toBase64()` so routes run on any runtime.
`next.config.mjs` deliberately has **no** `images.remotePatterns` — images arrive
as base64 data URLs from our own API, and an empty remotePatterns keeps the Next
Image Optimizer closed (it was the target of a critical CVE).

### 9. `BLOG_POSTS` lives in `lib/blog.ts`
Not in a page. `app/sitemap.ts` imports it, and Next forbids extra exports from
page files — re-exporting it from `app/blog/page.tsx` breaks the build.

### 10. `lucide-react` is pinned below v1
v1 removed brand icons (Instagram, Youtube, Twitter, Facebook, Chrome) which the
UI uses. `0.577.0` is the newest version that has them AND supports React 19.

---

## Environment variables

```bash
# AI — required
GEMINI_API_KEY=         # primary (text + attempted image)
GROQ_API_KEY=           # failover
HF_TOKEN=               # failover

# Auth — REQUIRED IN PRODUCTION (without these the AI routes return 503)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# SEO — sitemap / robots / canonical
NEXT_PUBLIC_SITE_URL=https://your-domain.com

# Payments — optional, unused so far
LEMONSQUEEZY_WEBHOOK_SECRET=
LEMONSQUEEZY_STORE_ID=
LEMONSQUEEZY_PRODUCT_ID=
NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_URL=
```

**Never commit `.env.local`.** It is gitignored. Do not paste key values into
code, docs, commit messages or chat.

### Supabase `users` table
`id` (uuid, PK) · `email` (text) · `is_paid` (bool) · `daily_count` (int)
· `last_reset` (date) · `created_at` (timestamp)

Free tier = `FREE_DAILY_LIMIT` (5) generations/day, in `lib/groq.ts`.

---

## Verification checklist

Before saying a change works:

1. `npx tsc --noEmit`
2. `npm run lint`
3. `npm run build` ← catches what tsc can't
4. `npm audit` — keep at 0
5. Actually exercise the route:
   ```bash
   npm run dev
   curl -X POST localhost:3000/api/generate-caption -H 'Content-Type: application/json' \
     -d '{"topic":"test","platform":"instagram_post","tone":"casual","language":"en"}'
   ```
   In dev the guard is open so this hits the real AI path. **A green build does
   not mean the AI works** — every model in this repo was once dead while the
   build passed.
6. Guard check: `NODE_ENV=production npm start` then POST an AI route → expect 503
   when Supabase vars are empty.

---

## Known gaps / TODO

- Supabase keys empty → login non-functional, AI routes 503 in production
- Contact form is simulated (`setSent(true)`), sends nothing — needs Resend/Formspree
- No GA4, no AdSense script tag yet
- `app/api/check-limit/route.ts` is superseded by `lib/api-guard.ts` — trusts a
  client-supplied `userId`. Delete or rewrite; don't build on it.
- Pricing page advertises a $29 Pro tier with no checkout wired up
- Landing page stats ("50k+ posts", testimonials) are placeholder copy, not real
- `_unused-components/` can be deleted

---

## Style

- TypeScript strict. No `any` — use `unknown` + narrowing.
- Tailwind utilities inline; no CSS modules.
- Comments explain **why**, not what.
- API routes: `try/catch`, return `{ error: string }` with a real status code.
- Server-only secrets must never reach a `NEXT_PUBLIC_*` variable.
