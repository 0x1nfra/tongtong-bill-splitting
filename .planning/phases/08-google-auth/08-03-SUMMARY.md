---
phase: 08-google-auth
plan: 03
subsystem: auth
tags: [convex-auth, google-oauth, react, dual-auth, useConvexAuth, useAuthActions]

# Dependency graph
requires:
  - phase: 08-01
    provides: "@convex-dev/auth packages installed, ConvexAuthNextjsProvider wired in layout.tsx"
  - phase: 08-02
    provides: "Convex backend dual-auth guards on all organizer-gated functions"
provides:
  - "Wired SignInButton triggering Google OAuth via useAuthActions().signIn('google')"
  - "Dashboard sign-in banner for new-device organizers (chit-styled, blue border, no red)"
  - "Auth-loading skeleton preventing banner flash while Convex auth resolves"
  - "Dual-auth query paths for all 4 dashboard useQuery calls (Google path omits organizerSecret)"
  - "GREEN SignIn.test.tsx smoke test with @convex-dev/auth/react mock"
affects: [08-04, human-checkpoint-oauth-flow]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Dual-auth skip guard: (!organizerSecret && authLoading) || organizerSecret === null ? skip : organizerSecret ? { billId, organizerSecret } : isAuthenticated ? { billId } : skip"
    - "organizerSecret || undefined at mutation call sites so Google-auth sessions send no secret"
    - "useConvexAuth() for isAuthenticated + isLoading state"
    - "vi.mock('@convex-dev/auth/react') pattern for unit testing auth-gated components"

key-files:
  created: []
  modified:
    - src/components/SignInButton.tsx
    - src/test/SignIn.test.tsx
    - src/app/dashboard/[billId]/page.tsx
    - vitest.config.ts
    - eslint.config.mjs

key-decisions:
  - "Sign-in banner uses .chit + border-l-4 border-pen with no red (text-stamp banned per design constraint)"
  - "Auth-loading skeleton placed before banner guard to prevent flash on Google-auth return visits"
  - "organizerSecret || undefined (not organizerSecret!) at mutation sites — Google sessions send undefined and server falls back to getAuthUserId(ctx)"
  - "WRONG DEVICE LAH guard replaced entirely; billData === null guard updated to ACCESS DENIED (non-red)"
  - "Excluded .claude worktree paths from vitest + eslint to prevent stale snapshot interference"

patterns-established:
  - "Dual-auth skip guard pattern: covers localStorage auth, Google auth, and loading states in a single expression"
  - "Mutation call sites use || undefined instead of ! to be safe across both auth paths"

requirements-completed: [BONUS-05]

# Metrics
duration: 25min
completed: 2026-06-07
---

# Phase 8 Plan 03: Frontend Google OAuth Sign-In Summary

**SignInButton wired to Google OAuth via useAuthActions, dashboard now supports dual-auth query paths (localStorage + Google) with a chit-styled sign-in banner for new-device organizers**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-06-07T20:36:00Z
- **Completed:** 2026-06-07T20:44:00Z
- **Tasks:** 2 (Tasks 1 and 2; Task 3 is a human checkpoint)
- **Files modified:** 5

## Accomplishments

- SignInButton now imports `useAuthActions` from `@convex-dev/auth/react` and triggers `signIn("google")` on click
- SignIn.test.tsx is GREEN — mocks `@convex-dev/auth/react` so component renders in unit test without a provider
- Dashboard has three layered guards: (1) localStorage loading skeleton, (2) auth-loading skeleton for Google auth resolution, (3) sign-in banner when unauthenticated
- All 4 dashboard `useQuery` calls use dual-auth skip guard — Google-auth sessions load dashboard via `{ billId }` with no organizerSecret
- All 6 `organizerSecret!` non-null assertions replaced with `organizerSecret || undefined`
- "WRONG DEVICE LAH" completely removed from codebase

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire SignInButton + SignIn.test.tsx GREEN** - `50ce649` (feat)
2. **Task 2: Dashboard dual-auth paths + sign-in banner + auth-loading skeleton** - `d22f4f8` (feat)

## Files Created/Modified

- `src/components/SignInButton.tsx` - Wired to `useAuthActions().signIn("google")` on click
- `src/test/SignIn.test.tsx` - Added `vi.mock('@convex-dev/auth/react', ...)` mock; updated stale comments
- `src/app/dashboard/[billId]/page.tsx` - Added dual-auth query paths, auth-loading skeleton, sign-in banner; removed WRONG DEVICE LAH; relaxed mutation early-returns
- `vitest.config.ts` - Added `exclude: ['**/.claude/**']` to prevent worktree test discovery
- `eslint.config.mjs` - Added `.claude/**` to globalIgnores to prevent worktree lint errors

## Decisions Made

- Used `border-l-4 border-pen p-6` on the chit banner container — no rotation/crease classes per UI-SPEC, no `text-stamp` (red banned in this banner)
- `billData === null` guard renamed from "WRONG DEVICE LAH" to "ACCESS DENIED" — semantically correct for both localStorage mismatch and Google auth unauthorized
- Excluded `.claude` worktrees from both vitest and eslint as a Rule 3 fix — worktree files are stale snapshots that were polluting test and lint results

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Excluded .claude worktrees from vitest and eslint**
- **Found during:** Task 1 (SignIn.test.tsx verification)
- **Issue:** Vitest was discovering tests inside `.claude/worktrees/agent-*/` (stale worktree snapshots). The worktree's SignIn.test.tsx lacked the `vi.mock` and was failing with "Cannot destructure property 'signIn' of 'useAuthActions(...)' as it is undefined". ESLint was also linting worktree files and producing 14 pre-existing errors.
- **Fix:** Added `exclude: ['**/.claude/**', '**/node_modules/**']` to `vitest.config.ts`; added `.claude/**` to `globalIgnores` in `eslint.config.mjs`
- **Files modified:** `vitest.config.ts`, `eslint.config.mjs`
- **Verification:** `pnpm exec vitest run src/test/SignIn.test.tsx` passes; ESLint error count dropped from 14 to 7 (remaining 7 are pre-existing `react-hooks/set-state-in-effect` across multiple files)
- **Committed in:** `50ce649` (Task 1) and `d22f4f8` (Task 2)

---

**Total deviations:** 1 auto-fixed (1 blocking infrastructure issue)
**Impact on plan:** Necessary fix to prevent stale worktree artifacts from interfering with CI-equivalent checks. No scope creep.

## Issues Encountered

- **Pre-existing lint failures:** `pnpm lint` reports 7 errors across `src/app/c/[billId]/page.tsx`, `src/app/create/page.tsx`, `src/app/dashboard/[billId]/page.tsx`, `src/app/share/[billId]/page.tsx`, and `src/components/ThemeToggle.tsx` — all `react-hooks/set-state-in-effect` violations from the pattern of calling `setState` inside `useEffect` for SSR-safe localStorage access. These were pre-existing before Phase 8 Plan 03 and were not introduced by this plan's changes. Task 2 did not add any new `useEffect`/`setState` calls.
- **Pre-existing test failures:** 8 tests fail in `src/test/SettleStamp.test.tsx`, `src/test/StatusBadge.test.tsx`, and `src/test/landingPage.test.tsx`. All pre-existing; none caused by Plan 03 changes. `SignIn.test.tsx` passes.

## Known Stubs

None — all functionality wired. The Google OAuth flow requires live browser testing (Task 3 human checkpoint).

## Next Phase Readiness

- SignInButton is production-ready; triggers Google OAuth flow
- Dashboard dual-auth query paths are code-complete; requires live Convex environment with Google OAuth credentials configured (Phase 8 Plan 01 external setup) to verify end-to-end
- Task 3 (checkpoint:human-verify) covers 5 scenarios: same-device localStorage path, new-device banner, cross-device Google auth access, pre-Phase-8 bill not recoverable, no banner flash

---
*Phase: 08-google-auth*
*Completed: 2026-06-07*
