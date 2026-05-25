---
phase: 03-tongtong-aesthetic
plan: "03"
subsystem: frontend/ui
tags: [member-view, chit-aesthetic, dot-leader, perforation, skeleton, expired-state, rotation]
dependency_graph:
  requires:
    - 03-01 (font vars + animation foundation)
  provides:
    - src/app/c/[billId]/page.tsx (fully styled member/claim view)
  affects:
    - All WhatsApp link recipients (highest-traffic screen)
tech_stack:
  added: []
  patterns:
    - .chit wrapper class applied to items section and YOUR PORTION panel
    - .dot-leader on item button rows and all YOUR PORTION rows
    - .rule-hairline hr between item rows (not last)
    - .perforation dividers wrapping the items list
    - animate-pulse skeleton chit card for loading state
    - EXPIRED stamp (Bungee, rotate -6deg, border-stamp) for null/expired state
    - Deterministic 1-2deg rotation via billId.charCodeAt(0) % 20 (UI-09)
key_files:
  created: []
  modified:
    - src/app/c/[billId]/page.tsx
decisions:
  - "Apply rotation to items .chit panel only (one-imperfection rule UI-09) — not YOUR PORTION or other panels"
  - "hr.rule-hairline placed inside item div, conditional on index < items.length - 1 — replaces border-b approach"
  - "I'VE PAID button already had no border-radius — no change needed for CHANGE 7"
  - "Worktree branch reset to main HEAD before committing to avoid orphan-root merge conflict"
metrics:
  duration: "290s"
  completed_date: "2026-05-25T18:35:24Z"
  tasks_completed: 2
  tasks_total: 2
  files_created: 0
  files_modified: 1
---

# Phase 3 Plan 03: Member View Chit Aesthetic Summary

**One-liner:** Member/claim view fully restyled with .chit panels, .dot-leader item rows, .rule-hairline separators, .perforation dividers, animated skeleton loading card, EXPIRED stamp state, and deterministic 1-2deg billId-seeded rotation.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Loading skeleton, expired stamp, items chit wrapper, perforation dividers | 5c5d9de | src/app/c/[billId]/page.tsx |
| 2 | Dot-leaders, hairline rules, YOUR PORTION polish, rotation, button fix | f2c31bf | src/app/c/[billId]/page.tsx |

## What Was Built

### Task 1: Loading state, expired state, items chit wrapper

- **Loading state**: Replaced `LOADING...` paragraph with animated skeleton chit card — 5 gray bars (`bg-ink opacity-10`) with `animate-pulse`, wrapped in `.chit max-w-[480px] w-full mx-4 p-4`
- **Expired/null state**: Replaced plain div with `.chit` wrapper containing EXPIRED stamp (Bungee, `text-stamp`, `border-stamp`, `rotate(-6deg)`) + "THIS CHIT HAS BEEN TORN UP" heading + body text
- **Items section**: Changed container from `bg-paper-chit p-4 mb-4` to `chit p-4 mb-4` (`.chit` provides bg + shadow — no duplication)
- **Perforation dividers**: Added `<div className="perforation mb-3">` after ITEMS header, and `<div className="perforation mt-3">` after items.map() close

### Task 2: Dot-leaders, hairline rules, YOUR PORTION, rotation, button

- **Item button dot-leader**: Added `dot-leader` as first class on the tappable `<button>` element — leverages `::after` pseudo-element for name…price dotted alignment
- **Hairline rules**: Added `index` param to items.map(), render `<hr className="rule-hairline" />` after each item div except the last (`index < items.length - 1`)
- **Border-b removal**: Removed `border-b border-ink border-opacity-10 last:border-0` from outer item div — hairline hrs now handle separation
- **YOUR PORTION panel**: Changed from `bg-paper-chit border-t-2 border-pen p-4 shadow-[0_2px_12px_rgba(31,27,23,0.08)] border-l-4 border-l-pen mb-4` to `chit border-t-2 border-pen border-l-4 border-l-pen p-4 mb-4` — `.chit` provides bg and shadow
- **YOUR PORTION dot-leaders**: Added `dot-leader` to Subtotal, Service Charge, SST, and YOUR TOTAL rows
- **UI-09 rotation**: Added `const rotationDeg = (billId.charCodeAt(0) % 20) / 10 + 1` before return, applied via `style={{ transform: \`rotate(${rotationDeg}deg)\` }}` to the items `.chit` div only
- **I'VE PAID button**: Already had no `rounded` classes — className `w-full h-12 bg-pen text-white uppercase font-bold text-sm tracking-widest flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed` was correct

## Verification Results

| Check | Result |
|-------|--------|
| pnpm exec tsc --noEmit | PASS (exit 0) |
| animate-pulse count = 1 | PASS |
| LOADING... count = 0 | PASS |
| EXPIRED count = 1 | PASS |
| font-stamp count = 1 | PASS |
| THIS CHIT HAS BEEN TORN UP count = 1 | PASS |
| "chit " count >= 2 (got 3) | PASS |
| bg-paper-chit p-4 mb-4 count = 0 | PASS |
| perforation count >= 2 (got 2) | PASS |
| rule-hairline count >= 1 (got 1) | PASS |
| dot-leader count >= 3 (got 5) | PASS |
| rotationDeg count >= 2 (got 2) | PASS |
| charCodeAt count >= 2 (got 3) | PASS |
| chit border-t-2 border-pen border-l-4 count = 1 | PASS |
| shadow-[0_2px count = 0 | PASS |

## Deviations from Plan

### Worktree Commit Path

**Found during:** Setup (pre-Task 1)
**Issue:** Initial worktree branch was on an orphaned root commit (b0d5a37 — "Initial commit") with no relationship to main. Files in the worktree root were just LICENSE, not the full project.
**Fix:** Reset worktree branch (`git reset --hard main`) to bring it to main's HEAD (19f8943) before applying any changes. All commits are based on the real project history as required by the parallel_execution note.
**Files modified:** None (git operation only)

No functional deviations. Plan executed exactly as specified.

## Known Stubs

`placeholder="Enter your name"` on the inline name-entry input (line ~412) — this is standard HTML input placeholder text for UX, not a data stub. The field is fully functional.

## Threat Flags

None. This plan applies CSS class changes only — no new network endpoints, auth paths, file access patterns, or schema changes.

## Self-Check: PASSED

- src/app/c/[billId]/page.tsx: EXISTS in worktree with all changes applied
- Commit 5c5d9de: EXISTS (Task 1 — loading skeleton, expired stamp, items chit)
- Commit f2c31bf: EXISTS (Task 2 — dot-leaders, hairlines, YOUR PORTION, rotation)
- TypeScript check: PASS (exit 0)
- All 15 grep verification checks: PASS
