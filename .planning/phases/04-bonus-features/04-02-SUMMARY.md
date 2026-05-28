---
phase: 04-bonus-features
plan: 02
subsystem: convex-backend
tags: [cron, archive, freeze-guard, internalMutation, wave-1]
dependency_graph:
  requires: [04-01]
  provides: [archiveStale, bill-freeze-guard]
  affects: [04-03-PLAN, 04-04-PLAN]
tech_stack:
  added: []
  patterns: [internalMutation, cronJobs, JS-side-filter, freeze-guard]
key_files:
  created:
    - convex/crons.ts
  modified:
    - convex/bills.ts
    - convex/payments.ts
decisions:
  - "archiveStale declared as internalMutation — not mutation — so external callers cannot trigger archival (T-04-03 mitigated)"
  - "JS-side filter used in archiveStale (collect all then filter) to avoid Convex undefined optional field edge cases (Pitfall 1)"
  - "unclaimItem adds an explicit bill fetch to support freeze check — this mutation did not previously access the bill"
metrics:
  duration: 120s
  completed: "2026-05-28"
  tasks_completed: 2
  files_created: 1
  files_modified: 2
---

# Phase 4 Plan 02: Bill Archive Backend Summary

Daily cron job with `archiveStale` internalMutation (30-day window) and six write-mutation freeze checks — all writes to archived bills throw "Bill is archived".

## What Was Built

| Component | Description |
|-----------|-------------|
| `convex/crons.ts` | New file — daily cron at 02:00 UTC targeting `internal.bills.archiveStale` |
| `archiveStale` internalMutation | Patches bills older than 30 days with `archivedAt: Date.now()`; uses JS-side filter |
| Freeze guards (3 × bills.ts) | claimItem, unclaimItem, setBillReceipt — all throw "Bill is archived" |
| Freeze guards (3 × payments.ts) | markPaid, confirmPayment, rejectPayment — all throw "Bill is archived" |

## Task Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create convex/crons.ts + archiveStale internalMutation | 8b859c8 | convex/crons.ts, convex/bills.ts |
| 2 | Add freeze checks to all write mutations | 1cd4cbb | convex/bills.ts, convex/payments.ts |

## Deviations from Plan

None — plan executed exactly as written.

## Threat Mitigations Applied

| Threat ID | Status |
|-----------|--------|
| T-04-03 (Elevation of Privilege — archiveStale callable externally) | Mitigated — `internalMutation` prevents external invocation |
| T-04-W1-01 (Tampering — writes to archived bills) | Mitigated — all six write mutations check `bill.archivedAt !== undefined` before any DB write |

## Known Stubs

None — this plan is fully wired. The cron job and freeze guards are complete backend implementations. Frontend error handling for "Bill is archived" is out of scope for this plan but the error string is documented for frontend plans.

## Verification Performed

```
grep -c "Bill is archived" convex/bills.ts   → 3 ✓
grep -c "Bill is archived" convex/payments.ts → 3 ✓
grep -n "internalMutation" convex/bills.ts    → line 1 (import) + line 295 (export) ✓
grep -n "crons.daily" convex/crons.ts         → line 6 ✓
pnpm vitest run src/test/archiveStale.test.ts → 6 passed ✓
pnpm test (full suite)                        → same 4 pre-existing failures, no regressions ✓
```

## Threat Flags

None — no new network endpoints, auth paths, or schema changes. archiveStale is internal-only.

## Self-Check: PASSED

- [x] convex/crons.ts exists with `crons.daily("archive stale bills"` and `internal.bills.archiveStale`
- [x] convex/crons.ts exports default crons instance
- [x] convex/bills.ts line 1 import includes `internalMutation`
- [x] convex/bills.ts contains `export const archiveStale = internalMutation(`
- [x] archiveStale uses JS-filter `!b.archivedAt && b._creationTime < thirtyDaysAgo`
- [x] claimItem has `if (bill.archivedAt !== undefined) throw new Error("Bill is archived")`
- [x] unclaimItem fetches bill via `ctx.db.get(claim.billId)` and checks archivedAt
- [x] setBillReceipt has freeze check after unauthorized guard
- [x] markPaid has freeze check after bill-not-found guard
- [x] confirmPayment has freeze check after secret verification guard
- [x] rejectPayment has freeze check after secret verification guard
- [x] Commits 8b859c8 and 1cd4cbb verified in git log
- [x] Full test suite: same pre-existing failures only (SignIn, archivedBill RED stubs + landingPage)
