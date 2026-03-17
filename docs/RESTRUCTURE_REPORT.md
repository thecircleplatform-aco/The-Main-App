# Project Restructure Report — Scalable AI Platform Architecture

**Date:** March 2026  
**Scope:** Circle app (`circle/` directory)  
**Goal:** Professional, scalable architecture with clear separation of core, features, services, agents, and admin control.

---

## 1. Summary

The project has been restructured into a modular architecture suitable for a large AI platform. A **core system layer** holds configuration, database, auth, and utilities. **Services** are organized with AI integrations under `services/ai`. **Features** are grouped by domain (chat, council, admin, support, settings, onboarding, profile). **UI** design system (animations, styles) is centralized under `ui/`. **Admin** capabilities and permissions are defined in `core/auth`. Backward compatibility is preserved via re-exports from previous paths. **Build:** `npm run build` completes successfully.

---

## 2. Previous Folder Structure (Relevant Parts)

```
circle/
├── app/                 # Next.js App Router + API
├── admin/               # SQL schemas, personas.ts
├── agents/              # agents.ts
├── android/              # Capacitor Android (root)
├── ios/                 # Capacitor iOS (root)
├── components/          # All UI (admin, chat, council, settings, …)
├── config/              # env, changelog, version, countries, configError
├── contexts/
├── database/            # db.ts, schema/
├── features/            # ai-council only
├── hooks/
├── lib/                 # utils, auth, db re-exports, animations, etc.
├── mobile/              # README only
├── services/            # auth, admin, deepseek, gemini, council, …
├── styles/              # glass.css
├── types/
├── scripts/, public/, docs/
├── Dockerfile, fly.toml, package.json, README.md, .env.example, …
└── (many root files: capacitor.config.ts, middleware.ts, …)
```

---

## 3. New Architecture

### 3.1 Root Structure (Target)

Root contains only:

- **Directories:** `app`, `core`, `features`, `services`, `agents`, `ui`, `hooks`, `mobile`, `admin`, `plugins`, `scripts`, `docs`, `public`
- **Files:** `Dockerfile`, `fly.toml`, `package.json`, `README.md`, `.env.example`

Additional config files required for the stack (e.g. `next.config.mjs`, `tsconfig.json`, `tailwind.config.ts`, `middleware.ts`, `capacitor.config.ts`) remain at root.

### 3.2 Core System Layer (`/core`)

| Path | Purpose |
|------|---------|
| **core/env** | Environment configuration (API keys, DB URL, session secret). Single source of truth; `config/env.ts` re-exports for backward compatibility. |
| **core/config** | Changelog, version, countries, configError (non-env config). |
| **core/database** | DB client (`db.ts`), connection pool, `query`/`withClient`. Schemas live in **core/database/schema** (canonical). |
| **core/auth** | **user.ts** – session payload types and user auth contract. **permissions.ts** – platform roles (USER, MODERATOR, ADMIN), admin roles (owner, admin, viewer), and permission helpers (`canManageAdmins`, `canEditContent`, `canViewContent`). |
| **core/utils** | `cn()` and other shared utilities; **request-utils.ts** – `getClientIp` for API routes. |

All new code should import from `@/core/*`. Legacy paths (`@/config/env`, `@/database/db`, etc.) still work via re-exports.

### 3.3 User-Based Architecture

- User-scoped data uses **userId** (or equivalent) and foreign keys in the schema (e.g. `council_pages.user_id`, `message_feedback.user_id`, `support_tickets.user_id`).
- **core/auth/user.ts** defines session and user types; **services/auth** implements login, register, session create/destroy, password hash/verify.
- Protected routes check authentication and, where needed, **core/auth/permissions** (admin/moderation).

### 3.4 Authorization

- **core/auth/permissions.ts** defines:
  - `PlatformRole`: USER, MODERATOR, ADMIN
  - `AdminRole`: owner, admin, viewer
  - `canManageAdmins`, `canEditContent`, `canViewContent`, `isValidAdminRole`
- **services/admin** uses these and provides `getAdminSession`, `requireAdmin` for API routes. Admin APIs live under **app/api/admin**; admin UI under **components/admin** and **features/admin**.

### 3.5 Admin System

- **Admin** can manage: users, AI agents, council cases, reports, support tickets, blocked users, shadow bans, IP history, system settings.
- **Admin APIs:** `app/api/admin/*` (admins, agents, support, user block/delete/shadow-ban/ip-history/activity/update).
- **Admin UI:** `components/admin/*` and **features/admin/components** (barrel re-exports).

### 3.6 Feature-Based Architecture

| Feature | Location | Contents |
|--------|----------|----------|
| **chat** | features/chat | components (barrel from components/chat) |
| **council** | features/council, features/ai-council | types, council-report-page |
| **admin** | features/admin | components (barrel from components/admin) |
| **support** | features/support | components (SupportChat, etc.) |
| **settings** | features/settings | components (SettingsView, DeleteAccountModal) |
| **onboarding** | features/onboarding | components (PersonaSetupForm, InterestSelector) |
| **profile** | features/profile | Placeholder (README) for future profile feature |

Each feature can be extended with `components`, `services`, `hooks`, `types` as needed.

### 3.7 AI Agent System

- **agents/** – Agent definitions (e.g. Lumana, Sam, Alex, Maya, Nova): prompt templates, reasoning, response formatter.
- **services/ai** – External AI integrations:
  - **services/ai/deepseek.ts** – DeepSeek chat and streaming (uses `@/core/env`).
  - **services/ai/gemini.ts** – Gemini vision/image (uses `@/core/env`).
  - **services/deepseek.ts** and **services/gemini.ts** re-export from **services/ai** for backward compatibility.

### 3.8 Service Layer

- **services/auth** – Login, register, session, password hashing; uses **core/env** and **core/auth** types.
- **services/admin** – Admin session, requireAdmin, permission checks; uses **core/auth/permissions**.
- **services/ai** – DeepSeek and Gemini (see above).
- **services/council**, **services/councilPage**, **services/agentRouter**, **services/aiEngine** – Unchanged in location; they keep using `@/database/db`, `@/config/env` (or `@/core/env`), and `@/services/deepseek` (re-export from services/ai).

### 3.9 UI Design System

| Path | Purpose |
|------|---------|
| **ui/animations** | Framer Motion variants and transitions (softSpring, fadeInUp, panelFade, etc.). **lib/animations.ts** re-exports for backward compatibility. |
| **ui/styles** | **glass.css** – glass and glass-strong utilities. **app/globals.css** imports from `../ui/styles/glass.css`. |
| **ui/components** | Intended for reusable design-system components; current app components remain under **components/** with **components/ui** for buttons, inputs, etc. |

### 3.10 Mobile

- **mobile/** – Contains README. Capacitor expects **android** and **ios** at project root by default.
- **Optional:** When no process is locking the folders, move **android** → **mobile/android** and **ios** → **mobile/ios**, then in **capacitor.config.ts** set `android: { path: "mobile/android", ... }` and `ios: { path: "mobile/ios" }`. A comment in `capacitor.config.ts` documents this.

### 3.11 Plugins

- **plugins/** – Prepared for future plugin modules. **plugins/README.md** describes that plugins should be isolated and not modify core code.

---

## 4. Files Moved / Created / Re-export Map

### 4.1 Core (new)

| New file | Purpose |
|----------|---------|
| core/env/index.ts | Env validation and getters (from config/env.ts logic) |
| core/config/changelog.ts | From config/changelog.ts |
| core/config/version.ts | From config/version.ts |
| core/config/configError.ts | From config/configError.ts |
| core/config/countries.ts | From config/countries.ts |
| core/database/db.ts | From database/db.ts; imports getDatabaseUrl from core/env |
| core/database/schema/*.sql | Copies of database/schema/*.sql (canonical schemas) |
| core/utils/index.ts | cn() from lib/utils.ts |
| core/utils/request-utils.ts | From lib/request-utils.ts |
| core/auth/user.ts | Session/user types |
| core/auth/permissions.ts | Platform and admin roles, permission helpers |

### 4.2 Re-exports (backward compatibility)

| Legacy path | Now re-exports from |
|-------------|---------------------|
| config/env.ts | core/env |
| config/changelog.ts | core/config/changelog |
| config/version.ts | core/config/version |
| config/configError.ts | core/config/configError |
| config/countries.ts | core/config/countries |
| database/db.ts | core/database/db |
| lib/animations.ts | ui/animations |
| lib/utils.ts | core/utils |
| lib/request-utils.ts | core/utils/request-utils |
| services/deepseek.ts | services/ai/deepseek |
| services/gemini.ts | services/ai/gemini |

### 4.3 UI

| New/updated | Purpose |
|-------------|---------|
| ui/animations/index.ts | Framer Motion variants (from lib/animations.ts) |
| ui/styles/glass.css | Glass utilities (from styles/glass.css) |
| app/globals.css | Imports `../ui/styles/glass.css` |

### 4.4 Features

- **features/chat/components/index.ts** – Re-exports chat components from components/chat.
- **features/council/types/index.ts** – Re-exports from types/council.
- **features/admin/components/index.ts** – Re-exports admin components (and modals) from components/admin.
- **features/support/components/index.ts** – Re-exports SupportChat.
- **features/settings/components/index.ts** – Re-exports SettingsView, DeleteAccountModal.
- **features/onboarding/components/index.ts** – Re-exports PersonaSetupForm, InterestSelector.
- **features/profile/README.md** – Placeholder for profile feature.

### 4.5 Duplicate / Redundant Files

- **No working code was deleted.** Old SQL in **admin/** and **database/schema/** remains; **core/database/schema** is the canonical copy for the new architecture. Migrations (**scripts/migrate-*.mjs**) still read from **database/schema/** so they keep working.
- **styles/glass.css** remains; **ui/styles/glass.css** is the one imported by globals.css.

---

## 5. Final System Architecture (Diagram)

```
circle/
├── app/                    # Next.js App Router, pages, API (incl. app/api/admin)
├── core/                   # System infrastructure
│   ├── env/                # Environment config
│   ├── config/             # Changelog, version, countries, configError
│   ├── database/           # DB client + schema (canonical)
│   ├── auth/               # user.ts, permissions.ts
│   └── utils/              # cn, request-utils
├── features/               # Modular features
│   ├── chat/
│   ├── council/            # + ai-council (council-report-page)
│   ├── admin/
│   ├── support/
│   ├── settings/
│   ├── onboarding/
│   └── profile/
├── services/               # External integrations and business logic
│   ├── ai/                 # deepseek, gemini
│   ├── auth.ts
│   ├── admin.ts
│   ├── council.ts, councilPage.ts, agentRouter.ts, aiEngine.ts
│   └── (deepseek.ts, gemini.ts → re-export services/ai)
├── agents/                 # AI agent definitions (lumana, crew, …)
├── ui/                     # Design system
│   ├── animations/
│   ├── styles/
│   └── components/         # (optional future)
├── hooks/
├── mobile/                 # README; android/ios at root or mobile/android, mobile/ios
├── admin/                  # personas.ts, legacy SQL (optional cleanup)
├── plugins/                # Future plugin modules
├── scripts/
├── docs/
├── public/
├── components/             # Existing UI (unchanged locations)
├── contexts/
├── config/                 # Re-exports → core
├── database/               # Re-exports → core/database
├── lib/                    # Utils, re-exports, other helpers
├── types/
├── styles/                 # Legacy glass.css (ui/styles is canonical)
├── Dockerfile, fly.toml, package.json, README.md, .env.example
└── (next.config.mjs, tsconfig.json, tailwind.config.ts, middleware.ts, capacitor.config.ts, …)
```

---

## 6. Build Verification

- **Command run:** `npm run build`
- **Result:** Compiled successfully; type check passed; static pages generated; no broken modules or missing dependencies reported.

---

## 7. Suggested Next Steps

1. **Mobile:** When possible, move **android** and **ios** into **mobile/android** and **mobile/ios** and set `android.path` / `ios.path` in **capacitor.config.ts** (see comment in file).
2. **Imports:** Gradually replace deprecated imports (`@/config/env`, `@/database/db`, `@/lib/animations`, etc.) with `@/core/*` and `@/ui/animations` where appropriate.
3. **Schema:** Point migration or deployment scripts at **core/database/schema** if you want a single canonical schema location; otherwise keep using **database/schema**.
4. **Cleanup:** Optionally remove **admin/** SQL duplicates and **styles/glass.css** once you are sure nothing else references them.
5. **Plugins:** Add first plugin under **plugins/** following **plugins/README.md**.

---

## 8. Important Rules Followed

- **No working code deleted.** Only added new structure and re-exports.
- **Imports not broken.** Legacy paths re-export from new locations.
- **Full functionality maintained.** Build and type check pass.
- **Admin control:** Admin APIs and permissions centralized; all managed data is accessible via **app/api/admin** and **core/auth/permissions**.

This restructure yields a clean, modular base for a scalable AI platform with clear separation of core, features, services, agents, and UI, and with admin and user-based data and permissions in place.
