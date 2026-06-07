---
phase: 07-claiming-payment-ux
plan: 02
subsystem: backend
tags: [convex, schema, mutation, xss-sanitization, banking-info]

# Dependency graph
requires:
  - phase: 07-01
    provides: Pure-predicate boundary tests for updateBankingInfo (auth/archive/XSS contracts)
  - phase: 06-math-precision-fixes
    provides: calculateTotals with roundingAdjustmentCents
provides:
  - bills table extended with 4 banking info fields (bankName, accountNumber, accountHolderName, duitNowId)
  - updateBankingInfo mutation in convex/bills.ts (auth guard + archive freeze + XSS sanitize + patch)
affects: [07-03, 07-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - updateBankingInfo mirrors updateRoundingAdjustment pattern exactly (auth + archive freeze + string sanitize + patch)
    - XSS sanitization with .replace(/[<>"]/g, '') on all 4 string fields before ctx.db.patch

key-files:
  created: []
  modified:
    - convex/schema.ts
    - convex/bills.ts

key-decisions:
  - "Merged release/v1.2.0 into worktree (fast-forward) to get Phase 6 calculateTotals and Phase 7 Wave 1 test files before implementing"
  - "updateBankingInfo passes all 4 banking args (including undefined) to ctx.db.patch — allows clearing individual fields"
  - "getBillForMember unchanged — spread ...billWithoutSecret automatically includes the 4 new banking fields"

requirements-completed: [CLAIM-BANK-01]

# Metrics
duration: 3min
completed: 2026-06-04
---

# Phase 07 Plan 02: Banking Info Schema + Mutation Summary

**Extended bills schema with 4 banking info fields and added updateBankingInfo mutation with auth guard, archive freeze, and XSS sanitization — backend foundation for organizer banking display**

## Performance

- **Duration:** 3 min
- **Started:** 2026-06-04T12:22:01Z
- **Completed:** 2026-06-04T12:24:29Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Extended `convex/schema.ts` bills table with 4 new `v.optional(v.string())` fields: `bankName`, `accountNumber`, `accountHolderName`, `duitNowId`
- Added `updateBankingInfo` mutation to `convex/bills.ts` following the exact `updateRoundingAdjustment` pattern
- Mutation enforces auth guard, archive freeze check, and XSS sanitization (strips `<>"`  from all 4 string inputs)
- All 12 `updateBankingInfo.test.ts` boundary tests pass
- `getBillForMember` automatically returns new banking fields via existing spread pattern — no code change needed

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend bills schema with 4 banking info fields** - `6e524b6` (feat)
2. **Task 2: Add updateBankingInfo mutation to convex/bills.ts** - `5677a14` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified

- `convex/schema.ts` - Added `bankName`, `accountNumber`, `accountHolderName`, `duitNowId` as `v.optional(v.string())` to bills table with Phase 07 comment
- `convex/bills.ts` - Added `updateBankingInfo` mutation (exported) with billId, organizerSecret, and 4 optional string args; auth + archive freeze + XSS sanitize + ctx.db.patch

## Decisions Made

- Merged `release/v1.2.0` into the worktree via fast-forward before making changes: worktree was based on commit `4abbc60` (pre-Phase 6), missing `roundingAdjustmentCents` in schema and `updateRoundingAdjustment` in bills.ts. The merge brought in all Phase 6 and Phase 7 Wave 1 changes.
- Passed sanitized values (or `undefined` if arg was `undefined`) for all 4 banking fields in `ctx.db.patch` — this allows individual fields to be cleared when undefined is explicitly passed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Merged release/v1.2.0 into worktree to get Phase 6 + Phase 7 Wave 1 changes**
- **Found during:** Task 1 setup
- **Issue:** Worktree was based on commit `4abbc60` (pre-Phase 6), missing `roundingAdjustmentCents` schema field and `updateRoundingAdjustment` mutation pattern from bills.ts that this plan needed to mirror
- **Fix:** Ran `git merge release/v1.2.0 --no-edit` (fast-forward). Brought in 15 Phase 6 commits + Phase 7 Wave 1 test files
- **Files modified:** See Phase 6 summary files (no application code modified by this plan as part of the merge)
- **Committed in:** Fast-forward merge (no separate merge commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Required to unblock implementation. No scope creep.

## Pre-existing Test Failures (out of scope)

The following test files fail in both the main repo and the worktree — they are pre-existing failures unrelated to this plan's changes:

- `src/test/SettleStamp.test.tsx` — 3 failures (UI component tests)
- `src/test/StatusBadge.test.tsx` — 2 failures (UI component tests)
- `src/test/landingPage.test.tsx` — 3 failures (Phase 5 landing page DOM order)

These are in scope for a future phase. Logged here for tracking.

## Known Stubs

None — all 4 banking fields are wired to real schema and mutation; no placeholder values.

## Threat Flags

No new security-relevant surface beyond what the plan's threat model describes:
- T-07-01: auth guard implemented (organizerSecret check)
- T-07-02: XSS sanitization implemented (all 4 string fields)
- T-07-03: archive freeze implemented (archivedAt check)

## Next Phase Readiness

- 07-03 (dashboard UI) can now call `api.bills.updateBankingInfo` to save banking info
- 07-04 (member view) can read banking fields from `getBillForMember` result (auto-included via spread)
- No blockers for 07-03 or 07-04

---
*Phase: 07-claiming-payment-ux*
*Completed: 2026-06-04*
