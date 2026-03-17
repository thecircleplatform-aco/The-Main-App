# Project Restructuring Report

**Date:** March 2026  
**Scope:** Circle app (`circle/` directory)

---

## Summary

The repository has been reorganized into a cleaner, modular structure. Configuration, database, and service layers were extracted and all import paths were updated. The build completes successfully.

---

## 1. New Root-Level Structure

Created and populated:

| Folder      | Purpose |
|------------|---------|
| **/config**   | Environment, config error handling, constants (countries, version, changelog) |
| **/database** | DB client (`db.ts`) and schema SQL files |
| **/docs**     | Deployment and mobile documentation |
| **/mobile**   | README only; native projects remain at root (see below) |

Existing folders retained:

- **/app** – Next.js App Router (pages, API routes, layout)
- **/features** – Feature modules (e.g. `ai-council`)
- **/components** – UI components (unchanged)
- **/services** – AI, auth, admin, council, etc.
- **/agents** – Agent definitions (e.g. `agents.ts`)
- **/scripts** – Build and migration scripts
- **/public** – Static assets
- **/lib** – Utils, re-exports for deprecated paths (see below)
- **/android**, **/ios** – Capacitor native projects (kept at root)

---

## 2. Files Moved and Import Updates

### Config (`/config`)

| Old location   | New location     |
|---------------|------------------|
| `lib/env.ts`  | `config/env.ts`  |
| `lib/configError.ts` | `config/configError.ts` |
| `lib/countries.ts`   | `config/countries.ts`   |
| `lib/version.ts`    | `config/version.ts`     |
| `lib/changelog.ts`  | `config/changelog.ts`  |

**Imports updated:** All references to `@/lib/env`, `@/lib/configError`, `@/lib/countries`, `@/lib/version`, `@/lib/changelog` now use `@/config/*`.

### Database (`/database`)

| Old location | New location |
|-------------|--------------|
| `lib/db.ts` | `database/db.ts` |
| `admin/schema.sql` | `database/schema/schema.sql` |
| `admin/council-pages-schema.sql` | `database/schema/council-pages-schema.sql` |
| `admin/user-management-schema.sql` | `database/schema/user-management-schema.sql` |
| `admin/message_feedback.sql` | `database/schema/message_feedback.sql` |

**Imports updated:** All references to `@/lib/db` now use `@/database/db`.  
**Scripts updated:** `scripts/migrate-council-pages.mjs` and `scripts/migrate-user-management.mjs` now read from `database/schema/`.

### Services

| Old location   | New location     |
|---------------|------------------|
| `lib/auth.ts` | `services/auth.ts` |
| `lib/admin.ts`| `services/admin.ts` |

**Imports updated:** All references to `@/lib/auth` and `@/lib/admin` now use `@/services/auth` and `@/services/admin`.

### Documentation (`/docs`)

| Old location   | New location |
|---------------|--------------|
| `DEPLOY.md`   | `docs/DEPLOY-FLY.md` |
| `DEPLOYMENT.md` | `docs/DEPLOYMENT-VERCEL.md` |
| `CAPACITOR.md`  | `docs/CAPACITOR.md` |

Root copies of `DEPLOY.md`, `DEPLOYMENT.md`, and `CAPACITOR.md` were **not** removed so existing links and habits still work. New and updated content lives in `docs/` with corrected references (e.g. `database/db.ts`, `config/env.ts`).

---

## 3. Backward Compatibility (Deprecated Paths)

To avoid breaking any remaining or external references, the following files in **/lib** were replaced with re-exports and marked deprecated:

- `lib/db.ts` → re-exports `@/database/db`
- `lib/env.ts` → re-exports `@/config/env`
- `lib/auth.ts` → re-exports `@/services/auth`
- `lib/admin.ts` → re-exports `@/services/admin`
- `lib/configError.ts` → re-exports `@/config/configError`
- `lib/countries.ts` → re-exports `@/config/countries`
- `lib/version.ts` → re-exports `@/config/version`
- `lib/changelog.ts` → re-exports `@/config/changelog`

All app and API code now imports from the new paths; the lib re-exports can be removed once you are sure nothing else depends on them.

---

## 4. Mobile (Android / iOS)

- **Capacitor** expects **android** and **ios** at the project root; moving them into `/mobile` would break `cap sync` and `cap open`.
- **/mobile** was added with a **README** that explains this and points to `../android` and `../ios` and to `docs/CAPACITOR.md` for setup and scripts.
- No physical move of native projects was done; they remain at **/android** and **/ios**.

---

## 5. What Was Not Changed (By Design)

- **/app** – Next.js App Router structure unchanged.
- **/components** – No move to `/ui` or `/features` in this pass to avoid a large number of import updates and to keep the build low-risk.
- **/features** – Existing `features/ai-council` left as is; no further feature splitting in this pass.
- **/agents** – Already contained agent logic; no structural change.
- **/admin** – Folder kept for `admin/personas.ts` and any other admin-only scripts; SQL files were copied to `database/schema/` and migrations updated to use them. You can remove or repurpose `admin/` later if desired.

---

## 6. Build and Scripts

- **Build:** `npm run build` completes successfully.
- **Migrations:** `migrate-council-pages.mjs` and `migrate-user-management.mjs` use `database/schema/` for SQL files.

---

## 7. Suggested Next Steps (Optional)

1. Remove deprecated re-exports in **/lib** once you confirm no other code or tooling uses the old paths.
2. Optionally delete the original **admin/** SQL files if you no longer need them (schema is now in **database/schema/**).
3. If desired, gradually move reusable components to **/ui** and feature-specific code to **/features** and update imports in a separate change set.
4. Add a root **README** section or link that describes the new layout (e.g. config, database, services, docs, mobile).

---

## 8. Root Directory Snapshot (After Restructure)

```
circle/
├── app/              # Next.js App Router
├── components/       # UI components
├── config/          # env, configError, countries, version, changelog
├── database/        # db.ts, schema/
├── docs/            # DEPLOY-FLY, DEPLOYMENT-VERCEL, CAPACITOR, this report
├── features/       # e.g. ai-council
├── lib/             # utils, re-exports (deprecated paths), other helpers
├── services/        # auth, admin, ai (deepseek, gemini), council, etc.
├── agents/          # agent definitions
├── scripts/         # inject-git, seed, migrate, fly scripts
├── public/
├── mobile/          # README only; android/ and ios/ at root
├── admin/           # personas.ts; SQL moved to database/schema
├── android/         # Capacitor Android
├── ios/             # Capacitor iOS
├── package.json
├── Dockerfile
├── fly.toml
├── .env.example
├── README.md
└── ... (config files: next.config.mjs, tsconfig.json, etc.)
```

This keeps the root minimal while making config, database, and services clearly separated and easier to extend.
