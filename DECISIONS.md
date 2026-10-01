# Project History & Decision Log

Why the code looks the way it does. Read this before reversing anything —
most of these were fixed the hard way, by running the thing and watching it fail.

---

## Phase 1 — Image generation reliability

**Symptom:** 3 of 4 image slots failed every time.

**Cause:** all four fired with `Promise.all`; Pollinations rate-limited the burst.

**Fix:** sequential generation — slot 0 first (it produces the shared AI prompt),
then 1–3 via `for...of await`. Added a single auto-retry per slot after 2s, a 1s
pause between provider fallbacks, a 45s timeout, and a `byteLength < 1000` check
to reject error pages masquerading as images.

**Rule:** never parallelise image generation.

---

## Phase 2 — Redesign into a SaaS product

Grew from a single-page tool into a full product so it could qualify for AdSense:

- Landing page with CTAs
- AdSense-required pages: Privacy, Terms, About, Contact, Blog
- Blog with AI-generated posts (on demand, no CMS)
- 4-step tool flow, moved to `/tool`
- 9 platforms (Instagram ×3, TikTok, YouTube Shorts, X, LinkedIn, Facebook ×2)
- Gemini chosen as the primary AI for both text and images

**Blog design:** generated on demand by AI rather than stored in a CMS. Keeps the
content unique for AdSense without any infrastructure. Cached per slug.

---

## Phase 3 — Auth flow

Chosen shape: **Landing → `/login` → Google OAuth or email → `/auth/callback` → `/tool`**

- `/login` — combined sign-in/sign-up, Google + email/password
- `/tool` — client-side guard; renders a loading state while checking so the UI
  never flashes before the redirect
- `MarketingNav` shows live auth state (avatar + sign out, or Sign In)
- Landing CTAs point at `/login`, not `/tool`

---

## Phase 4 — Full review (the one that found real damage)

A read-only review would have missed all of this. Running the app is what exposed it.

### Security

| Problem | Fix |
|---|---|
| **Every AI route was unauthenticated.** Anyone could POST and burn the API keys. | Created `lib/api-guard.ts` — verifies the Supabase JWT server-side, enforces the daily limit. Wired into all 5 generate routes. |
| **`check-limit` was trivially bypassable** — took `userId` from the client. Omit it → unlimited. And `tool/page.tsx` never called it, so the limit was never enforced at all. | User id now comes from the verified token only. `recordUsage()` counts successful generations. |
| **First version of the guard failed OPEN** — with Supabase env empty it allowed everything, including in production. | Now fails **closed**: production + missing config → 503. |
| `/api/generate-blog` billed a fresh Gemini call on every page view, crawlers included. | In-process cache + `revalidate = 86400`. 30s → 0.06s on repeat. |

### Dependencies

- `next@14.2.3` had a **critical RCE** → upgraded (eventually to 16)
- Removed `@supabase/ssr` and `groq-sdk` — both unused
- Removed `images.remotePatterns` — `next/image` is never used, and that config
  was exactly what the critical Image-Optimizer CVE targeted
- `npm audit`: **10 → 5 → 0**

### Cleanup

- Deleted duplicate `next.config.ts` (Next 14 only reads `.mjs`; the `.ts` was dead)
- Archived 11 orphaned pre-redesign components to `_unused-components/`
- Added `sitemap.ts`, `robots.ts`, full metadata (canonical, OG, Twitter)
- Moved `BLOG_POSTS` to `lib/blog.ts` — the sitemap importing a page file is fragile,
  and Next forbids extra exports from pages (this broke the build until fixed)
- ESLint was never configured; `npm run lint` hung on an interactive prompt

---

## Phase 5 — The AI was completely broken

Found only by calling the live APIs. **Every model in the project was decommissioned.**

| Where | Dead | Now |
|---|---|---|
| Groq text | `llama-3.3-70b-versatile` → 404 | `openai/gpt-oss-120b` |
| Groq alt | `mixtral-8x7b-32768` → 404 | `openai/gpt-oss-20b` |
| Gemini text | `gemini-2.0-flash` → 404 | `gemini-flash-latest` |
| Gemini text alt | `gemini-1.5-flash` → 404 | `gemini-flash-lite-latest` |
| Gemini image | `gemini-2.0-flash-exp` → 404 | `gemini-3.1-flash-image` / `gemini-2.5-flash-image` |

Switched `DEFAULT_MODEL_ID` to Gemini — it was supposed to be the primary all along.
Prefer `*-latest` aliases so the next retirement doesn't break the app.

### Two hidden bugs behind that

1. **`gpt-oss` are reasoning models.** At default effort they spend the whole token
   budget thinking and return empty `content`. Added `reasoning_effort: 'low'` plus
   a fallback to the `reasoning` field.
2. **Gemini free tier returns `503 high demand` often.** One blip killed caption
   generation. `callAI()` now retries transient 429/5xx with backoff, then fails
   over to another provider. The blog route was fetching Gemini directly with no
   retry — routed through `callAI()`.

### Gemini image generation is paid
Nano Banana returns `429 RESOURCE_EXHAUSTED` on a free key. Code tries Gemini,
then falls through to Pollinations — which is what actually serves images today.

---

## Phase 6 — Next 16 + React 19

Taken to close the remaining 5 advisories. Result: **0 vulnerabilities.**

| Blocker | Resolution |
|---|---|
| `eslint-config-next@16` needs ESLint ≥9 | ESLint 8 → 9.39.5 |
| `lucide-react@0.379` pinned to React 18 | → 0.577.0 |
| **`lucide-react@1.x` removed brand icons** (Instagram, Youtube, Twitter, Facebook, Chrome) | Stayed on 0.577.0 — newest with both brand icons and React 19 |
| Next 16 removed `next lint` | `eslint.config.mjs` flat config; `"lint": "eslint ."` |

ESLint 9's stricter rules then caught 4 genuine issues:
1. `react-hooks/set-state-in-effect` — synchronous `setState` in the blog effect.
   Restructured + added a cancel guard so a stale slug's response can't overwrite.
2. `window.location.href` in `/login` → `router.push()` + `refresh()`
3. Same in `MarketingNav` sign-out
4. Anonymous default export in the eslint config

---

## Phase 7 — Deployment prep

- Replaced `Buffer` with a portable `toBase64()` so routes run on any runtime
  (Cloudflare Workers / edge) without a `nodejs_compat` shim
- `.vercelignore`, `.gitignore` hardened
- Vercel deploy attempted and **abandoned**: it requires account credentials, and
  even `vercel deploy --temporary` refuses without them. The Vercel CLI was
  installed, tested, then removed — it added 248 packages and new advisories.

---

## Lessons that keep proving true

1. **A green build says nothing about whether the app works.** Every model was
   dead while `tsc`, ESLint and `next build` were all clean.
2. **`tsc` is not `next build`.** Next rejected a page re-export that `tsc` allowed.
3. **Verify model names against the live API.** They rot constantly.
4. **Fail closed, not open.** The first guard silently allowed everything when
   config was missing — worse than no guard, because it looked like protection.
5. **Check whether a dependency is even used before keeping its attack surface.**
   `remotePatterns` was carrying a critical CVE for a feature never used.
