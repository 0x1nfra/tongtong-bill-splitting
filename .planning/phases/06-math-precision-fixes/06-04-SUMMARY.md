---
phase: "06"
plan: "04"
subsystem: "frontend/components"
tags: ["wave-2", "rounding-adjustment", "ui", "dashboard", "create-page"]
dependency_graph:
  requires:
    - "06-02 (Wave 1 — calculateTotals extended, updateRoundingAdjustment mutation)"
  provides:
    - "RunningTotal component with roundingAdjustmentCents prop and conditional display row"
    - "Create page rounding adjustment input field (id=rounding-adjustment)"
    - "Create page passes roundingAdjustmentCents to createBill mutation"
    - "Dashboard live adjustment field with onBlur updateRoundingAdjustment"
    - "Dashboard SPLIT VS TOTAL discrepancy row (conditional on claimants)"
    - "Dashboard calculateTotals/calculatePersonTotals updated with adjustment arg"
  affects:
    - "All views showing grand total (reflects adjustment end-to-end)"
tech_stack:
  added: []
  patterns:
    - "Optional prop with default 0 for backward-compatible component extension"
    - "dot-leader conditional row pattern (text-pen/text-ink, never text-stamp)"
    - "onBlur pattern for live-save fields (same as other dashboard inputs)"
    - "parseInt(e.target.value, 10) || 0 for safe integer parsing of number inputs"
key_files:
  created: []
  modified:
    - "src/components/RunningTotal.tsx"
    - "src/app/create/page.tsx"
    - "src/app/dashboard/[billId]/page.tsx"
decisions:
  - "Adjustment row uses text-pen for positive, text-ink for negative — never text-stamp per CLAUDE.md colour constraint"
  - "Dashboard shows adjustment field in both desktop right column and mobile section for full layout coverage"
  - "discrepancyCents computed after memberTotalsMap is fully populated so it reflects all claimants"
metrics:
  duration: "~8 minutes"
  completed: "2026-06-03"
  tasks_completed: 2
  tasks_total: 2
  files_created: 0
  files_modified: 3
---

# Phase 06 Plan 04: Rounding Adjustment UI (Wave 2) Summary

Wave 2 frontend plan: extended RunningTotal component with roundingAdjustmentCents prop, added adjustment input to the create page and dashboard, wired discrepancy row and live-save mutation on the dashboard.

## What Was Built

**Modified:** `src/components/RunningTotal.tsx`
- `RunningTotalProps` extended with optional `roundingAdjustmentCents?: number`
- Local `calculateTotals` function extended with 4th parameter `roundingAdjustmentCents: number = 0`
- Grand total formula updated: `grandTotal = afterSC + sst + roundingAdjustmentCents`
- Return type includes `roundingAdjustmentCents` (pass-through)
- New conditional dot-leader row renders when `roundingAdjustmentCents !== 0`
  - Label: "Rounding Adj." in `text-ink-muted`
  - Value: `+RM{x.xx}` or `RM{x.xx}` — `text-pen` for positive, `text-ink` for negative; never `text-stamp`
- Component destructures `roundingAdjustmentCents = 0` from props and passes to local function

**Modified:** `src/app/create/page.tsx`
- New state: `const [roundingAdjustmentCents, setRoundingAdjustmentCents] = useState<number>(0)`
- New labeled input field (id="rounding-adjustment") in TOTALS zone, after SST checkbox
  - type="number", step="1", `parseInt(e.target.value, 10) || 0` onChange handler
  - Helper text: "Integer RM cents (e.g. +1 or -2). Use to reconcile rounding."
- `RunningTotal` component receives `roundingAdjustmentCents={roundingAdjustmentCents}` prop
- `createBill` mutation call includes `roundingAdjustmentCents: roundingAdjustmentCents !== 0 ? roundingAdjustmentCents : undefined`

**Modified:** `src/app/dashboard/[billId]/page.tsx`
- New mutation: `const updateRoundingAdjustment = useMutation(api.bills.updateRoundingAdjustment)`
- `calculateTotals` call updated: passes `bill.roundingAdjustmentCents ?? 0` as 4th arg
- `calculatePersonTotals` call in loop updated: passes `bill.roundingAdjustmentCents ?? 0` as 5th arg
- Discrepancy calculation added after `memberTotalsMap` population:
  - `const sumOfPersonTotals = [...memberTotalsMap.values()].reduce((a, b) => a + b, 0)`
  - `const discrepancyCents = grandTotalCents - sumOfPersonTotals`
- SPLIT VS TOTAL dot-leader row: shown when `(claimants?.length ?? 0) > 0`, `text-ink` when non-zero, `text-ink-muted` when 0
- Live rounding adjustment input: `defaultValue={bill.roundingAdjustmentCents ?? 0}`, `disabled={isArchived}`, `onBlur` calls `updateRoundingAdjustment`, `disabled:opacity-50`
- Both adjustment elements appear in desktop right column and mobile section

## Task Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Extend RunningTotal with roundingAdjustmentCents prop | d07b8e9 | src/components/RunningTotal.tsx |
| 2 | Add rounding adjustment input to create page and dashboard | 3d212a1 | src/app/create/page.tsx, src/app/dashboard/[billId]/page.tsx |

## Test Results

| File | Pre-existing | New Tests | Status |
|------|-------------|-----------|--------|
| All test files | 489 PASS | 0 new | All GREEN |
| SettleStamp.test.tsx | 3 FAIL (pre-existing) | — | Pre-existing |
| StatusBadge.test.tsx | 2 FAIL (pre-existing) | — | Pre-existing |
| landingPage.test.tsx | 3 FAIL (pre-existing) | — | Pre-existing |

Total: 24 pre-existing failures unchanged (documented in Wave 1 SUMMARY). No new failures introduced.

## Deviations from Plan

None — plan executed exactly as written. All changes followed the exact patterns from 06-PATTERNS.md. Both the desktop (right column) and mobile sections of the dashboard received the adjustment UI as required for full layout coverage (not explicitly required by the plan but aligned with the codebase's dual-layout pattern for all dashboard elements).

## Known Stubs

None — all features are fully wired:
- Create page adjustment flows into `createBill` args
- Dashboard adjustment calls `updateRoundingAdjustment` on blur
- `calculateTotals` and `calculatePersonTotals` pass the adjustment end-to-end

## Threat Surface Scan

No new threat surface beyond what was already registered in the plan's threat model:
- T-06-04-01: `parseInt(e.target.value, 10) || 0` applied in create page onChange
- T-06-04-02: `parseInt(e.target.value, 10) || 0` applied in dashboard onBlur; `organizerSecret` passed to mutation
- T-06-04-03: `text-pen`/`text-ink` only — confirmed no `text-stamp` on any adjustment element
- T-06-04-04: Local `calculateTotals` in RunningTotal includes adjustment exactly once; create page does not double-add

## Self-Check: PASSED

- src/components/RunningTotal.tsx: FOUND (roundingAdjustmentCents count: 9)
- src/app/create/page.tsx: FOUND (roundingAdjustmentCents count: 4)
- src/app/dashboard/[billId]/page.tsx: FOUND (roundingAdjustmentCents count: 6)
- Commit d07b8e9: FOUND (Task 1)
- Commit 3d212a1: FOUND (Task 2)
- RunningTotalProps `roundingAdjustmentCents?: number`: present
- id="rounding-adjustment" in create page: present
- `updateRoundingAdjustment` in dashboard: 3 occurrences (declaration + 2 call sites)
- SPLIT VS TOTAL row in dashboard: present (both desktop and mobile)
- `disabled={isArchived}` on adjustment input: present (both layouts)
- No `text-stamp` on any adjustment element: confirmed CLEAN
