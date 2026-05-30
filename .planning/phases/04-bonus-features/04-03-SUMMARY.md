---
phase: 04-bonus-features
plan: 03
subsystem: frontend-archived-ui
tags: [archived-stamp, whatsapp-nudge, freeze-ui, wave-2, bonus-03, bonus-04]
dependency_graph:
  requires: [04-01, 04-02]
  provides: [ArchivedStamp, member-view-archived-overlay, dashboard-archived-banner, dashboard-nudge-handler]
  affects: [04-04-PLAN]
tech_stack:
  added: []
  patterns: [early-return-guard, conditional-prop-freeze, wa-me-deep-link, sanitize-before-url]
key_files:
  created:
    - src/components/ArchivedStamp.tsx
  modified:
    - src/app/c/[billId]/page.tsx
    - src/app/dashboard/[billId]/page.tsx
decisions:
  - "ArchivedStamp returns early from member view — no bill content rendered when archivedAt is set (cleanest UX, no partial state)"
  - "isArchived boolean derived immediately after billData destructure in dashboard — single source for all conditional prop passes"
  - "handleNudgeMember uses sanitizedName (replace /[<>\"]/g) then encodeURIComponent as dual-layer URL safety (T-04-04)"
  - "isButtonDisabled includes !!bill?.archivedAt despite early-return guard — defense-in-depth for the pay button"
metrics:
  duration: 420s
  completed: "2026-05-28"
  tasks_completed: 2
  files_created: 1
  files_modified: 2
---

# Phase 4 Plan 03: ARCHIVED Stamp UI + Dashboard NUDGE Summary

ARCHIVED stamp overlay on member view (early-return), full-width archive banner on dashboard with frozen action buttons, and per-member WhatsApp NUDGE handler wired exclusively to "CLAIMED — UNPAID" members.

## What Was Built

| Component | Description |
|-----------|-------------|
| `src/components/ArchivedStamp.tsx` | New named export `ArchivedStamp` — Bungee stamp box with `rotate(-6deg)` / `filter: url(#ink-bleed)`, sub-copy "THIS CHIT IS ARCHIVED", detail copy with `opacity: 0.7` |
| `src/app/c/[billId]/page.tsx` | Imports `ArchivedStamp`; early-return overlay when `bill.archivedAt` truthy; `handleItemTap` guard; `isButtonDisabled` includes `!!bill?.archivedAt` |
| `src/app/dashboard/[billId]/page.tsx` | `isArchived` flag; `handleNudgeMember(memberName)` replaces `handleRemind()`; per-member `onRemind` wired for "CLAIMED — UNPAID" only; all MemberRow action props frozen when `isArchived`; "BILL ARCHIVED — READ ONLY" banner |

## Task Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create ArchivedStamp + wire into member view | 3dffd0f | src/components/ArchivedStamp.tsx, src/app/c/[billId]/page.tsx |
| 2 | Wire ARCHIVED banner + per-member NUDGE into dashboard | efdaff8 | src/app/dashboard/[billId]/page.tsx |

## Deviations from Plan

None — plan executed exactly as written.

## Threat Mitigations Applied

| Threat ID | Status |
|-----------|--------|
| T-04-04 (Tampering — claimantName → wa.me URL injection) | Mitigated — `memberName.replace(/[<>"]/g, '')` applied before `encodeURIComponent` interpolation |
| T-04-W2-01 (Tampering — UI disables buttons, server-side freeze is authoritative gate) | Accepted per plan — dual protection: server freeze (plan 02) + UI prop freeze (this plan) |

## Verification Performed

```
pnpm vitest run src/test/archivedBill.test.tsx  → 4 passed (previously RED) ✓
pnpm vitest run src/test/MemberRow.test.tsx      → 20 passed ✓
pnpm test (full suite)                           → same 4 pre-existing failures only ✓
grep -n "handleRemind" dashboard/page.tsx        → 0 matches (removed) ✓
grep -n "handleNudgeMember" dashboard/page.tsx   → 2 matches (definition + usage) ✓
grep -n "BILL ARCHIVED" dashboard/page.tsx       → line 262 ✓
grep -n "ArchivedStamp" c/[billId]/page.tsx      → lines 9, 288, 293 ✓
```

## Known Stubs

None — this plan is fully wired. `ArchivedStamp` is a complete presentational component. Dashboard nudge handler is complete. `SignInButton` (plan 04) remains as a pre-existing RED stub.

## Threat Flags

None — no new network endpoints, auth paths, schema changes, or file access patterns introduced. `handleNudgeMember` opens a `window.open` to `wa.me` — a user-initiated external link, not a server request.

## Self-Check: PASSED

- [x] src/components/ArchivedStamp.tsx exists with named export `ArchivedStamp`
- [x] ArchivedStamp renders "ARCHIVED" in stamp box with `border-stamp`, `text-stamp`, `rotate(-6deg)`, `filter: url(#ink-bleed)`
- [x] ArchivedStamp renders "THIS CHIT IS ARCHIVED" sub-copy
- [x] ArchivedStamp renders "This chit was automatically archived after 30 days of inactivity." detail copy
- [x] src/app/c/[billId]/page.tsx imports ArchivedStamp
- [x] Member view returns ArchivedStamp overlay early when bill.archivedAt is truthy
- [x] src/app/dashboard/[billId]/page.tsx no longer contains handleRemind
- [x] File contains handleNudgeMember with memberName.replace(/[<>"]/g, '') sanitization
- [x] File contains window.open(`https://wa.me/?text=${msg}`, "_blank") with encodeURIComponent
- [x] MemberRow onRemind undefined for all statuses except "CLAIMED — UNPAID"
- [x] When isArchived true, all MemberRow action props are undefined
- [x] ARCHIVED banner div contains "BILL ARCHIVED — READ ONLY" and bg-stamp class
- [x] Commits 3dffd0f and efdaff8 verified in git log
- [x] archivedBill tests GREEN; MemberRow tests GREEN; full suite same 4 pre-existing failures
