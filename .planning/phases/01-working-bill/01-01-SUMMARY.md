---
phase: 01-working-bill
plan: "01"
subsystem: convex-backend
tags: [convex, schema, mutations, queries, payments, auth]
dependency_graph:
  requires: []
  provides:
    - convex/schema.ts bills table with venueName + billDate fields
    - convex/bills.ts createBill mutation
    - convex/bills.ts generateUploadUrl mutation
    - convex/bills.ts getBillForMember query
    - convex/bills.ts getBillForOrganizer query
    - convex/payments.ts markPaid mutation
    - convex/payments.ts confirmPayment mutation
    - convex/payments.ts rejectPayment mutation
    - convex/payments.ts getPaymentsForBill query
    - convex/payments.ts getMyPayment query
  affects:
    - convex/_generated/ (must regenerate after this plan)
tech_stack:
  added: []
  patterns:
    - Convex mutation with atomic multi-table insert (createBill inserts bill + all items in one transaction)
    - Convex file storage generateUploadUrl pattern (3-step QR upload flow)
    - Convex secret verification via server-side organizerSecret comparison
    - Idempotent payment creation via by_session index query before insert
key_files:
  created:
    - convex/bills.ts
    - convex/payments.ts
  modified:
    - convex/schema.ts
decisions:
  - getBillForMember destructures and excludes organizerSecret from return value (explicit exclusion over implicit omission)
  - markPaid checks for existing non-rejected payment before inserting to prevent duplicate payment records
  - confirmPayment and rejectPayment both fetch bill to verify organizerSecret (not stored on payment record)
  - getPaymentsForBill requires organizerSecret (organizer-only query — members use getMyPayment)
metrics:
  duration: "98s"
  completed_date: "2026-05-23"
  tasks_completed: 2
  files_created: 2
  files_modified: 1
---

# Phase 01 Plan 01: Convex Backend Functions Summary

**One-liner:** Convex backend with createBill atomic write, QR upload URL generation, organizer-secret-gated queries, idempotent markPaid, and confirm/reject payment mutations with server-side auth.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Update convex/schema.ts + Write convex/bills.ts | fffc1a7 | convex/schema.ts, convex/bills.ts |
| 2 | Write convex/payments.ts | cc933c6 | convex/payments.ts |

## What Was Built

### convex/schema.ts
Added two optional fields to the bills table per BILL-01:
- `venueName: v.optional(v.string())` — restaurant/venue name
- `billDate: v.optional(v.string())` — ISO date string "YYYY-MM-DD"

### convex/bills.ts (4 exports)
- **createBill** — atomic mutation inserting bill record + all item records in a single transaction. Accepts venueName and billDate optional fields. Returns billId.
- **generateUploadUrl** — mutation returning a short-lived Convex storage upload URL (first step in 3-step QR upload flow).
- **getBillForMember** — public query (no auth). Explicitly excludes organizerSecret from return value. Resolves qrStorageId to a URL via ctx.storage.getUrl.
- **getBillForOrganizer** — organizer-only query. Verifies organizerSecret server-side before returning full bill data including items and payments.

### convex/payments.ts (5 exports)
- **markPaid** — idempotent mutation. Queries by_session index first; returns existing paymentId if a non-rejected payment exists, otherwise inserts new "pending" payment.
- **confirmPayment** — organizer mutation. Fetches bill to verify organizerSecret, then patches status to "settled" + sets confirmedAt.
- **rejectPayment** — organizer mutation. Same auth check; patches status to "rejected". Member can re-submit.
- **getPaymentsForBill** — organizer query. Verifies secret, returns all payments for the bill.
- **getMyPayment** — member query. No auth required; returns payment by claimantSession UUID (unguessable).

## Threat Mitigations Applied

All mitigations from the plan's threat register are implemented:

| Threat ID | Mitigation Implemented |
|-----------|----------------------|
| T-01-01 | confirmPayment: `bill.organizerSecret !== organizerSecret` throws "Unauthorized" before write |
| T-01-02 | rejectPayment: same check as confirmPayment |
| T-01-03 | markPaid: by_session index query before insert; returns existing ID if pending/settled |
| T-01-04 | getBillForMember: explicit destructure to exclude organizerSecret from spread |
| T-01-05 | getBillForOrganizer: throws "Unauthorized" if secret mismatch before returning any data |
| T-01-06 | Accepted (demo scale) |
| T-01-SC | No new packages installed |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all functions are fully implemented with real Convex DB operations.

## Threat Flags

None — no new security surface beyond what the plan's threat model covers.

## Self-Check

**Files exist:**
- convex/schema.ts — FOUND (modified)
- convex/bills.ts — FOUND (created)
- convex/payments.ts — FOUND (created)

**Commits exist:**
- fffc1a7 — Task 1 commit
- cc933c6 — Task 2 commit

## Self-Check: PASSED

## Next Step

Run `pnpm dev:convex` in the project root to regenerate `convex/_generated/` with typed `api.bills` and `api.payments` references. Subsequent plans (02+) depend on these generated types.
