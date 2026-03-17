# Circle – Vercel production deployment checklist

Use this checklist when deploying Circle to Vercel.

## 1. Environment variables

- **Vercel project** → **Settings** → **Environment Variables**
- Add for **Production**: `DEEPSEEK_API_KEY`, `DATABASE_URL` (Neon pooled).
- Do **not** commit `.env.local`.

## 2. Database (Neon)

- Run migrations/seed: `npm run db:seed` with `DATABASE_URL` in `.env.local`.
- See `database/db.ts` for pool config; SSL and `max: 2` per function.

## 3. Build and deploy

- Framework: Next.js. Build: `npm run build`. Deploy on push.

## 4. Quick reference

| Item      | Location        |
|-----------|-----------------|
| Env schema| `config/env.ts` |
| DB pool   | `database/db.ts`|
| Env example| `.env.example`  |
