---
phase: "06"
plan: "02"
subsystem: "lib/backend"
tags: ["tdd", "green-phase", "wave-1", "math-precision", "schema", "convex"]
dependency_graph:
  requires:
    - "06-01 (Wave 0 RED tests)"
  provides:
    - "Extended calculateTotals (4-arg) returning roundingAdjustmentCents"
    - "Extended calculatePersonTotals (5-arg) returning personRoundingAdjustmentCents"
    - "Convex schema with roundingAdjustmentCents on bills table"
    - "updateRoundingAdjustment mutation with auth + archive + integer guards"
    - "CR-03/WR-01/WR-02 bug fixes in convex/bills.ts"
  affects:
    - "src/app/c/[billId]/page.tsx (call site needs 5th arg — Wave 1 frontend plans)"
    - "src/app/dashboard/[billId]/page.tsx (call site + mutation wiring — Wave 1 frontend plans)"
    - "src/app/create/page.tsx (createBill call + field — Wave 1 frontend plans)"
tech_stack:
  added: []
  patterns:
    - "Proportional Math.round distribution (ratio x adjustment) for personRoundingAdjustmentCents"
    - "updateQR mutation pattern copied verbatim for updateRoundingAdjustment"
    - "v.optional(v.number()) pattern for roundingAdjustmentCents schema field"
key_files:
  created: []
  modified:
    - "src/lib/calculateTotals.ts"
    - "convex/schema.ts"
    - "convex/bills.ts"
decisions:
  - "Removed paidSessions Set and payments query from getClaimsForBill entirely (WR-02 fix makes them unused)"
  - "roundingAdjustmentCents added to createBill args as optional so existing callers are unaffected"
metrics:
  duration: "~10 minutes"
  completed: "2026-06-03"
  tasks_completed: 2
  tasks_total: 2
  files_created: 0
  files_modified: 3
---

# Phase 06 Plan 02: Schema + Lib GREEN Phase (Wave 1) Summary

Wave 1 GREEN phase: extended calculateTotals.ts with rounding adjustment 4th/5th args, added roundingAdjustmentCents schema field, and fixed CR-03/WR-01/WR-02 bugs plus new updateRoundingAdjustment mutation.

## What Was Built

**Modified:** `src/lib/calculateTotals.ts`
- `calculateTotals` extended with `roundingAdjustmentCents: number = 0` as 4th parameter
- Return type now includes `roundingAdjustmentCents: number`
- `grandTotalCents` formula updated to include the adjustment
- `calculatePersonTotals` extended with `roundingAdjustmentCents: number = 0` as 5th parameter
- Return type now includes `personRoundingAdjustmentCents: number`
- Zero-guard early return block updated to include `personRoundingAdjustmentCents: 0`
- New calculation: `const personRoundingAdjustmentCents = Math.round(ratio * roundingAdjustmentCents)`
- `personTotalCents` now includes `personRoundingAdjustmentCents`

**Modified:** `convex/schema.ts`
- Added `roundingAdjustmentCents: v.optional(v.number())` to bills table after `archivedAt`

**Modified:** `convex/bills.ts`
- CR-03 fix: `createBill` validation loop now checks `Number.isInteger(item.quantity) && item.quantity >= 1`
- `createBill` args extended with `roundingAdjustmentCents: v.optional(v.number())`
- `createBill` insert extended with `roundingAdjustmentCents: args.roundingAdjustmentCents`
- WR-01 fix: `claimItem` now throws `"Claimant name cannot be empty"` when `claimantName.trim()` is falsy
- WR-02 fix: `getClaimsForBill` claimedCount now uses `claimingSessions.size` (removed payment-status filter and unused `paidSessions` Set + `payments` query)
- New `updateRoundingAdjustment` mutation: auth guard + archive freeze + integer validation + `ctx.db.patch`

## Task Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Extend calculateTotals.ts with rounding adjustment | e5c9b4a | src/lib/calculateTotals.ts |
| 2 | Update convex/schema.ts and fix convex/bills.ts | 62c241a | convex/schema.ts, convex/bills.ts |

## Test Results After Wave 1

| File | Pre-existing | New RED to GREEN | Status |
|------|-------------|------------------|--------|
| calculateTotalsLib.test.ts | 13 PASS | 5 PASS (T-CALC-ADJ-01..05) | All GREEN |
| calculatePersonTotals.test.ts | 20 PASS | 7 PASS (T-ADJ-01..07) | All GREEN |
| updateRoundingAdjustment.test.ts | 21 PASS | no new tests | All GREEN |

Total: 66 tests passing across 3 files. 12 previously-RED tests are now GREEN.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed unused `payments` query from `getClaimsForBill`**
- **Found during:** Task 2, WR-02 fix
- **Issue:** After replacing `claimedCount` with `claimingSessions.size`, the `payments` variable (and its DB query) became entirely unused in `getClaimsForBill`. Leaving a DB query that fetches data only to be discarded is a latent correctness issue and wastes a Convex read.
- **Fix:** Removed the `payments` query and the `paidSessions` Set from `getClaimsForBill` entirely. The function now only queries `claims` and `items`.
- **Files modified:** convex/bills.ts
- **Commit:** 62c241a

### Pre-existing Test Failures (Out of Scope)

8 tests were already failing on the Wave 0 base commit (`9c57155`) before any Wave 1 changes:
- `src/test/SettleStamp.test.tsx` — 3 failures (component rendering)
- `src/test/StatusBadge.test.tsx` — 2 failures (component rendering)
- `src/test/landingPage.test.tsx` — 3 failures (DOM order assertions for Phase 5 landing page)

These failures are unrelated to Phase 6 math/precision changes and pre-date this plan.

## Known Stubs

None — all calculations are fully wired. `roundingAdjustmentCents` defaults to 0 when absent (backward compatible). No UI stubs introduced in this plan.

## Threat Surface Scan

| Flag | File | Description |
|------|------|-------------|
| threat_flag: new-mutation | convex/bills.ts | `updateRoundingAdjustment` is a new write endpoint accepting untrusted `roundingAdjustmentCents` from the browser. Mitigated by: (1) `organizerSecret` auth guard, (2) archive freeze check, (3) `Number.isInteger()` validation before patch. All mitigations from T-06-02-03/04/05 in plan threat register are implemented. |

## Self-Check: PASSED

- src/lib/calculateTotals.ts: FOUND (modified)
- convex/schema.ts: FOUND (modified)
- convex/bills.ts: FOUND (modified)
- Commit e5c9b4a: FOUND (Task 1)
- Commit 62c241a: FOUND (Task 2)
- calculateTotalsLib.test.ts: 18 tests pass (13 pre-existing + 5 T-CALC-ADJ)
- calculatePersonTotals.test.ts: 27 tests pass (20 pre-existing + 7 T-ADJ)
- updateRoundingAdjustment.test.ts: 21 tests pass (all pre-existing)
- Schema field `roundingAdjustmentCents`: present in convex/schema.ts (grep count >= 1)
- `updateRoundingAdjustment` in convex/bills.ts: 2 occurrences (export + handler)
