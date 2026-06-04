---
phase: 07-claiming-payment-ux
plan: 04
subsystem: frontend
tags: [dashboard, banking-info, useMutation, convex, blur-save]

# Dependency graph
requires:
  - phase: 07-02
    provides: updateBankingInfo mutation in convex/bills.ts with auth guard, archive freeze, and XSS sanitization
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - defaultValue (not value) with bill.fieldName ?? '' — no controlled state for text inputs
    - onBlur saves all 4 banking fields; changed field uses e.target.value.trim(), others read from bill object
    - empty string coerced to undefined (value || undefined) to clear field in DB

key-files:
  created: []
  modified:
    - src/app/dashboard/[billId]/page.tsx

key-decisions:
  - "Merged release/v1.2.0 into worktree (fast-forward) to get Phase 6 + Phase 7 Wave 1-2 changes before implementing"
  - "onBlur sends all 4 fields on every save — simpler than tracking which field changed; server handles undefined as clear"

requirements-completed: [CLAIM-BANK-DASH-01]

# Metrics
duration: 5min
completed: 2026-06-04
---

# Phase 07 Plan 04: Banking Info Dashboard Inputs Summary

**Added 4 banking info input fields (Bank Name, Account No., Account Holder, DuitNow ID) to both the desktop and mobile organizer dashboard panels — saves on blur via updateBankingInfo mutation with defaultValue pattern and no controlled state**

## Performance

- **Duration:** 5 min
- **Started:** 2026-06-04T12:29:00Z
- **Completed:** 2026-06-04T12:34:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Wired `useMutation(api.bills.updateBankingInfo)` in the dashboard component (line 70)
- Added 4 banking info text inputs to the **desktop right panel** after the Rounding Adjustment field
- Added the same 4 banking info text inputs to the **mobile quick actions section** after its Rounding Adjustment field
- Each input uses `defaultValue={bill.fieldName ?? ''}` — no controlled state
- Each `onBlur` handler trims the value (`e.target.value.trim()`) and calls `updateBankingInfo` with all 4 fields; blank input sends `undefined` to clear the field
- All inputs are `disabled={isArchived}` — read-only when bill is archived
- No `text-stamp` class anywhere in the new markup — label uses `text-ink-muted`
- All 186 tests run; 8 pre-existing failures (SettleStamp, StatusBadge, landingPage) unaffected

## Task Commits

1. **Task 1: Wire updateBankingInfo mutation and add banking info inputs to both dashboard panels** - `7b6a259` (feat)

## Files Created/Modified

- `src/app/dashboard/[billId]/page.tsx` — added `updateBankingInfo` useMutation hook + 4 banking info input fields in desktop right panel + 4 banking info input fields in mobile section (181 lines added)

## Decisions Made

- Merged `release/v1.2.0` into the worktree via fast-forward before making changes: worktree was based on commit `4abbc60` (pre-Phase 6), missing `updateRoundingAdjustment` and rounding adjustment UI that this plan needed to mirror. The merge brought in all Phase 6 and Phase 7 Wave 1-2 changes.
- `onBlur` sends all 4 banking fields simultaneously (not just the changed one). This avoids needing refs or controlled state to read sibling field values, and matches the server's `ctx.db.patch` semantics where all 4 fields can be undefined to clear them.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Merged release/v1.2.0 into worktree to get Phase 6 + Phase 7 Wave 1-2 changes**
- **Found during:** Task 1 setup
- **Issue:** Worktree was based on commit `4abbc60` (pre-Phase 6), missing `updateRoundingAdjustment` mutation, rounding adjustment UI in dashboard (the insertion anchor), and `updateBankingInfo` backend that this plan depends on
- **Fix:** Ran `git merge release/v1.2.0 --no-edit` (fast-forward). Brought in all Phase 6 commits + Phase 7 Wave 1-2 changes including `updateBankingInfo` mutation and schema fields
- **Files modified:** Fast-forward merge, no new merge commit; application files updated to latest state
- **Committed in:** Fast-forward merge (no separate merge commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Required to unblock implementation. No scope creep.

## Pre-existing Test Failures (out of scope)

The following test files fail in both the main repo and the worktree — they are pre-existing failures unrelated to this plan's changes:

- `src/test/SettleStamp.test.tsx` — 3 failures (UI component tests)
- `src/test/StatusBadge.test.tsx` — 2 failures (UI component tests)
- `src/test/landingPage.test.tsx` — 3 failures (Phase 5 landing page DOM order)

These are documented in 07-02-SUMMARY.md and are out of scope for this plan.

## Known Stubs

None — all 4 banking inputs are wired to real `updateBankingInfo` mutation and read from real `bill` object fields.

## Threat Flags

No new security-relevant surface beyond what the plan's threat model describes:
- T-07-06: client trims input with `e.target.value.trim()`; server-side XSS sanitization in `updateBankingInfo` (implemented in 07-02)
- T-07-07: banking fields are organizer-supplied and organizerSecret-gated at the server

## Self-Check: PASSED

- `src/app/dashboard/[billId]/page.tsx` — modified and committed
- Commit `7b6a259` verified in git log
- `grep -c "updateBankingInfo\|BANKING INFO" page.tsx` returns 11 (minimum 11 required)
- No unexpected file deletions in commit

---
*Phase: 07-claiming-payment-ux*
*Completed: 2026-06-04*
