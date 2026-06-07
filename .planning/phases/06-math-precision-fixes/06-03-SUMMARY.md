---
phase: "06"
plan: "03"
subsystem: "frontend/member-view"
tags: ["wave-2", "bugfix", "math-precision", "cr-01", "cr-02", "adj-07"]
dependency_graph:
  requires:
    - "06-02 (Wave 1 — extended calculateTotals/calculatePersonTotals signatures)"
  provides:
    - "CR-01 redirect race fix in src/app/c/[billId]/page.tsx"
    - "CR-02 payment loading state fix in src/app/c/[billId]/page.tsx"
    - "ADJ-07 adjusted Your Portion row in member view"
  affects:
    - "src/app/c/[billId]/page.tsx"
tech_stack:
  added: []
  patterns:
    - "isPaymentLoading flag distinguishes undefined (loading) from null (no record)"
    - "pendingItems.size === 0 guard before router.replace to avoid redirect mid-mutation"
    - "Conditional dot-leader row for personRoundingAdjustmentCents"
    - "text-pen/text-ink colour for adjustment sign — never text-stamp"
key_files:
  created: []
  modified:
    - "src/app/c/[billId]/page.tsx"
decisions:
  - "Used Math.abs() for formatting negative rounding adjustment to avoid double-sign display"
  - "Conditional row checks personRoundingAdjustmentCents !== 0 using ?? 0 fallback for null personTotals"
metrics:
  duration: "~5 minutes"
  completed: "2026-06-03"
  tasks_completed: 1
  tasks_total: 1
  files_created: 0
  files_modified: 1
---

# Phase 06 Plan 03: Member View Bug Fixes (Wave 2) Summary

Three surgical fixes to `src/app/c/[billId]/page.tsx`: CR-01 redirect race guard, CR-02 payment loading state distinction, and ADJ-07 rounding adjustment row in Your Portion panel.

## What Was Built

**Modified:** `src/app/c/[billId]/page.tsx`

- **CR-01 fix:** `useEffect` for organizer redirect now guards with `pendingItems.size === 0` — prevents `router.replace` firing while a `claimItem` or `unclaimItem` mutation is still in-flight. `pendingItems` added to dependency array.
- **CR-02 fix:** Added `isPaymentLoading = payment === undefined && claimantSession !== null` flag. `paymentStatus` now uses ternary instead of `?? null` to preserve the `undefined` vs `null` distinction. `showPayForm` gated by `!isPaymentLoading`. `isButtonDisabled` extends to include `isPaymentLoading` as first condition.
- **ADJ-07 fix:** `calculateTotals` call now passes `bill.roundingAdjustmentCents ?? 0` as 4th argument. `calculatePersonTotals` call now passes `bill.roundingAdjustmentCents ?? 0` as 5th argument. Added conditional dot-leader row in Your Portion panel that shows only when `personRoundingAdjustmentCents !== 0`, with `+` prefix for positive values, `text-pen` for positive, `text-ink` for negative — never `text-stamp`.

## Task Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Fix CR-01, CR-02, ADJ-07 in member view | 27d3f24 | src/app/c/[billId]/page.tsx |

## Test Results

All calculation-related tests pass (66 tests across `calculateTotalsLib.test.ts`, `calculatePersonTotals.test.ts`, `updateRoundingAdjustment.test.ts`).

8 pre-existing failures remain unchanged:
- `src/test/SettleStamp.test.tsx` — 3 failures (pre-existing, unrelated to Phase 6)
- `src/test/StatusBadge.test.tsx` — 2 failures (pre-existing, unrelated to Phase 6)
- `src/test/landingPage.test.tsx` — 3 failures (pre-existing, DOM order assertions for Phase 5 landing page)

No new test failures introduced by this plan.

## Deviations from Plan

None — plan executed exactly as written. All three changes applied surgically to `src/app/c/[billId]/page.tsx` without modifying adjacent code.

## Known Stubs

None — all three fixes are fully wired. `bill.roundingAdjustmentCents ?? 0` handles existing bills that predate the schema addition (backwards compatible).

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced in this plan. All changes are client-side rendering/state logic.

## Self-Check: PASSED

- src/app/c/[billId]/page.tsx: FOUND (modified)
- Commit 27d3f24: FOUND (Task 1)
- `isPaymentLoading` occurrences: 3 (declaration + 2 uses in showPayForm and isButtonDisabled)
- `pendingItems.size === 0` occurrences: 2 (condition in useEffect guard)
- `roundingAdjustmentCents` occurrences in page.tsx: 3 (calculateTotals call + calculatePersonTotals call + conditional row)
- No `text-stamp` on rounding adjustment row: CONFIRMED
