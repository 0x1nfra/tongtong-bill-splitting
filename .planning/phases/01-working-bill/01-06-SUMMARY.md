---
phase: "01"
plan: "06"
subsystem: organizer-dashboard
tags:
  - dashboard
  - payment-flow
  - real-time
  - convex-mutations
dependency_graph:
  requires:
    - 01-04  # BillSummaryCard component
    - 01-05  # SettleStamp, member payment flow
    - convex/payments.ts  # confirmPayment, rejectPayment, getPaymentsForBill
    - convex/bills.ts     # getBillForOrganizer
  provides:
    - src/components/ProgressBar.tsx
    - src/components/StatsBar.tsx
    - src/components/StatusBadge.tsx
    - src/components/MemberRow.tsx
    - src/app/dashboard/[billId]/page.tsx
  affects:
    - DASH-01 DASH-02 DASH-03 DASH-04 DASH-05 DASH-06 DASH-07 AUTH-03
tech_stack:
  added: []
  patterns:
    - "useMutation with void wrapper for fire-and-forget Convex calls"
    - "useQuery with skip guard — no subscription until organizerSecret loaded from localStorage"
    - "Equal-split phase-1 heuristic: grandTotal / memberCount for per-member amount"
    - "Inline confirm pattern for destructive action (CLOSE CHIT EARLY)"
key_files:
  created:
    - src/components/ProgressBar.tsx
    - src/components/StatsBar.tsx
    - src/components/StatusBadge.tsx
    - src/components/MemberRow.tsx
  modified:
    - src/app/dashboard/[billId]/page.tsx
decisions:
  - "unclaimed count is 0 in Phase 1 — no claim records exist; Phase 2 will wire real data"
  - "CLOSE CHIT EARLY shows placeholder alert — archive logic deferred to future enhancement per plan spec"
  - "amountPerMemberCents = grandTotal / memberCount (equal split, Phase 1 only)"
  - "StatusBadge exported as named export with StatusValue type so MemberRow can import without re-declaring the union"
metrics:
  duration: "4m"
  completed: "2026-05-24"
  tasks_completed: 2
  tasks_total: 2
  files_created: 4
  files_modified: 1
---

# Phase 01 Plan 06: Organizer Dashboard Summary

**One-liner:** Full /dashboard/[billId] organizer command center with ProgressBar, StatsBar, per-person MemberRow list, real-time Convex confirmPayment/rejectPayment mutations, and desktop 2-column layout with BillSummaryCard right panel.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create ProgressBar, StatsBar, StatusBadge, and MemberRow components | 142b37c | src/components/ProgressBar.tsx, src/components/StatsBar.tsx, src/components/StatusBadge.tsx, src/components/MemberRow.tsx |
| 2 | Complete /dashboard/[billId] organizer dashboard page | 42047b3 | src/app/dashboard/[billId]/page.tsx |

## What Was Built

### ProgressBar (`src/components/ProgressBar.tsx`)

Blue fill bar for the TOTAL COLLECTED widget (DASH-01):
- Label row: "TOTAL COLLECTED" left + "RM X.XX / RM Y.YY" right-aligned
- Fill uses `bg-[--color-pen]` (#1E40AF blue — permitted per UI-SPEC accent rule #3)
- Fill width = `Math.min(100, (collectedCents / totalCents) * 100)%` — capped at 100%
- Track uses `color-mix(in srgb, var(--color-ink) 20%, transparent)` for a subtle background

### StatsBar (`src/components/StatsBar.tsx`)

4-count row for CONFIRMED / AWAITING / CLAIMED / UNCLAIMED (DASH-02):
- Equal-width flex columns, count in `text-lg font-bold`, label in `text-xs uppercase opacity-60`
- All text uses `--color-ink` — no blue or red on the count numbers

### StatusBadge (`src/components/StatusBadge.tsx`)

Status label with color rules per DASH-04:
- `"UNCLAIMED ❋"` → `text-[--color-stamp]` (#B91C1C — only permitted red use per UI-SPEC)
- `"N/A"` → `text-[--color-ink] opacity-40`
- All other statuses → `text-[--color-ink]` (no special color)
- Exports `StatusValue` type union for reuse in MemberRow

### MemberRow (`src/components/MemberRow.tsx`)

Per-person dashboard row (DASH-03):
- Row 1: name (uppercase bold) + RM amount (cents/100 toFixed(2)) + StatusBadge
- Row 2 when AWAITING: "STAMP SETTLED" (`bg-[--color-pen]` blue CTA per DASH-05) + "REJECT" (neutral border)
- Row 2 when CLAIMED — UNPAID or UNCLAIMED ❋: "SEND REMINDER" (neutral border, copies share link per DASH-06)
- No blue or red on REJECT or SEND REMINDER buttons — strictly neutral border style

### /dashboard/[billId] Page (`src/app/dashboard/[billId]/page.tsx`)

Full organizer command center:

- **Auth guard retained:** `organizerSecret` loaded from `localStorage` in `useEffect`; both Convex queries skip until loaded (SSR-safe, T-06-02 mitigation)
- **DASHBOARD NOT ACCESSIBLE:** Rendered when `getBillForOrganizer` returns null — wrong device or invalid secret (D-10, AUTH-03)
- **Two live queries:** `getBillForOrganizer` for bill/items data + `getPaymentsForBill` for real-time payment status
- **Mutations wired:** `confirmPayment` on STAMP SETTLED, `rejectPayment` on REJECT (T-06-01 mitigation)
- **Phase 1 equal-split:** `amountPerMemberCents = Math.round(grandTotalCents / memberCount)` — no claiming data yet
- **Stats derivation:** confirmed/awaiting/claimed derived from payment.status; unclaimed = 0 (Phase 2 will add real counts)
- **Empty state:** "NO ONE'S JOINED YET" + "Share the link and they'll appear here." + COPY SHARE LINK blue button
- **SEND REMINDER:** copies `/c/${billId}` URL to clipboard via `navigator.clipboard.writeText`
- **Desktop 2-column layout (md+):** left 60% = progress + stats + people list; right 40% = BillSummaryCard + quick actions
- **CLOSE CHIT EARLY:** Red (`--color-stamp`) border button, inline confirm step, placeholder alert for MVP (archive logic deferred)
- **shareUrl:** set in `useEffect` from `window.location.origin` (SSR-safe)

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

| Stub | File | Line | Reason |
|------|------|------|--------|
| `alert("Close chit feature coming soon.")` | `src/app/dashboard/[billId]/page.tsx` | CLOSE CHIT button handler | Plan spec explicitly calls for placeholder alert in Phase 1; archive logic is a future enhancement (DASH-07) |
| `unclaimed = 0` | `src/app/dashboard/[billId]/page.tsx` | stats derivation | Phase 1 has no claim records; Phase 2 (item claiming) will supply real unclaimed counts |

These stubs are intentional per the plan and do not prevent the plan's core goal (payment confirmation loop). Both are documented and scoped to future phases.

## Threat Mitigations Applied

| Threat ID | Mitigation | Location |
|-----------|-----------|----------|
| T-06-01 | organizerSecret passed to confirmPayment/rejectPayment; Convex verifies server-side | page.tsx handleConfirm/handleReject + convex/payments.ts (Plan 01) |
| T-06-02 | getBillForOrganizer returns null on invalid secret; page shows DASHBOARD NOT ACCESSIBLE, no data rendered | page.tsx null guard |

## Threat Surface Scan

No new threat surface introduced beyond the plan's threat model. All mutations require organizerSecret; the dashboard page renders only after successful server-side secret verification.

## Self-Check: PASSED

Files exist:
- src/components/ProgressBar.tsx: FOUND
- src/components/StatsBar.tsx: FOUND
- src/components/StatusBadge.tsx: FOUND
- src/components/MemberRow.tsx: FOUND
- src/app/dashboard/[billId]/page.tsx: FOUND (modified)

Commits exist:
- 142b37c: FOUND (feat(01-06): add ProgressBar, StatsBar, StatusBadge, and MemberRow components)
- 42047b3: FOUND (feat(01-06): complete /dashboard/[billId] organizer dashboard page)

TypeScript: zero errors across all modified files.
