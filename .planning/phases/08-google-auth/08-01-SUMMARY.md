---
phase: 08-google-auth
plan: 01
subsystem: auth
tags: [convex-auth, google-oauth, jwt, nextjs, convex]

# Dependency graph
requires:
  - phase: 07-claiming-payment-ux
    provides: bills schema with organizerSecret; ConvexClientProvider with ConvexProvider

provides:
  - "@convex-dev/auth and @auth/core@0.37.0 installed and pinned"
  - "convex/auth.config.ts — JWT provider config using CONVEX_SITE_URL"
  - "convex/auth.ts — convexAuth Google provider with auth/signIn/signOut/store/isAuthenticated exports"
  - "convex/http.ts — OAuth callback HTTP router via auth.addHttpRoutes"
  - "convex/tsconfig.json — Bundler moduleResolution + skipLibCheck for @convex-dev/auth compatibility"
  - "convex/schema.ts — authTables spread + googleUserId optional field on bills"
  - "ConvexAuthNextjsProvider wrapping client tree in ConvexClientProvider.tsx"
  - "ConvexAuthNextjsServerProvider wrapping html shell in layout.tsx"
  - "All 5 Convex backend env vars set: JWT_PRIVATE_KEY, JWKS, SITE_URL, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET"

affects: [08-02, 08-03]

# Tech tracking
tech-stack:
  added:
    - "@convex-dev/auth@0.0.93"
    - "@auth/core@0.37.0 (pinned)"
  patterns:
    - "ConvexAuthNextjsProvider replaces ConvexProvider in client tree; ConvexReactClient singleton unchanged"
    - "ConvexAuthNextjsServerProvider wraps html shell as Server Component — no use client"
    - "authTables spread as first entry in defineSchema to register auth-managed tables"
    - "Google OAuth credentials set as Convex backend env vars (not .env.local)"
    - "No proxy.ts / middleware.ts — auth is optional per D-01; Next.js 16 proxy compatibility issue avoided"

key-files:
  created:
    - convex/auth.config.ts
    - convex/auth.ts
    - convex/http.ts
    - convex/tsconfig.json
  modified:
    - convex/schema.ts
    - src/components/ConvexClientProvider.tsx
    - src/app/layout.tsx
    - package.json
    - pnpm-lock.yaml

key-decisions:
  - "Pin @auth/core to exactly 0.37.0 (not ^0.37.0) — @convex-dev/auth peer range requires this exact version to avoid incompatible types"
  - "No proxy.ts or middleware.ts created — auth is optional (D-01), Next.js 16 has known proxy compatibility issues (#271)"
  - "googleUserId stored as v.optional(v.string()) on bills, not v.id('users') — no FK to users table per plan spec"
  - "convex/tsconfig.json uses 'Bundler' moduleResolution (capital B) — required by @convex-dev/auth; root tsconfig.json left unchanged"
  - "All OAuth credentials set as Convex backend env vars via npx convex env set — never in .env.local (Pitfall 3)"

patterns-established:
  - "Auth-optional pattern: existing createBill/dashboard/claim flows unaffected; sign-in is additive"
  - "authTables must be the first spread in defineSchema — position matters for Convex table registration"
  - "Redirect URI must point to Convex .site URL, not Next.js app URL: https://adamant-penguin-25.convex.site/api/auth/callback/google"

requirements-completed: [BONUS-05]

# Metrics
duration: 30min
completed: 2026-06-06
---

# Phase 8 Plan 01: Google Auth Foundation Summary

**@convex-dev/auth installed with Google OAuth provider, authTables in schema, ConvexAuthNextjsProvider wired client+server, and all 5 Convex env vars set — ready for dual-auth mutations (Plan 02) and sign-in UI (Plan 03)**

## Performance

- **Duration:** ~30 min (human credential setup by user)
- **Started:** 2026-06-06T13:48:00Z
- **Completed:** 2026-06-06T13:50:35Z (code); credentials completed by user afterward
- **Tasks:** 3 auto tasks + 1 human-action checkpoint (credentials)
- **Files modified:** 9 (5 new Convex files, 2 provider files, package.json, pnpm-lock.yaml)

## Accomplishments

- Installed @convex-dev/auth@0.0.93 and @auth/core@0.37.0 (pinned); 4 new Convex backend files created verbatim from PATTERNS.md
- Extended schema with authTables (7 auth-managed tables) and googleUserId optional field on bills; Convex schema push confirmed by user
- Replaced ConvexProvider with ConvexAuthNextjsProvider in client tree and wrapped html shell with ConvexAuthNextjsServerProvider — existing useQuery/useMutation hooks unaffected
- All 5 Convex backend env vars confirmed set: JWT_PRIVATE_KEY, JWKS, SITE_URL, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET

## Task Commits

Each task was committed atomically:

1. **Task 2: Install auth packages + create 4 new Convex files + extend schema** - `34e33a7` (feat)
2. **Task 3: Wire ConvexAuthNextjsProvider + ConvexAuthNextjsServerProvider** - `ac19b54` (feat)

Note: Task 1 was a package legitimacy checkpoint (human-verified). Task 4 was a human-action checkpoint (credential setup — completed by user, no commit).

## Files Created/Modified

- `convex/auth.config.ts` — JWT provider config: domain from process.env.CONVEX_SITE_URL, applicationID "convex"
- `convex/auth.ts` — convexAuth with Google provider; exports auth, signIn, signOut, store, isAuthenticated
- `convex/http.ts` — httpRouter with auth.addHttpRoutes; handles /api/auth/callback/google
- `convex/tsconfig.json` — Convex-specific TS config: Bundler moduleResolution, skipLibCheck, ESNext target
- `convex/schema.ts` — authTables spread added first; googleUserId: v.optional(v.string()) added to bills
- `src/components/ConvexClientProvider.tsx` — ConvexProvider replaced with ConvexAuthNextjsProvider; ConvexReactClient singleton unchanged
- `src/app/layout.tsx` — ConvexAuthNextjsServerProvider wraps html shell; stays a Server Component
- `package.json` — @convex-dev/auth@0.0.93 and @auth/core@0.37.0 added
- `pnpm-lock.yaml` — lockfile updated

## Decisions Made

- Pin @auth/core to exactly 0.37.0 (not ^0.37.0) — required by @convex-dev/auth peer range to avoid type mismatches
- No proxy.ts or middleware.ts created — auth is optional per D-01; Next.js 16 has known compatibility issues with convex-auth proxy (#271)
- googleUserId stored as optional string on bills (not v.id("users")) — no foreign key to users table per plan spec
- Convex-specific tsconfig.json uses capital "Bundler" for moduleResolution — required by @convex-dev/auth's internal imports; root tsconfig.json left unchanged
- OAuth redirect URI points to Convex .site URL (not Next.js app URL) — auth callback must reach Convex HTTP actions

## Deviations from Plan

None — plan executed exactly as written. All file contents match verbatim specifications from PATTERNS.md. Human credential setup completed by user as expected per Task 4 checkpoint.

## Issues Encountered

**Pre-existing lint errors (7 errors in unrelated files):** `pnpm lint` reports 7 errors in ThemeToggle.tsx, create/page.tsx, dashboard page, share page, and member view page — all `react-hooks/set-state-in-effect` violations from prior phases. None were introduced by this plan. These are pre-existing and out of scope per the scope boundary rule.

## User Setup Required

**External credentials were required and completed by the user:**

- JWT_PRIVATE_KEY and JWKS: generated via generateKeys.mjs (run-once, then deleted — not committed)
- Google OAuth 2.0 Client created with redirect URI: `https://adamant-penguin-25.convex.site/api/auth/callback/google`
- All 5 Convex env vars set via `npx convex env set` (not .env.local)
- Schema pushed via `pnpm dev:convex` — authTables (7 tables) and googleUserId on bills confirmed

Verified via `npx convex env list`: JWT_PRIVATE_KEY, JWKS, SITE_URL, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET all present.

## Next Phase Readiness

- Auth foundation is complete — getAuthUserId(ctx) is importable in any Convex function
- Plan 02 (dual-auth mutations): can now add optional Google user ID to createBill and organizer-gated functions
- Plan 03 (sign-in UI): can now build the Google Sign-In button and session state UI
- No blockers — all dependencies satisfied

---
*Phase: 08-google-auth*
*Completed: 2026-06-06*
