---
phase: 04-bonus-features
plan: "05"
subsystem: dashboard-people-tab
tags: [dashboard, claims, member-view, ux]
dependency_graph:
  requires: [04-04]
  provides: [DASH-03]
  affects: [src/components/MemberRow.tsx, src/app/dashboard/[billId]/page.tsx, src/app/c/[billId]/page.tsx, src/components/DemoChit.tsx, convex/bills.ts]
tech_stack:
  added: []
  patterns: [convex-query, react-usestate-toggle, derived-member-status]
key_files:
  created: []
  modified:
    - convex/bills.ts
    - src/components/MemberRow.tsx
    - src/app/dashboard/[billId]/page.tsx
    - src/app/c/[billId]/page.tsx
    - src/components/DemoChit.tsx
decisions:
  - "memberCount derives from claimants.length (not payments.length) so split estimate updates as members claim"
  - "PEOPLE tab empty-state keyed to claimants.length === 0; payment-zero state removed"
  - "getRotation and rotationDeg removed as dead code after transform removal"
metrics:
  duration: "~25 minutes"
  completed: "2026-05-29"
  tasks_completed: 4
  tasks_total: 4
---

# Phase 4 Plan 05: Dashboard PEOPLE tab from claims + remove card rotations Summary

Populated the dashboard PEOPLE tab from claims data (any item claim, not just payment submission) with a collapsible items toggle per member, and removed all CSS rotation transforms from chit cards while preserving rubber stamp tilts.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add getClaimantsForBill Convex query | 017fca0 | convex/bills.ts |
| 2 | Extend MemberRow with collapsible claimed items | f900ae1 | src/components/MemberRow.tsx |
| 3 | Wire dashboard PEOPLE tab to getClaimantsForBill | 6b41e14 | src/app/dashboard/[billId]/page.tsx |
| 4 | Remove slanted card rotations | ff7bd01 | src/app/c/[billId]/page.tsx, src/components/DemoChit.tsx |

## What Was Built

### getClaimantsForBill (convex/bills.ts)
Organizer-authenticated query that groups claims by `claimantSession`, resolves item details, and resolves the highest-priority payment per session (settled > pending > rejected). Returns an array sorted by `firstClaimAt` ascending. Returns `null` on auth failure, `[]` when no claims exist.

### MemberRow extended (src/components/MemberRow.tsx)
Added optional `claimedItems` prop (`ReadonlyArray<{ name, price, quantity }>`). When non-empty, renders an "ITEMS (N) ▾/▴" toggle button that expands/collapses a list of `{name} × {quantity} — RM{total}` rows. No visual change when `claimedItems` is omitted — fully backward compatible.

### Dashboard PEOPLE tab (src/app/dashboard/[billId]/page.tsx)
- Added `claimants` useQuery subscription via `api.bills.getClaimantsForBill`
- `memberCount` now derives from `claimants?.length` (updates on first claim, not first payment)
- PEOPLE block replaced: empty state shows when `claimants.length === 0`; non-empty maps over `claimants` array with `claimedItems` passed to MemberRow; `onConfirm`/`onReject` only wired when `claimant.payment` is non-null and status is AWAITING; `onRemind` wired for CLAIMED — UNPAID
- `payments` query kept intact for StatsBar, `confirmed`/`awaiting`/`rejected` stats, and `collectedCents`

### Card rotation removal (src/app/c/[billId]/page.tsx, src/components/DemoChit.tsx)
- Removed `style={{ transform: \`rotate(${rotationDeg}deg)\` }}` from items chit card div
- Removed `style={{ display: "inline-block", transform: \`rotate(${getRotation(claim._id)}deg)\`, marginRight: "4px" }}` from claimant name spans
- Removed dead `getRotation` function and `rotationDeg` variable
- Removed `style={{ transform: "rotate(1.5deg)" }}` from DemoChit outer card div
- Preserved: EXPIRED stamp `rotate(-6deg)` at both error states in c/[billId]/page.tsx
- Preserved: SETTLE stamp `rotate(-6deg) + filter: url(#ink-bleed)` in DemoChit.tsx

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. All PEOPLE tab data is wired to live Convex claimants data.

## Threat Flags

None. No new trust boundaries introduced. `getClaimantsForBill` follows the same `organizerSecret` auth pattern as all existing organizer queries.

## Self-Check: PASSED

- [x] convex/bills.ts contains `export const getClaimantsForBill`
- [x] src/components/MemberRow.tsx has `claimedItems` prop and `useState` toggle
- [x] src/app/dashboard/[billId]/page.tsx has `claimants` useQuery and updated PEOPLE block
- [x] src/app/c/[billId]/page.tsx: no `getRotation`/`rotationDeg` references
- [x] src/components/DemoChit.tsx: no `rotate(1.5deg)`, SETTLE stamp `rotate(-6deg)` present
- [x] `pnpm tsc --noEmit` exits 0
- [x] All 4 task commits exist: 017fca0, f900ae1, 6b41e14, ff7bd01
