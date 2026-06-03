---
phase: "06"
plan: "01"
subsystem: "testing"
tags: ["tdd", "red-phase", "wave-0", "math-precision"]
dependency_graph:
  requires: []
  provides:
    - "RED test stubs for rounding adjustment distribution in calculatePersonTotals"
    - "RED test stubs for grand total formula with rounding adjustment in calculateTotals"
    - "Pure predicate tests for updateRoundingAdjustment auth/archive/integer/quantity/name/claimedCount"
  affects:
    - "src/lib/calculateTotals.ts (Wave 1 implementation target)"
    - "convex/bills.ts (Wave 1 implementation target)"
tech_stack:
  added: []
  patterns:
    - "Pure-predicate test pattern (from updateQR.test.ts)"
    - "Append-only describe block extension pattern for existing test files"
key_files:
  created:
    - "src/test/updateRoundingAdjustment.test.ts"
  modified:
    - "src/test/calculatePersonTotals.test.ts"
    - "src/test/calculateTotalsLib.test.ts"
decisions:
  - "Pure predicates for updateRoundingAdjustment tests allow full pass at Wave 0 without any lib dependency"
  - "RED tests written against future function signatures — they document the contract before implementation"
  - "zeroBillTotals in T-ADJ-05 includes roundingAdjustmentCents field to match extended return type"
metrics:
  duration: "~5 minutes"
  completed: "2026-06-03"
  tasks_completed: 3
  tasks_total: 3
  files_created: 1
  files_modified: 2
---

# Phase 06 Plan 01: RED Test Stubs (Wave 0) Summary

Wave 0 TDD RED phase: 3 test files created/extended with failing stubs that document contracts for Phase 6 implementations.

## What Was Built

**New file:** `src/test/updateRoundingAdjustment.test.ts` — 6 describe blocks, 21 it() cases testing pure predicate functions for auth, archive freeze, integer validation, quantity validation, claimant name validation, and claimedCount semantics. All 21 tests pass (pure predicates have inline implementations).

**Extended:** `src/test/calculatePersonTotals.test.ts` — 7 new RED cases in `describe('calculatePersonTotals — rounding adjustment distribution')` covering T-ADJ-01 through T-ADJ-07. All 7 fail because `calculatePersonTotals` doesn't yet accept a 5th parameter or return `personRoundingAdjustmentCents`.

**Extended:** `src/test/calculateTotalsLib.test.ts` — 5 new RED cases in `describe('calculateTotals — rounding adjustment')` covering T-CALC-ADJ-01 through T-CALC-ADJ-05. All 5 fail because `calculateTotals` doesn't yet accept a 4th parameter.

## Task Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create updateRoundingAdjustment.test.ts | ec5755b | src/test/updateRoundingAdjustment.test.ts (created) |
| 2 | Extend calculatePersonTotals.test.ts | 1537384 | src/test/calculatePersonTotals.test.ts (modified) |
| 3 | Extend calculateTotalsLib.test.ts | ed36c70 | src/test/calculateTotalsLib.test.ts (modified) |

## Test Results After Wave 0

| File | Pre-existing | New RED | Status |
|------|-------------|---------|--------|
| updateRoundingAdjustment.test.ts | — | 21 PASS | GREEN (pure predicates) |
| calculatePersonTotals.test.ts | 20 PASS | 7 FAIL | Correct RED state |
| calculateTotalsLib.test.ts | 13 PASS | 5 FAIL | Correct RED state |

Total: 54 tests passing, 12 tests failing (correct RED state for Wave 0).

## Deviations from Plan

None — plan executed exactly as written. All tests are in the expected state:
- updateRoundingAdjustment.test.ts: all 21 pass (pure predicates)
- calculatePersonTotals.test.ts: 20 existing pass, 7 new fail
- calculateTotalsLib.test.ts: 13 existing pass, 5 new fail

## TDD Gate Compliance

Wave 0 is purely RED phase. All gate commits are `test(...)` type:
- `test(06-01): add updateRoundingAdjustment pure-predicate tests` — ec5755b
- `test(06-01): extend calculatePersonTotals with RED rounding adjustment cases` — 1537384
- `test(06-01): extend calculateTotalsLib with RED grand total formula cases` — ed36c70

GREEN gate commits will appear in Wave 1 (06-02 implementation plan).

## Known Stubs

None — this plan adds only test files. No production code stubs introduced.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes. This plan modifies/creates test files only.

## Self-Check: PASSED

- src/test/updateRoundingAdjustment.test.ts: FOUND
- src/test/calculatePersonTotals.test.ts: FOUND (modified)
- src/test/calculateTotalsLib.test.ts: FOUND (modified)
- Commit ec5755b: FOUND
- Commit 1537384: FOUND
- Commit ed36c70: FOUND
- Pre-existing tests: 33 pass (unchanged)
- New RED tests: 12 fail (correct state)
