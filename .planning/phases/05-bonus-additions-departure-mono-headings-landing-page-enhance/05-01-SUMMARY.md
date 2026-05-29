---
phase: 05-bonus-additions-departure-mono-headings-landing-page-enhance
plan: 01
subsystem: testing
tags: [vitest, testing-library, react, tdd, red-stubs]

# Dependency graph
requires: []
provides:
  - Fixed landing page logotype tests (SVG role='img' instead of h1 heading query)
  - 4 RED stubs for Phase 5 benefits + how-it-works sections
  - 6 passing updateQR boundary tests (isAuthorized + isArchived predicates)
affects: [05-02, 05-03, 05-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pure predicate boundary tests defined inline in test file (archiveStale.test.ts pattern)"
    - "RED stubs added before implementation — Nyquist compliance"

key-files:
  created:
    - src/test/updateQR.test.ts
  modified:
    - src/test/landingPage.test.tsx

key-decisions:
  - "RED stubs intentionally fail — implementation comes in Wave 1 Plan B"
  - "updateQR tests use inline pure predicates (no Convex runtime dependency)"

patterns-established:
  - "updateQR boundary test pattern: inline isAuthorized + isArchived predicates matching archiveStale.test.ts"

requirements-completed: []

# Metrics
duration: 8min
completed: 2026-05-30
---

# Phase 5 Plan 01: Wave 0 Test Stubs Summary

**Fixed 2 broken SVG logotype tests + added 4 RED stubs for landing page sections + 6 passing updateQR boundary tests**

## Performance

- **Duration:** 8 min
- **Started:** 2026-05-30T00:03:00Z
- **Completed:** 2026-05-30T00:11:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Fixed broken logotype tests: replaced `getByRole('heading', {level:1})` and `h1/span` queries with correct SVG role='img' and `tspan[fill="#B91C1C"]` queries matching actual DOM
- Added 4 RED stubs in new Phase 5 describe block for benefits section, how-it-works steps, and DOM order assertions
- Created `updateQR.test.ts` with 6 passing boundary tests using inline pure predicates (isAuthorized + isArchived), following archiveStale.test.ts pattern

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix broken logotype tests + add RED landing page stubs** - `fcce15c` (test)
2. **Task 2: Create updateQR.test.ts with RED boundary stubs** - `96d2f34` (test)

**Plan metadata:** (committed with SUMMARY)

## Files Created/Modified
- `src/test/landingPage.test.tsx` - Fixed 2 broken tests; added 4 RED stubs for Phase 5 describe block
- `src/test/updateQR.test.ts` - New file: 6 boundary tests for updateQR auth + archive-freeze predicates

## Decisions Made
- updateQR tests follow archiveStale.test.ts pattern: inline pure predicates, no Convex runtime import
- RED stubs intentionally fail on current page.tsx (no benefits/how-it-works sections yet) — Wave 1 Plan B adds implementation

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
The test runner at the main repo level picks up both the main repo's `src/test/landingPage.test.tsx` (with 2 pre-existing failures) and the worktree's copy. The 2 pre-existing failures are from the un-modified main repo file and are not caused by this plan's changes. The worktree's file has the correct fixed tests.

## Known Stubs
The 4 RED stubs in `Landing page — benefits and how-it-works sections (Phase 5)` describe block intentionally fail:
- `benefits section renders 3 benefit rows` - No /No more chasing/, /See your exact share/, /DuitNow QR/ in current page.tsx
- `how-it-works section renders 3 numbered steps` - No 01./02./03. in current page.tsx
- `DemoChit appears before benefits section in DOM order` - No WHY TONGTONG section in current page.tsx
- `START NEW BILL CTA appears after how-it-works in DOM order` - No HOW IT WORKS section in current page.tsx

These are resolved by Wave 1 Plan B (05-02) implementation.

## Self-Check: PASSED
- FOUND: src/test/landingPage.test.tsx (worktree path)
- FOUND: src/test/updateQR.test.ts (worktree path)
- FOUND: 05-01-SUMMARY.md (worktree path)
- FOUND commits: fcce15c, 96d2f34

## Next Phase Readiness
- Wave 0 test stubs complete — Wave 1 plans (05-02 through 05-04) can proceed
- updateQR boundary tests provide contract specification for Wave 1 backend implementation
- Landing page RED stubs will turn green after Plan B adds benefits + how-it-works sections

---
*Phase: 05-bonus-additions-departure-mono-headings-landing-page-enhance*
*Completed: 2026-05-30*
