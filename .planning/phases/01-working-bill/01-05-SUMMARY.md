---
phase: 01-working-bill
plan: "05"
subsystem: member-view
tags:
  - payment-flow
  - settle-stamp
  - member-ux
  - convex-realtime
dependency_graph:
  requires:
    - 01-02  # member view shell and organizer redirect logic
    - convex/payments.ts  # markPaid, getMyPayment mutations/queries
    - convex/bills.ts     # getBillForMember query with qrUrl
  provides:
    - src/components/SettleStamp.tsx  # reusable stamp component for dashboard (Plan 06)
    - src/app/c/[billId]/page.tsx     # full member payment flow
  affects:
    - PAY-01 PAY-02 PAY-03 PAY-04 PAY-05 AUTH-02 SHARE-04
tech_stack:
  added: []
  patterns:
    - Pattern 7: calculateTotals (subtotal/serviceCharge/SST)
    - Pattern 9: useQuery undefined/null/data state machine
    - Convex "skip" argument to conditionally disable a query until session loads
key_files:
  created:
    - src/components/SettleStamp.tsx
  modified:
    - src/app/c/[billId]/page.tsx
decisions:
  - "SettleStamp renders null for rejected status — member gets a clean re-tap experience without stale stamp visible"
  - "isButtonDisabled includes payment?.status pending/settled checks for idempotency UX"
  - "calculateTotals co-located in page.tsx (not extracted) — Plan 05 is the only consumer; extraction deferred to Phase 2 if claiming adds more consumers"
  - "claimantSession skip guard uses Convex 'skip' string literal for getMyPayment — prevents subscription before session UUID loads from localStorage"
metrics:
  duration: "2m"
  completed_date: "2026-05-23"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 2
---

# Phase 01 Plan 05: Member View — Payment Flow and SettleStamp Summary

**One-liner:** Full member payment flow at /c/[billId] with SettleStamp state machine (pending=50%, settled=100%) driven by Convex real-time getMyPayment subscription.

## What Was Built

### Task 1 — SettleStamp component (`src/components/SettleStamp.tsx`)

A named React client component that renders the SETTLE rubber-stamp overlay for three payment states:

- `null` or `"rejected"` — returns null (no DOM output); keeps the UI clean for re-tap
- `"pending"` — stamp at opacity-50, text "AWAITING CONFIRMATION" in `text-[--color-stamp]`
- `"settled"` — stamp at full opacity, text "HAVE A GOOD ONE!" in `text-[--color-pen]`

Color constraints strictly followed: SETTLE text/border uses `--color-stamp` (#B91C1C); the "HAVE A GOOD ONE!" copy uses `--color-pen` (#1E40AF) per UI-SPEC (it's pen copy, not stamp).

### Task 2 — Full member view (`src/app/c/[billId]/page.tsx`)

Replaced the Plan 02 shell with the complete payment flow:

- **Session management:** `useMemberSession` hook generates and persists UUID to `localStorage` key `tongtong_session_${billId}` (AUTH-02)
- **Organizer redirect:** retained `useEffect` checking `tongtong_organizer_secret` → `router.replace(/dashboard/[billId])` (D-05)
- **Item list:** renders each item with `(price * quantity / 100).toFixed(2)` format, prefixed "RM" — never raw cents
- **DuitNow QR:** conditional `<img>` at 200x200px when `bill.qrUrl` is truthy (PAY-03)
- **Totals panel:** `calculateTotals` with service charge (10%) before SST (6%) breakdown, conditionally showing each charge row
- **Payment mutation:** `useMutation(api.payments.markPaid)` — guards: session loaded, name non-empty, not already paying/paid
- **Real-time stamp:** `useQuery(api.payments.getMyPayment, claimantSession ? args : "skip")` — subscription skipped until session UUID loads from localStorage to prevent undefined args
- **SettleStamp:** rendered with `payment?.status ?? null` — transitions from pending (50%) to settled (100%) when Convex pushes confirmed status
- **I'VE PAID button:** hidden when `payment.status === "pending"` or `"settled"`; disabled when name empty or session null

## Deviations from Plan

None — plan executed exactly as written.

## Threat Mitigations Applied

| Threat ID | Mitigation | Location |
|-----------|-----------|----------|
| T-05-02 | markPaid idempotency — verified existing `by_session` index check in `convex/payments.ts` | convex/payments.ts (Plan 01) |
| T-05-04 | Client-side empty name guard: button disabled + handlePay returns early | page.tsx `isButtonDisabled`, `handlePay` |
| T-05-05 | Organizer redirect via `localStorage` check in `useEffect` | page.tsx `useEffect` (D-05) |

## Known Stubs

None — all data flows are fully wired. Input placeholder text is a standard HTML attribute, not a data stub.

## Self-Check: PASSED
