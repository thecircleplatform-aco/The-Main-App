# Circle – Vercel production deployment checklist

Use this checklist when deploying Circle to Vercel.

---

## 1. Environment variables

- [ ] **Vercel project** → **Settings** → **Environment Variables**
- [ ] Add for **Production** (and optionally Preview / Development):

| Variable | Required | Notes |
|----------|----------|--------|
| `DEEPSEEK_API_KEY` | Yes | From [DeepSeek platform](https://platform.deepseek.com). Keep secret. |
| `DATABASE_URL` | Yes | Neon **pooled** connection string (`-pooler` host). Use **Production** env in Vercel. |

- [ ] Use Neon’s **pooled** connection string (not direct) for serverless.
- [ ] Do **not** commit `.env.local`; it is in `.gitignore`.

---

## 2. Database (Neon)

- [ ] Create a Neon project and database if needed.
- [ ] Run migrations / seed: locally with `DATABASE_URL` in `.env.local` run:
  ```bash
  npm run db:seed
  ```
- [ ] Optional: run the same seed against the production DB URL once (e.g. from a one-off script or CI secret).
- [ ] In production, SSL is used with `rejectUnauthorized: true` (see `lib/db.ts`).
- [ ] Connection pool is limited to `max: 2` per serverless function to avoid exhausting Neon connections.

---

## 3. Build and deploy

- [ ] Repository connected to Vercel (GitHub/GitLab/Bitbucket).
- [ ] **Framework Preset**: Next.js (auto-detected).
- [ ] **Build Command**: `npm run build` (default).
- [ ] **Output Directory**: (default).
- [ ] **Install Command**: `npm install` (default).
- [ ] **Node.js Version**: 18.x or 20.x in Vercel project settings (recommended).
- [ ] Deploy: push to main (or trigger deploy). First build may take a few minutes.

---

## 4. API routes and server actions

- [ ] **Server Actions** are enabled in `next.config.mjs` with `bodySizeLimit: "2mb"`.
- [ ] Long-running AI routes use `maxDuration = 60` (Vercel Pro; Hobby has a 10s limit—consider Pro for AI).
- [ ] `pg` is in `serverExternalPackages` so it is not bundled for the client.
- [ ] All API routes validate input (e.g. Zod) and return JSON errors; no stack traces in production.

---

## 5. Security

- [ ] **Security headers** are set in `next.config.mjs`: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`.
- [ ] **API routes** send `Cache-Control: no-store` where appropriate.
- [ ] **Admin and settings** routes use a demo user; for production, add authentication (e.g. NextAuth, Clerk) and replace `getDemoUserId()` with the current user’s id.
- [ ] **Secrets**: only server-side code uses `DEEPSEEK_API_KEY` and `DATABASE_URL`; they are never exposed to the client.

---

## 6. Bundle and performance

- [ ] **Build** completes without errors: `npm run build`.
- [ ] **Lint** passes: `npm run lint`.
- [ ] Heavy server-only deps (`pg`, DeepSeek usage) are only in API routes / server code.
- [ ] Optional: enable Vercel Analytics or Speed Insights for monitoring.

---

## 7. Post-deploy checks

- [ ] Homepage loads: `https://your-project.vercel.app`
- [ ] Chat / council: send a message and confirm AI response (checks `DEEPSEEK_API_KEY` and AI route).
- [ ] Settings: load `/settings` (checks `DATABASE_URL` and settings API).
- [ ] Admin: load `/admin` and optionally `/admin/agents` (checks DB and admin APIs).
- [ ] Legal pages: `/privacy`, `/terms`, `/ai-policy` load correctly.
- [ ] Check Vercel **Functions** and **Logs** for any runtime errors.

---

## 8. Optional

- [ ] **Custom domain**: add in Vercel → Settings → Domains.
- [ ] **Cron** (e.g. cleanup jobs): configure in `vercel.json` if needed.
- [ ] **Preview env**: set same env vars for Preview if you want branch deploys to hit DB/API.

---

## Quick reference

| Item | Location |
|------|----------|
| Env schema | `lib/env.ts` |
| DB pool | `lib/db.ts` |
| Next config | `next.config.mjs` |
| Env example | `.env.example` |
| API route limits | `app/api/ai-discussion/route.ts`, `app/api/council/route.ts` (`maxDuration`) |
