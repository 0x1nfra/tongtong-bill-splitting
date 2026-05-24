---
phase: 02-item-claiming
plan: "02"
subsystem: shared-lib
tags: [calculatePersonTotals, tdd, math, bill-split, proportional]
dependency_graph:
  requires:
    - src/lib/calculateTotals.ts (calculateTotals — existing export)
  provides:
    - calculatePersonTotals function exported from src/lib/calculateTotals.ts
  affects:
    - src/app/c/[billId]/page.tsx (member view will use calculatePersonTotals)
tech_stack:
  added: []
  patterns:
    - TDD RED/GREEN cycle (failing tests committed before implementation)
    - proportional distribution from bill-level totals (not recalculated percentages)
    - division-by-zero guard at top of function
    - Map-based O(1) item lookup and claimant count accumulation
key_files:
  created:
    - src/test/calculatePersonTotals.test.ts
  modified:
    - src/lib/calculateTotals.ts
    - vitest.config.ts
decisions:
  - "vitest.config.ts updated to resolve @ alias to worktree src/ — allows tests to run against worktree implementation via main repo node_modules"
  - "service charge and SST distributed from billTotals.serviceChargeCents/sstCents directly — never recalculate from % — preserves Malaysian SC-before-SST convention already encoded in calculateTotals"
  - "Math.round applied per-item (not on aggregate) to match plan spec for three-way splits"
metrics:
  duration_minutes: 8
  completed_date: "2026-05-24T22:19:00Z"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 3
---

# Phase 2 Plan 02: calculatePersonTotals TDD Summary

**One-liner:** calculatePersonTotals pure function implementing per-member proportional bill split with Math.round-per-item subtotal and proportional SC/SST distribution from billTotals, added to src/lib/calculateTotals.ts via TDD.

## What Was Built

Added `calculatePersonTotals` to `src/lib/calculateTotals.ts` using a strict TDD RED/GREEN cycle:

**RED phase (commit c2ac922):** Created `src/test/calculatePersonTotals.test.ts` with 18 behavioral tests covering all plan-specified scenarios. All 18 tests failed before implementation — confirmed `calculatePersonTotals is not a function`.

**GREEN phase (commit 3b3ec3b):** Implemented `calculatePersonTotals` — all 18 tests pass, no regressions.

### calculatePersonTotals Algorithm

1. **Division-by-zero guard** — returns all zeros if `billTotals.subtotalCents === 0`
2. **Build `claimantsPerItem` Map** — count how many claim records reference each itemId
3. **Build `itemMap` Map** — O(1) price/quantity lookup by item._id
4. **Filter and accumulate** — for each of the target session's claims, add `Math.round(price * qty / claimantCount)`
5. **Proportional charge distribution** — `ratio = personSubtotalCents / billTotals.subtotalCents`, then `Math.round(ratio * billTotals.serviceChargeCents)` and `Math.round(ratio * billTotals.sstCents)`
6. **Return integer totals** — `personTotalCents = personSubtotalCents + personServiceChargeCents + personSSTCents`

### Key correctness properties

- Uses `billTotals.serviceChargeCents` and `billTotals.sstCents` directly — never recalculates from 10%/6% — preserving the Malaysian SC-before-SST convention from `calculateTotals`
- `Math.round` applied per item, not on the aggregate, matching the plan spec for three-way splits
- All four output values are integers

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| RED | Write failing calculatePersonTotals tests | c2ac922 | src/test/calculatePersonTotals.test.ts, vitest.config.ts |
| GREEN | Implement calculatePersonTotals | 3b3ec3b | src/lib/calculateTotals.ts |

## Test Coverage (18 tests, 9 describe blocks)

| Scenario | Tests | Result |
|----------|-------|--------|
| Single claimer per item | 2 | PASS |
| Multi-claimer split | 3 | PASS |
| Service charge proportional | 2 | PASS |
| SST proportional | 2 | PASS |
| Both SC and SST | 2 | PASS |
| Zero billSubtotal guard | 2 | PASS |
| Session with no claims | 2 | PASS |
| Unclaimed items excluded | 2 | PASS |
| Alice + bob sum tolerance | 1 | PASS |

## Verification Results

- `pnpm test` (worktree, all 93 tests): PASS
- `calculatePersonTotals` exported from `src/lib/calculateTotals.ts`: confirmed
- All four output values pass `Number.isInteger` checks: confirmed
- Existing `calculateTotals` tests unaffected: confirmed (no regression)
- Plan spec values (alice: 2500 subtotal, 250 SC, 165 SST, 2915 total): confirmed in test

## TDD Gate Compliance

- RED gate: commit `c2ac922` — `test(02-02): add failing tests for calculatePersonTotals` (18 failing tests)
- GREEN gate: commit `3b3ec3b` — `feat(02-02): implement calculatePersonTotals in calculateTotals.ts` (18 passing tests)
- REFACTOR: not needed — implementation is clean, no code smell

## Deviations from Plan

**1. [Rule 3 - Blocking] Updated vitest.config.ts @ alias to worktree src/**
- **Found during:** RED phase — tests would import from main repo src/ when running via main repo node_modules
- **Fix:** Updated `vitest.config.ts` in the worktree to resolve `@` to the worktree's own `src/` directory
- **Files modified:** `vitest.config.ts`
- **Commit:** `c2ac922` (included with RED commit)

## Known Stubs

None — calculatePersonTotals is a pure function with no stubs or placeholders.

## Threat Flags

No new security surface introduced. All STRIDE mitigations applied:
- T-02-07 (division by zero): mitigated — guard at top of function returns all zeros when billSubtotalCents === 0

## Self-Check: PASSED

- src/test/calculatePersonTotals.test.ts exists in worktree
- src/lib/calculateTotals.ts exports calculatePersonTotals
- Commits c2ac922 (RED) and 3b3ec3b (GREEN) exist in git log
- All 18 tests pass; no regressions (93/93 worktree tests pass)
- No files unexpectedly deleted
