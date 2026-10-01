# PostCraft AI

AI social-media content generator. Pick a platform, describe your post, get
images, a caption and hashtags in seconds.

Next.js 16 · React 19 · TypeScript · Tailwind · Supabase · Gemini

---

## Quick start

```bash
npm install
cp .env.example .env.local   # then fill in the keys
npm run dev                  # http://localhost:3000
```

### Minimum to run locally
`GEMINI_API_KEY` — free from [aistudio.google.com](https://aistudio.google.com).

Without Supabase keys the auth guard stays open in dev, so the tool works; login
does not. In production, missing Supabase keys make every AI route return 503 by
design — see `CLAUDE.md`.

---

## Features

- **9 platforms** — Instagram (post/story/reels), TikTok, YouTube Shorts, X, LinkedIn, Facebook (post/story) with correct dimensions, caption limits and hashtag counts
- **4 AI image variants** per topic, or upload your own
- **AI caption + hashtags** in 6 languages (EN, KA, ES, FR, DE, RU)
- **Fix-my-text** mode — rewrites rough copy
- **Video** from a generated image
- **Blog** — posts written on demand by AI, cached
- Google / email auth, 5 free generations per day

---

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build — run this before shipping |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |

---

## Deployment

See **[DEPLOY.md](./DEPLOY.md)** for Cloudflare and other hosts.

Set every variable from `.env.example` in the host's dashboard. `NEXT_PUBLIC_SITE_URL`
must be the real domain — `sitemap.xml`, `robots.txt` and canonical tags use it.

---

## Docs

| File | What's in it |
|---|---|
| `CLAUDE.md` | Architecture, non-obvious rules, verification checklist. **Read first.** |
| `DECISIONS.md` | Why things are the way they are. Read before reverting anything. |
| `DEPLOY.md` | Hosting setup |
| `.env.example` | Every variable, annotated |

---

## Status

Working: all 9 platforms, image generation, captions, hashtags, blog, SEO, build clean, 0 vulnerabilities.

Not finished: Supabase keys unset (login inactive), contact form sends nothing,
no analytics or AdSense tag, Pro tier has no checkout. Full list at the end of `CLAUDE.md`.
