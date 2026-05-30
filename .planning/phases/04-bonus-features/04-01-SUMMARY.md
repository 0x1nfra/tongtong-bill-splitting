---
phase: 04-bonus-features
plan: 01
subsystem: tests
tags: [tdd, nyquist, wave-0, test-stubs, archive, sign-in]
dependency_graph:
  requires: []
  provides: [archiveStale.test.ts, archivedBill.test.tsx, SignIn.test.tsx]
  affects: [04-02-PLAN, 04-03-PLAN, 04-04-PLAN]
tech_stack:
  added: []
  patterns: [vitest, inline-pure-function-contract, red-green-stub]
key_files:
  created:
    - src/test/archiveStale.test.ts
    - src/test/archivedBill.test.tsx
    - src/test/SignIn.test.tsx
  modified: []
decisions:
  - "archiveStale tests define the isStale predicate inline (pure function contract) so tests pass immediately in GREEN while integration contract awaits plan 02"
  - "archivedBill.test.tsx imports ArchivedStamp directly (not MemberViewPage) to keep test surface minimal and predictably RED until plan 03"
  - "SignIn.test.tsx documents BONUS-05 deferral per D-08 in top-of-file comment"
metrics:
  duration: 87s
  completed: "2026-05-28"
  tasks_completed: 3
  files_created: 3
  files_modified: 0
---

# Phase 4 Plan 01: Wave-0 Test Stubs Summary

Wave 0 Nyquist gate test stubs — three test files establishing RED state for archive logic, archived bill rendering, and sign-in button before implementing plans run.

## What Was Built

Three test stub files were created to satisfy the Nyquist validation contract. Plans 02-04 must turn each stub GREEN by implementing the corresponding feature.

| File | State | Purpose |
|------|-------|---------|
| `src/test/archiveStale.test.ts` | GREEN (3/3) | Defines the isStale pure-function boundary contract for 30-day archive logic |
| `src/test/archivedBill.test.tsx` | RED (module-not-found) | Component test for ArchivedStamp — fails until plan 03 creates the component |
| `src/test/SignIn.test.tsx` | RED (module-not-found) | Smoke test for SignInButton — fails until plan 04 creates the component |

## Task Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | archiveStale unit test stub | 43e6b1f | src/test/archiveStale.test.ts |
| 2 | archivedBill component test stub | a26860f | src/test/archivedBill.test.tsx |
| 3 | SignIn smoke test stub | 0988c13 | src/test/SignIn.test.tsx |

## Deviations from Plan

None — plan executed exactly as written.

## Contracts Established

**archiveStale:** `isStale(creationTime: number, nowMs: number): boolean` — returns `true` when `nowMs - creationTime >= 30 * 24 * 60 * 60 * 1000`. Boundary (exactly 30 days) counts as stale.

**ArchivedStamp:** Presentational component with no Convex hooks. Must render text `"ARCHIVED"` and `"THIS CHIT IS ARCHIVED"`.

**SignInButton:** Presentational component. Must render `<button>` with accessible name matching `/sign in with google/i`.

## Known Stubs

- `@/components/ArchivedStamp` — does not exist; plan 03 creates it
- `@/components/SignInButton` — does not exist; plan 04 creates it

These stubs are intentional — they define RED state for downstream plans.

## Threat Flags

None — test-only files, no new runtime or network surface.

## Self-Check: PASSED

- [x] src/test/archiveStale.test.ts exists and 3 tests pass
- [x] src/test/archivedBill.test.tsx exists and fails RED (module-not-found for ArchivedStamp)
- [x] src/test/SignIn.test.tsx exists and fails RED (module-not-found for SignInButton)
- [x] Commits 43e6b1f, a26860f, 0988c13 verified in git log
- [x] Pre-existing test failures (landingPage.test.tsx — 4 tests) are unchanged and pre-existing
