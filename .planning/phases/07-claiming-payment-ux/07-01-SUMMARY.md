---
phase: 07-claiming-payment-ux
plan: 01
subsystem: testing
tags: [vitest, tdd, pure-predicates, xss-sanitization, rounding-adjustment]

# Dependency graph
requires:
  - phase: 06-math-precision-fixes
    provides: calculateTotals with roundingAdjustmentCents return field
provides:
  - Pure-predicate boundary tests for updateBankingInfo mutation (auth, archive-freeze, XSS)
  - Data-prerequisite smoke tests confirming calculateTotals returns roundingAdjustmentCents
affects: [07-02, 07-03]

# Tech tracking
tech-stack:
  added: []
  patterns: [pure-predicate test pattern for Convex mutation boundary contracts]

key-files:
  created:
    - src/test/updateBankingInfo.test.ts
    - src/test/roundingAdjInBillTotal.test.ts
  modified: []

key-decisions:
  - "Merge release/v1.2.0 into worktree to get Phase 6 calculateTotals changes before writing smoke tests"
  - "All 12 updateBankingInfo tests are pure-predicate (no Convex runtime dependency) following established pattern from updateRoundingAdjustment.test.ts"

patterns-established:
  - "Pure-predicate pattern: define predicate functions inline at file scope, test contracts independently of Convex runtime"
  - "isSafeText predicate: rejects <, >, and \" to guard banking info fields against XSS"

requirements-completed: [CLAIM-BANK-01, UAT-ADJ-01]

# Metrics
duration: 8min
completed: 2026-06-04
---

# Phase 07 Plan 01: TDD Test Stubs for updateBankingInfo and roundingAdjInBillTotal Summary

**Pure-predicate boundary tests for updateBankingInfo (auth/archive/XSS) and calculateTotals shape smoke tests that document contracts for 07-02 and 07-03 implementation**

## Performance

- **Duration:** 8 min
- **Started:** 2026-06-04T20:15:00Z
- **Completed:** 2026-06-04T20:23:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created `updateBankingInfo.test.ts` with 12 pure-predicate tests across 3 describe blocks (auth, archive-freeze, XSS sanitization)
- Created `roundingAdjInBillTotal.test.ts` with 3 smoke tests confirming `calculateTotals` returns `roundingAdjustmentCents` in output shape
- All 15 tests pass; no application code modified

## Task Commits

Each task was committed atomically:

1. **Task 1: Create updateBankingInfo.test.ts (pure-predicate boundary tests)** - `0f343cc` (test)
2. **Task 2: Create roundingAdjInBillTotal.test.ts (data-prerequisite smoke tests)** - `5b4c0e7` (test)

**Plan metadata:** (docs commit below)

## Files Created/Modified
- `src/test/updateBankingInfo.test.ts` - Pure-predicate tests for updateBankingInfo mutation: isAuthorized (3), isArchived (3), isSafeText (6); documents contracts for 07-02 implementation
- `src/test/roundingAdjInBillTotal.test.ts` - Smoke tests verifying calculateTotals returns roundingAdjustmentCents; documents data contract for 07-03 UI row

## Decisions Made
- Merged `release/v1.2.0` into the worktree before writing Task 2 tests: the worktree was based on an older branch state that predated Phase 6's `roundingAdjustmentCents` addition to `calculateTotals`. Without the merge the smoke tests would have failed to compile.
- Followed the established pure-predicate pattern from `updateRoundingAdjustment.test.ts` exactly — no imports from application or Convex code, predicates defined inline at file scope.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Merged release/v1.2.0 into worktree to resolve missing calculateTotals changes**
- **Found during:** Task 2 setup
- **Issue:** Worktree was based on commit `4abbc60` (pre-Phase 6), so `src/lib/calculateTotals.ts` did not have the `roundingAdjustmentCents` parameter or return field. Task 2's smoke tests would have failed TypeScript compilation.
- **Fix:** Ran `git merge release/v1.2.0 --no-edit` (fast-forward). Brought in 15 Phase 6 commits including the calculateTotals extension.
- **Files modified:** See Phase 6 summary files (no application code modified by this plan)
- **Verification:** `calculateTotals` now accepts `roundingAdjustmentCents` param and returns it; Task 2 tests compile and pass.
- **Committed in:** Merge commit (fast-forward, no separate merge commit created)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Required to unblock Task 2. No scope creep — no application code changed.

## Issues Encountered
- `pnpm test -- updateBankingInfo` via worktree's `node_modules` failed (symlink absent); used main repo's `vitest` directly to run tests by absolute path. All 15 tests pass.

## Known Stubs
None — this plan creates test-only files.

## Threat Flags
None — test-only files; no new production code paths or trust boundaries introduced.

## Next Phase Readiness
- `updateBankingInfo.test.ts` documents the auth/archive/XSS contract that 07-02 must implement in `convex/bills.ts`
- `roundingAdjInBillTotal.test.ts` documents the `calculateTotals` return shape that 07-03's BILL TOTAL rounding adj UI row depends on
- No blockers for 07-02 or 07-03

---
*Phase: 07-claiming-payment-ux*
*Completed: 2026-06-04*
