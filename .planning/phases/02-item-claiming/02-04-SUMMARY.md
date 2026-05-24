---
phase: 02-item-claiming
plan: "04"
subsystem: dashboard-frontend
tags: [claims, stats, dashboard, realtime, convex-query]
dependency_graph:
  requires:
    - convex/bills.ts getClaimsForBill query (provided by 02-01)
    - src/components/StatsBar.tsx (confirmed: props confirmed/awaiting/claimed/unclaimed)
  provides:
    - Dashboard CLAIMED/UNCLAIMED stats wired to real getClaimsForBill subscription
  affects:
    - src/app/dashboard/[billId]/page.tsx (wires claimsStats to StatsBar)
tech_stack:
  added: []
  patterns:
    - skip-until-loaded useQuery pattern (organizerSecret ? {...} : "skip")
    - nullish coalescing guard (claimsStats?.claimedCount ?? 0)
key_files:
  created: []
  modified:
    - src/app/dashboard/[billId]/page.tsx
decisions:
  - "claimsStats query follows the identical skip pattern used by billData and payments — consistent auth guard across all three subscriptions"
  - "void rejected kept (not removed) — it is tracked for future StatsBar extension; removing is premature since Phase 3 may surface it"
metrics:
  duration_minutes: 2
  completed_date: "2026-05-24T14:16:31Z"
  tasks_completed: 1
  tasks_total: 1
  files_modified: 1
---

# Phase 2 Plan 04: Dashboard CLAIMED/UNCLAIMED Wiring Summary

**One-liner:** Wired getClaimsForBill Convex subscription to StatsBar in the organizer dashboard, replacing hardcoded zero counts with real-time claimedCount/unclaimedCount values guarded by the skip-until-loaded pattern.

## What Was Built

Added one new `useQuery` subscription and replaced two hardcoded values in `src/app/dashboard/[billId]/page.tsx`:

1. **`getClaimsForBill` subscription** — follows the identical skip pattern used by `billData` and `payments`: `organizerSecret ? { billId, organizerSecret } : "skip"`. The query is never called until `organizerSecret` is loaded from localStorage, preventing unauthenticated Convex requests (T-02-13 mitigation).

2. **Replaced hardcoded stats** — `const unclaimed = 0` (with Phase 1 comment) replaced by two real-data derivations:
   - `const claimed = claimsStats?.claimedCount ?? 0`
   - `const unclaimed = claimsStats?.unclaimedCount ?? 0`
   Both use `?? 0` so the dashboard renders correctly during loading or when `claimsStats` is null (auth mismatch returns null per WR-06).

3. **Updated StatsBar JSX** — `claimed={0}` changed to `claimed={claimed}` so StatsBar receives the live count.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add getClaimsForBill subscription and wire StatsBar claimed/unclaimed | 438fd38 | src/app/dashboard/[billId]/page.tsx |

## Verification Results

- `grep -c "api.bills.getClaimsForBill" src/app/dashboard/[billId]/page.tsx` → 1
- `grep -c "claimsStats" src/app/dashboard/[billId]/page.tsx` → 3 (subscription, claimed derivation, unclaimed derivation)
- `grep "claimed={0}" src/app/dashboard/[billId]/page.tsx` → 0 matches (hardcoded value gone)
- `grep "organizerSecret.*skip" src/app/dashboard/[billId]/page.tsx` → 2 matches (payments + claimsStats both guarded)
- ESLint: 2 pre-existing errors on lines 26 and 30 (setState in useEffect — in the localStorage and shareUrl effects). These existed before this plan. No new errors introduced.

## Deviations from Plan

None — plan executed exactly as written. The two targeted changes (new subscription + replaced stats variables + StatsBar prop) were applied without restructuring any other code.

## Known Stubs

None — both CLAIMED and UNCLAIMED counts are now live from the Convex `getClaimsForBill` subscription.

## Threat Flags

No new security surface. The trust boundary (Browser → Convex getClaimsForBill) was already planned with T-02-13 mitigation (organizerSecret verified server-side; null returned on mismatch). The skip pattern on the client side is a defense-in-depth layer consistent with the other subscriptions.

## Self-Check: PASSED

- src/app/dashboard/[billId]/page.tsx exists and contains `api.bills.getClaimsForBill`
- Commit 438fd38 exists in git log
- No files deleted
- No modifications to STATE.md or ROADMAP.md
