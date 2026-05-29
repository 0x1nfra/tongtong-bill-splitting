---
phase: 05-bonus-additions-departure-mono-headings-landing-page-enhance
plan: 02
subsystem: backend
tags: [convex, mutations, backend, file-storage]

# Dependency graph
requires:
  - 05-01
provides:
  - updateQR public mutation in convex/bills.ts (auth + archive-freeze + qrStorageId patch)
  - createBill args extended with receiptStorageId: v.optional(v.id("_storage"))
  - createBill db.insert persists receiptStorageId field
affects: [05-03, 05-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "updateQR mirrors setBillReceipt pattern: auth guard + archive freeze check + ctx.db.patch"
    - "createBill receiptStorageId: optional arg passed through from args to db.insert"

key-files:
  created: []
  modified:
    - convex/bills.ts

key-decisions:
  - "updateQR declared as public mutation (not internalMutation) — callable via api.bills.updateQR from dashboard"
  - "receiptStorageId: v.optional in createBill args — no breaking change to existing callers"

# Metrics
duration: 5min
completed: 2026-05-30
---

# Phase 5 Plan 02: Wave 1 Backend — updateQR mutation + createBill receiptStorageId

**Added updateQR public mutation and extended createBill args/insert with receiptStorageId**

## Performance

- **Duration:** 5 min
- **Started:** 2026-05-30T00:12:00Z
- **Completed:** 2026-05-30T00:17:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Added `updateQR` public mutation after `setBillReceipt` in `convex/bills.ts` — exactly mirrors the `setBillReceipt` pattern: auth guard (`!bill || bill.organizerSecret !== organizerSecret` → throws "Unauthorized"), archive freeze check (`bill.archivedAt !== undefined` → throws "Bill is archived"), then `ctx.db.patch(billId, { qrStorageId })`.
- Extended `createBill` args with `receiptStorageId: v.optional(v.id("_storage"))` and added `receiptStorageId: args.receiptStorageId` to the `db.insert` call.
- All 6 updateQR boundary tests pass. TypeScript type-check passes with no errors.

## Task Commits

1. **Task 1: Add updateQR mutation + extend createBill with receiptStorageId** - `eed0a83` (feat)

## Files Created/Modified

- `convex/bills.ts` — 22 lines inserted: updateQR mutation (17 lines) + receiptStorageId arg (1 line) + receiptStorageId db.insert line (1 line) + JSDoc comment (3 lines)

## Decisions Made

- `updateQR` is a public `mutation` (not `internalMutation`) so the dashboard can call it via `api.bills.updateQR`. The plan explicitly required this.
- `receiptStorageId` added as `v.optional` to avoid any breaking change to existing `createBill` callers that omit it.

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None — both changes are complete and wired. The 4 RED landing page stubs from Plan 01 remain (they are implemented in Wave 1 Plans 03/04).

## Threat Flags

None — no new trust boundaries introduced. Both changes use the established `organizerSecret` auth pattern from `setBillReceipt`.

## Self-Check: PASSED

- FOUND: convex/bills.ts `export const updateQR = mutation(` — line 411
- FOUND: convex/bills.ts `receiptStorageId: args.receiptStorageId` — line 46
- FOUND: convex/bills.ts `receiptStorageId: v.optional(v.id("_storage"))` in createBill args — line 19
- FOUND commit: eed0a83
- FOUND: 6/6 updateQR boundary tests passing
- FOUND: TypeScript type-check passes (no errors)

---
*Phase: 05-bonus-additions-departure-mono-headings-landing-page-enhance*
*Completed: 2026-05-30*
