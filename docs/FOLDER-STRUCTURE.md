# Full file & folder structure (circle/)

Excludes: `node_modules/`, `.next/`, `.vercel/`, `out/`

**New architecture (March 2026):** See [RESTRUCTURE_REPORT.md](./RESTRUCTURE_REPORT.md) for the scalable layout. Canonical code lives in **core/** (env, config, database, auth, utils), **services/ai/** (DeepSeek, Gemini), **ui/** (animations, styles), and **features/** (chat, council, admin, support, settings, onboarding, profile). Legacy paths (`config/`, `database/`, `lib/`, etc.) re-export from these.

```
circle/
├── .dockerignore
├── .env.example
├── .env.local
├── .eslintrc.json
├── .gitignore
├── .github/
│   └── workflows/
│       └── fly-deploy.yml
├── admin/
│   ├── council-pages-schema.sql
│   ├── message_feedback.sql
│   ├── personas.ts
│   ├── schema.sql
│   └── user-management-schema.sql
├── agents/
│   └── agents.ts
├── android/
│   ├── app/
│   │   ├── build.gradle
│   │   ├── src/main/AndroidManifest.xml, assets/, java/, res/
│   │   └── ...
│   ├── build.gradle
│   ├── capacitor.settings.gradle
│   ├── gradle.properties
│   ├── gradlew, gradlew.bat
│   ├── settings.gradle
│   ├── variables.gradle
│   └── capacitor-cordova-android-plugins/
├── app/
│   ├── error.tsx
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   ├── loading.tsx
│   ├── page.tsx
│   ├── admin/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── admins/page.tsx
│   │   ├── agents/page.tsx
│   │   ├── discussions/page.tsx
│   │   ├── support/page.tsx
│   │   └── users/page.tsx
│   ├── ai-policy/page.tsx
│   ├── api/
│   │   ├── account/delete/route.ts
│   │   ├── account/recover/route.ts
│   │   ├── admin/admins/route.ts
│   │   ├── admin/admins/[id]/route.ts
│   │   ├── admin/agents/route.ts
│   │   ├── admin/agents/[id]/route.ts
│   │   ├── admin/support/respond/route.ts
│   │   ├── admin/support/tickets/route.ts
│   │   ├── admin/user/activity/route.ts
│   │   ├── admin/user/block/route.ts
│   │   ├── admin/user/delete/route.ts
│   │   ├── admin/user/ip-history/route.ts
│   │   ├── admin/user/shadow-ban/route.ts
│   │   ├── admin/user/update/route.ts
│   │   ├── ai-discussion/route.ts
│   │   ├── ai-discussion/stream/route.ts
│   │   ├── auth/login/route.ts
│   │   ├── auth/logout/route.ts
│   │   ├── auth/register/route.ts
│   │   ├── council/route.ts
│   │   ├── council/cases/[caseId]/route.ts
│   │   ├── council/explain/route.ts
│   │   ├── council/lumana/route.ts
│   │   ├── council/pages/route.ts
│   │   ├── council/pages/[pageId]/route.ts
│   │   ├── council/persona/route.ts
│   │   ├── council/personas/route.ts
│   │   ├── council/process/[caseId]/route.ts
│   │   ├── council/round-decision/route.ts
│   │   ├── council/start/route.ts
│   │   ├── health/route.ts
│   │   ├── me/route.ts
│   │   ├── message-feedback/route.ts
│   │   ├── persona/create/route.ts
│   │   ├── persona/me/route.ts
│   │   ├── settings/route.ts
│   │   ├── settings/delete/route.ts
│   │   ├── settings/export/route.ts
│   │   ├── support/create-ticket/route.ts
│   │   ├── translate/route.ts
│   │   └── version/route.ts
│   ├── changelog/page.tsx
│   ├── council/page.tsx
│   ├── council/result/[pageId]/page.tsx
│   ├── council/results/page.tsx
│   ├── help/page.tsx
│   ├── login/page.tsx
│   ├── onboarding/page.tsx
│   ├── privacy/page.tsx
│   ├── register/page.tsx
│   ├── settings/page.tsx
│   └── terms/page.tsx
├── capacitor.config.ts
├── CAPACITOR.md
├── components/
│   ├── BlockedUserChecker.tsx
│   ├── CapacitorProvider.tsx
│   ├── DiscussionBoard.tsx
│   ├── glass-panel.tsx
│  ├── ThemeToggle.tsx
│   ├── VersionDisplay.tsx
│  ├── account/AccountRecoveryView.tsx
│  ├── admin/
│   │   ├── AdminAdminsManager.tsx
│   │   ├── AdminAgentManager.tsx
│   │   ├── AdminHeader.tsx
│   │   ├── AdminLayoutClient.tsx
│   │   ├── AdminSidebar.tsx
│   │   ├── AdminUserModals.tsx
│   │   ├── AdminUsersTable.tsx
│   │   ├── SupportTicketViewer.tsx
│   │   └── UserContextMenu.tsx
│   ├── ai-response/
│   │   ├── AiResponseBlock.tsx
│   │   ├── AiResponseContextMenu.tsx
│   │   └── TranslatedBlock.tsx
│   ├── background/
│   │   ├── gridBackground.css
│   │   ├── iconObjects.ts
│   │   ├── InteractiveBackground.tsx
│   │   └── physicsEngine.ts
│   ├── chat/
│   │   ├── AgentMessage.tsx
│   │   ├── ChatWindow.tsx
│   │   ├── MessageActions.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── MessageInput.tsx
│   │   ├── MessageMenu.tsx
│   │   ├── StreamingMessage.tsx
│   │   └── TypingIndicator.tsx
│   ├── council/council-chat.tsx
│   ├── helpcenter/SupportChat.tsx
│   ├── onboarding/
│   │   ├── InterestSelector.tsx
│   │   └── PersonaSetupForm.tsx
│   ├── settings/
│   │   ├── DeleteAccountModal.tsx
│   │   ├── DeleteConfirmStep.tsx
│   │   ├── DeleteReasonStep.tsx
│   │   └── SettingsView.tsx
│   ├── theme/
│   └── ui/
│       ├── button.tsx
│       ├── glass-button.tsx
│       ├── glass-input.tsx
│       ├── glass-select.tsx
│       ├── input.tsx
│       └── textarea.tsx
├── config/
│   ├── changelog.ts
│   ├── configError.ts
│   ├── countries.ts
│   ├── env.ts
│   └── version.ts
├── contexts/
│   ├── CouncilContext.tsx
│   └── ThemeContext.tsx
├── database/
│   ├── db.ts
│   └── schema/
│       ├── council-pages-schema.sql
│       ├── message_feedback.sql
│       ├── schema.sql
│       └── user-management-schema.sql
├── dbsetup.js
├── DEPLOY.md
├── DEPLOYMENT.md
├── docs/
│   ├── CAPACITOR.md
│   ├── DEPLOY-FLY.md
│   ├── DEPLOYMENT-VERCEL.md
│   ├── FOLDER-STRUCTURE.md
│   └── RESTRUCTURE-REPORT.md
├── Dockerfile
├── features/
│   └── ai-council/
│       └── council-report-page.tsx
├── fly.toml
├── hooks/
│   ├── useCouncil.ts
│   ├── useSession.ts
│   └── useSpeechRecognition.ts
├── ios/
│   ├── App/App/, App.xcodeproj/, CapApp-SPM/
│   ├── capacitor-cordova-ios-plugins/
│   ├── debug.xcconfig
│   └── ...
├── lib/
│   ├── admin.ts
│   ├── ai-formatting/typing-effect.ts
│   ├── ai-models.ts
│   ├── animations.ts
│   ├── api.ts
│   ├── auth.ts
│   ├── camera.ts
│   ├── capacitor.ts
│   ├── changelog.ts
│   ├── configError.ts
│   ├── countries.ts
│   ├── crew.ts
│   ├── db.ts
│   ├── env.ts
│   ├── fingerprint.ts
│   ├── notifications.ts
│   ├── request-utils.ts
│   ├── share.ts
│   ├── utils.ts
│   └── version.ts
├── middleware.ts
├── mobile/
│   └── README.md
├── next.config.mjs
├── next-env.d.ts
├── package.json
├── package-lock.json
├── postcss.config.mjs
├── public/
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── README.md
├── scripts/
│   ├── ensure-fly-path.ps1
│   ├── fly-secrets.ps1
│   ├── inject-git.mjs
│   ├── migrate-council-pages.mjs
│   ├── migrate-user-management.mjs
│   ├── push-env-to-fly.ps1
│   └── seed.mjs
├── services/
│   ├── admin.ts
│   ├── agentRouter.ts
│   ├── aiEngine.ts
│   ├── auth.ts
│   ├── council.ts
│   ├── councilPage.ts
│   ├── deepseek.ts
│   └── gemini.ts
├── styles/
│   └── glass.css
├── tailwind.config.ts
├── theme/
├── tsconfig.json
├── tsconfig.tsbuildinfo
├── types/
│   └── council.ts
└── vercel.json
```
