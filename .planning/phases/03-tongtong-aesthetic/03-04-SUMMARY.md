---
phase: 03-tongtong-aesthetic
plan: "04"
subsystem: ui
tags: [chit-aesthetic, bill-builder, dashboard, BillSummaryCard, skeleton-loading, empty-state]
dependency_graph:
  requires: [03-02, 03-03]
  provides: [create-chit-panels, dashboard-chit-panels, BillSummaryCard-chit-class]
  affects: [src/app/create/page.tsx, src/app/dashboard/[billId]/page.tsx, src/components/BillSummaryCard.tsx]
tech_stack:
  added: []
  patterns: [chit-panel-wrapper, perforation-divider, skeleton-animate-pulse, dot-leader-total-row]
key_files:
  created: []
  modified:
    - src/app/create/page.tsx
    - src/app/dashboard/[billId]/page.tsx
    - src/components/BillSummaryCard.tsx
decisions:
  - Skeleton chit cards (animate-pulse) used for both loading guards in dashboard instead of text
  - NOTHING HERE YET empty state in .chit panel replaces dashed-border NO ONE'S JOINED YET div
  - dot-leader applied to grand total row in BillSummaryCard (not to entire card)
  - Perforation dividers placed: stats-to-PEOPLE in left col, BillSummaryCard-to-QUICK ACTIONS in right col
metrics:
  duration: "1m 57s"
  completed_date: "2026-05-25T18:40:45Z"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 3
requirements_delivered: [UI-01, UI-03, UI-04, UI-06, UI-07, UI-09, UI-10, UI-11, UI-12]
---

# Phase 03 Plan 04: Chit Aesthetic — Bill Builder, Dashboard, BillSummaryCard Summary

**One-liner:** Chit panels, perforation dividers, skeleton loading states, and dot-leader total row applied to bill builder, dashboard, and BillSummaryCard — completing the visual language across all four organizer-facing screens.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Polish bill builder form and upgrade BillSummaryCard | 88f2572 | src/app/create/page.tsx, src/components/BillSummaryCard.tsx |
| 2 | Polish dashboard loading states, empty state, and panel wrappers | 852883c | src/app/dashboard/[billId]/page.tsx |

## What Was Built

### Task 1: Bill Builder + BillSummaryCard

**src/app/create/page.tsx:**
- Bill details fields (title, venue, date) wrapped in `.chit p-4 mb-4` panel
- Perforation divider (`div.perforation my-4`) inserted after bill details panel
- Items section (h2, item list, ADD ITEM button) wrapped in `.chit p-4 mb-4` panel
- Perforation divider inserted after items panel
- GENERATE LINK button: removed `rounded` class (chop/stamp aesthetic, UI-07)
- ADD ITEM button: removed `rounded` class
- Input fields: removed `rounded` class from all three inputs (title, venue, date)

**src/components/BillSummaryCard.tsx:**
- Container class changed from `bg-paper-chit rounded p-4` to `chit p-4`
- Grand total row class changed from `flex justify-between items-center` to `dot-leader items-center`

### Task 2: Dashboard

**src/app/dashboard/[billId]/page.tsx:**
- First loading guard (`organizerSecret === null`): replaced `LOADING...` paragraph with skeleton `.chit animate-pulse` card (4 placeholder bars)
- Second loading guard (`billData === undefined`): replaced `LOADING...` paragraph with identical skeleton `.chit animate-pulse` card
- Empty state: replaced dashed-border div (`NO ONE'S JOINED YET`) with `.chit p-6 text-center` panel (`NOTHING HERE YET`, share copy, COPY SHARE LINK button) per UI-11
- Left column: `.perforation my-4` divider added between StatsBar and PEOPLE heading
- Right column: `.perforation my-4` divider added between BillSummaryCard and QUICK ACTIONS heading
- 2-column desktop layout (`md:grid-cols-[60%_40%]`) preserved unchanged (UI-10)

## Verification Results

All 8 overall verification checks passed:
1. TypeScript (`pnpm exec tsc --noEmit`) — exit 0
2. `rounded` count in create/page.tsx — 0
3. `perforation` count in create/page.tsx — 2
4. `animate-pulse` count in dashboard — 2
5. `NOTHING HERE YET` count in dashboard — 1
6. `LOADING...` count in dashboard — 0
7. `bg-paper-chit rounded` count in BillSummaryCard — 0
8. `md:grid-cols-[60%_40%]` count in dashboard — 1

## Deviations from Plan

None — plan executed exactly as written.

Input `rounded` class was also present on the three form inputs inside the bill details section. Removed per Rule 3 (UI-07 chop aesthetic) as they are part of the same CHANGE 1 scope. All other logic preserved.

## Known Stubs

None. All UI changes wire to existing data flows; no hardcoded placeholders introduced.

## Threat Flags

None. Only CSS class changes applied; no new network endpoints, auth paths, or schema changes introduced.

## Self-Check: PASSED

Files exist:
- src/app/create/page.tsx: FOUND
- src/app/dashboard/[billId]/page.tsx: FOUND
- src/components/BillSummaryCard.tsx: FOUND

Commits exist:
- 88f2572: FOUND (feat(03-04): apply chit aesthetic to bill builder and BillSummaryCard)
- 852883c: FOUND (feat(03-04): apply chit aesthetic to dashboard)
