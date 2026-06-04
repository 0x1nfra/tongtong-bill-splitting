---
phase: 07-claiming-payment-ux
plan: 03
subsystem: frontend
tags: [member-view, bill-total, payment-zone, rounding-adj, banking-info]

# Dependency graph
requires:
  - phase: 07-02
    provides: 4 banking info fields on bills schema + getBillForMember auto-includes them
  - phase: 06-math-precision-fixes
    provides: calculateTotals returns roundingAdjustmentCents
provides:
  - Rounding Adj. row in BILL TOTAL section of member view
  - TRANSFER TO banking info block in PAYMENT ZONE of member view
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Rounding adj row in BILL TOTAL mirrors exact pattern from YOUR PORTION ADJ-07
    - Banking info conditional rendering uses truthy OR across 4 optional fields
    - Individual field rows only rendered when field is truthy (sparse display)

key-files:
  created: []
  modified:
    - src/app/c/[billId]/page.tsx

key-decisions:
  - "Used (totals.roundingAdjustmentCents ?? 0) for null-safety even though totals is non-nullable"
  - "Banking info container uses text-left to override parent text-center in payment zone"
  - "Pre-existing TS error in calculatePersonTotals.test.ts left untouched — out of scope per deviation rules"

requirements-completed: [UAT-ADJ-01, CLAIM-BANK-DISPLAY-01]

# Metrics
duration: 8min
completed: 2026-06-04
---

# Phase 07 Plan 03: Member View UI — Rounding Adj Row + Banking Info Display Summary

**Added Rounding Adj. row to BILL TOTAL section and TRANSFER TO banking info block to PAYMENT ZONE in the member view — two frontend-only insertions, no deletions**

## Performance

- **Duration:** 8 min
- **Started:** 2026-06-04T12:22:00Z
- **Completed:** 2026-06-04T12:30:19Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Inserted Rounding Adj. row between SST block and GRAND TOTAL in the BILL TOTAL zone of `src/app/c/[billId]/page.tsx`
  - Only shown when `totals.roundingAdjustmentCents` is non-zero
  - Positive adj: `text-pen` class with `+` prefix; negative adj: `text-ink` class
  - Mirrors the identical row in the YOUR PORTION zone (ADJ-07 pattern)
- Inserted TRANSFER TO banking info section in the PAYMENT ZONE below the QR image
  - Outer condition: renders only when any of `bill.bankName`, `bill.accountNumber`, `bill.accountHolderName`, `bill.duitNowId` is truthy
  - Four individual dot-leader rows, each conditionally rendered only when the field is non-empty
  - Uses `text-ink` / `text-ink-muted` only — no `text-stamp` anywhere in new markup
- All 109 relevant tests pass with no regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: UAT gap fix — rounding adj row in BILL TOTAL** - `3839478` (feat)
2. **Task 2: Banking info TRANSFER TO block in PAYMENT ZONE** - `a1b3d44` (feat)

## Files Created/Modified

- `src/app/c/[billId]/page.tsx` — Two insertions totalling 43 lines added, 0 deleted

## Decisions Made

- Used `(totals.roundingAdjustmentCents ?? 0)` for null-safety even though `totals` itself is non-nullable — mirrors the `??` pattern used in YOUR PORTION zone for consistency
- Banking info container uses `text-left` class to override the parent `text-center` payment zone div — ensures banking details are left-aligned for readability
- Pre-existing TypeScript error in `src/test/calculatePersonTotals.test.ts:253` (missing `roundingAdjustmentCents` in test mock) was left untouched — it predates this plan and is out of scope per deviation rule scope boundary

## Deviations from Plan

None — plan executed exactly as written. Both insertions matched the specified interfaces exactly, no additional changes required.

## Known Stubs

None — both new UI sections are wired to real computed data (`totals.roundingAdjustmentCents` from `calculateTotals`) and real Convex query data (`bill.bankName` etc from `getBillForMember` auto-spread). No placeholder values.

## Threat Flags

No new security-relevant surface beyond what the plan's threat model describes:
- T-07-04: React auto-escapes banking field values in JSX expressions — no XSS risk
- T-07-05: `totals.roundingAdjustmentCents` is a computed integer, no user input on this render path

## Self-Check: PASSED

- [x] `src/app/c/[billId]/page.tsx` exists and contains both insertions
- [x] Commit `3839478` exists: `feat(07-03): add rounding adj row to bill total section`
- [x] Commit `a1b3d44` exists: `feat(07-03): add banking info transfer to section in payment zone`
- [x] `grep -c "TRANSFER TO\|BANKING INFO"` returns 2
- [x] `grep -n "UAT gap fix"` returns line 729
- [x] 109 tests pass with no regressions
- [x] No `text-stamp` class in new markup (pre-existing occurrences at lines 268, 310 in EXPIRED stamp components are unrelated)

---
*Phase: 07-claiming-payment-ux*
*Completed: 2026-06-04*
