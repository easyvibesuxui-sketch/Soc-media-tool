# Deployment — Cloudflare Workers

This app runs on Cloudflare Workers via **`@opennextjs/cloudflare`** (OpenNext).
That adapter is required: plain `next build` output doesn't run on Workers, and
Cloudflare Pages' older `next-on-pages` would force every route to the edge runtime.

The Cloudflare build is verified working on this codebase:
`Next.js 16.3.6` + `@opennextjs/cloudflare 1.20.7` → `.open-next/worker.js` ✓

---

## Files that make this work

| File | Purpose |
|---|---|
| `wrangler.jsonc` | Worker name, entry point, assets, compat flags. **No secrets.** |
| `open-next.config.ts` | OpenNext adapter config |
| `package.json` → `cf:build` / `cf:preview` / `cf:deploy` | Build & deploy scripts |

`compatibility_flags: ["nodejs_compat", ...]` is required by the OpenNext runtime —
don't remove it.

---

## Option A — Connect GitHub (auto-deploy on push) ← recommended

1. **Push the code** (see "First push" below). Cloudflare needs a non-empty repo.
2. Cloudflare dashboard → **Workers & Pages** → **Create** → **Workers** →
   **Import a repository**.
3. Authorise GitHub, pick `easyvibesuxui-sketch/Soc-media-tool`.
4. Build settings:
   | Field | Value |
   |---|---|
   | Build command | `npm run cf:build` |
   | Deploy command | `npx wrangler deploy` |
   | Output directory | *(leave empty — `wrangler.jsonc` defines it)* |
   | Root directory | `/` |
5. Add the environment variables (next section), then deploy.

Every push to `main` rebuilds automatically.

## Option B — Deploy from your machine

```bash
npx wrangler login     # opens a browser once
npm run cf:deploy
```

Preview the Workers runtime locally before shipping:
```bash
npm run cf:preview
```
This is closer to production than `npm run dev` — it runs the actual Worker.

---

## Environment variables

Set these in **Workers & Pages → your worker → Settings → Variables and Secrets**.
Mark everything except `NEXT_PUBLIC_SITE_URL` as **Secret** (encrypted).

| Variable | Required | Notes |
|---|---|---|
| `GEMINI_API_KEY` | **yes** | Primary AI. Blog + captions need it. |
| `GROQ_API_KEY` | recommended | Text failover |
| `HF_TOKEN` | optional | Further failover |
| `NEXT_PUBLIC_SUPABASE_URL` | already set | Committed in `.env.production` (build-time, public) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | already set | Publishable key, committed in `.env.production` |
| `SUPABASE_SERVICE_ROLE_KEY` | no | Only for the LemonSqueezy webhook. Server-only. Never expose. |
| `NEXT_PUBLIC_SITE_URL` | **yes** | Real domain, e.g. `https://postcraft.ai`. Plain var, not secret. |
| `LEMONSQUEEZY_*` | no | Unused so far |

## Supabase Auth settings (one-time, in the Supabase dashboard)

Project `postcraft-ai` → **Authentication → URL Configuration**:
- **Site URL**: the deployed URL (e.g. `https://postcraft-ai.<sub>.workers.dev`)
- **Redirect URLs**: `https://<that-host>/auth/callback` and `http://localhost:3000/auth/callback`

Without these, Google sign-in and email confirmation links bounce to `localhost:3000`.

**Google sign-in** → Authentication → Providers → Google: needs a Client ID +
Secret from Google Cloud Console (OAuth client, type *Web*), with the authorised
redirect URI `https://xiynijihohlxqvkfzblr.supabase.co/auth/v1/callback`.
Email/password works without this.

> ### The Supabase vars are not optional in production
> `lib/api-guard.ts` **fails closed**: if they're missing and `NODE_ENV=production`,
> every AI route returns **503**. That is deliberate — missing config must not
> leave the API keys open to the internet.
>
> **If the deployed site returns 503 on generation, the two `NEXT_PUBLIC_SUPABASE_*` vars are missing from the build.**

CLI alternative:
```bash
npx wrangler secret put GEMINI_API_KEY
# ...etc
```

---

## First push

The repo is `https://github.com/easyvibesuxui-sketch/Soc-media-tool`.
Git is already initialised with the remote set and an initial commit staged.

```bash
cd social-media-tool
git push -u origin main
```

If the push asks for a password, use a **Personal Access Token** (GitHub no longer
accepts account passwords): GitHub → Settings → Developer settings →
Personal access tokens → Fine-grained → `Contents: Read and write`.

Or with the GitHub CLI: `gh auth login` once, then push.

---

## After deploying — verify

```bash
SITE=https://your-worker.workers.dev

# pages
for p in / /login /blog /about /privacy /terms /tool /robots.txt /sitemap.xml; do
  echo "$p $(curl -s -o /dev/null -w '%{http_code}' $SITE$p)"
done

# blog should return real content (proves GEMINI_API_KEY works)
curl -s "$SITE/api/generate-blog?slug=hashtag-strategy-2025" | head -c 200

# unauthenticated AI route should be 401 (Supabase set) or 503 (Supabase missing)
curl -s -X POST $SITE/api/generate-caption -H 'Content-Type: application/json' \
  -d '{"topic":"t","platform":"instagram_post","tone":"casual","language":"en"}'
```

Logs: `npx wrangler tail`

---

## Custom domain

Worker → Settings → Domains & Routes → Add custom domain.
Then update `NEXT_PUBLIC_SITE_URL` to match and redeploy, or `sitemap.xml`,
`robots.txt` and the canonical tags will keep pointing at the old host.

---

## Gotchas

- **Node APIs.** `Buffer` was removed in favour of a portable `toBase64()`. Keep new
  code runtime-agnostic; `nodejs_compat` covers a lot but not everything.
- **In-process caches don't persist.** `/api/generate-blog` caches per isolate, so
  a cold start regenerates the article. For a shared cache, add Workers KV via
  `open-next.config.ts`.
- **Build output is gitignored.** `.open-next/` and `.wrangler/` must never be committed.
- **Not Vercel.** Vercel was evaluated and dropped — it needs account credentials
  even for `--temporary` deploys. `.vercelignore` is harmless if it stays.
