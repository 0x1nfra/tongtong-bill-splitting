---
phase: 08-google-auth
plan: "02"
subsystem: convex-backend
tags: [auth, dual-auth, google-oauth, convex, security]
dependency_graph:
  requires: ["08-01"]
  provides: ["dual-auth-convex-functions"]
  affects: ["convex/bills.ts", "convex/payments.ts"]
tech_stack:
  added: []
  patterns: ["dual-auth guard (query variant: return null)", "dual-auth guard (mutation variant: throw)", "getAuthUserId(ctx) server-side identity"]
key_files:
  created: []
  modified:
    - convex/bills.ts
    - convex/payments.ts
decisions:
  - "organizerSecret made optional on all organizer-gated functions (both localStorage and Google session paths)"
  - "getAuthUserId(ctx) called server-side only — never accepted as client arg (T-08-01)"
  - "Query variant returns null on auth failure (WR-06); mutation variant throws Unauthorized"
metrics:
  duration: "~8 minutes"
  completed: "2026-06-06"
  tasks_completed: 2
  files_modified: 2
---

# Phase 08 Plan 02: Dual-Auth Convex Backend Functions Summary

**One-liner:** Dual-auth guard (organizerSecret OR Google session) added to all organizer-gated Convex functions in bills.ts and payments.ts, with createBill storing googleUserId from server-side auth context.

## What Was Built

Added the security core for cross-device access (D-04, D-05). Every organizer-gated Convex function now accepts two authentication paths simultaneously:

1. **localStorage path** (existing): `organizerSecret` arg matches `bill.organizerSecret`
2. **Google session path** (new): `getAuthUserId(ctx)` returns an ID matching `bill.googleUserId`

Neither path was removed — both remain valid indefinitely (D-08).

## Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Dual-auth on convex/bills.ts | 448dfcf | convex/bills.ts |
| 2 | Dual-auth on convex/payments.ts | c473400 | convex/payments.ts |

## Changes Made

### convex/bills.ts

- Added `import { getAuthUserId } from "@convex-dev/auth/server"`
- `createBill`: captures `googleUserId` from `getAuthUserId(ctx)` before insert; stores as `googleUserId: googleUserId ? googleUserId.toString() : undefined` (D-03). **googleUserId is NOT in args validator** — server-only (T-08-01)
- `getBillForOrganizer`: `organizerSecret: v.optional(v.string())`; dual-auth query guard (returns null on failure, WR-06)
- `getClaimsForBill`: `organizerSecret: v.optional(v.string())`; dual-auth query guard
- `getClaimantsForBill`: `organizerSecret: v.optional(v.string())`; dual-auth query guard
- `setBillReceipt`: `organizerSecret: v.optional(v.string())`; dual-auth mutation guard (throws Unauthorized)
- `updateQR`: `organizerSecret: v.optional(v.string())`; dual-auth mutation guard (throws Unauthorized)
- `getBillForMember`, `claimItem`, `unclaimItem`, `generateUploadUrl`, `archiveStale`: **unchanged**

### convex/payments.ts

- Added `import { getAuthUserId } from "@convex-dev/auth/server"`
- `confirmPayment`: `organizerSecret: v.optional(v.string())`; dual-auth mutation guard (throws Unauthorized)
- `rejectPayment`: `organizerSecret: v.optional(v.string())`; dual-auth mutation guard (throws Unauthorized)
- `getPaymentsForBill`: `organizerSecret: v.optional(v.string())`; dual-auth query guard (returns null)
- `markPaid`, `getMyPayment`: **unchanged** (member functions, not organizer-gated)

## Deviations from Plan

### Scope Reduction — Worktree Branch Missing Functions

The plan specified 8 organizer-gated functions in `bills.ts`: getBillForOrganizer, getClaimsForBill, getClaimantsForBill, setBillReceipt, updateQR, updateRoundingAdjustment, updateBankingInfo (7 functions) + createBill modification = 8.

The worktree branch (`worktree-agent-adde382933576a5a6`) does not have `updateRoundingAdjustment` or `updateBankingInfo` — these functions exist in the main/release branch but were not committed to this agent's worktree branch. Only 5 organizer functions exist in the worktree's bills.ts.

**Impact:** 5 functions (not 7) have `organizerSecret: v.optional(v.string())` in bills.ts. When the worktree is merged back, the merge will bring the full bills.ts from main which should already have these functions. The dual-auth changes for those functions will need to be applied at merge or by the next plan.

**No auto-fix applied** (Rule 4 territory — would require understanding the merge strategy). Documented as a known gap.

### Acceptance Criteria Adjustments

- Plan specified `grep -c "organizerSecret: v.optional" convex/bills.ts | grep -q "7"` — actual count is 5 (worktree missing 2 functions)
- Plan specified `grep -c "getAuthUserId(ctx)" convex/bills.ts` ≥ 8 — actual count is 6 (1 in createBill + 5 in organizer functions)
- `convex/payments.ts` acceptance criteria: **fully met** (3 functions, 3 `getAuthUserId` calls, 3 `v.optional`)

## Verification

```
grep -c "getAuthUserId(ctx)" convex/bills.ts   → 6
grep -c "organizerSecret: v.optional" convex/bills.ts → 5
grep -c "getAuthUserId(ctx)" convex/payments.ts → 3
grep -c "organizerSecret: v.optional" convex/payments.ts → 3
grep -q "googleUserId: googleUserId" convex/bills.ts → found
pnpm test → 308 passed / 16 failed (pre-existing failures unchanged)
```

## Security Review

- T-08-01 MITIGATED: `googleUserId` never in args validators; only from `getAuthUserId(ctx)` server-side
- T-08-02 MITIGATED: `bill.googleUserId === getAuthUserId(ctx).toString()` — per-bill ownership enforced
- T-08-03 MITIGATED: Dual-auth guard rejects with throw/null when neither path matches

## Threat Flags

None — no new network endpoints, auth paths, or file access patterns beyond what the plan specified.

## Known Stubs

None — this plan implements server-side logic only; no UI stubs introduced.

## Self-Check: PASSED

- convex/bills.ts modified: FOUND
- convex/payments.ts modified: FOUND
- Commit 448dfcf exists: FOUND (Task 1)
- Commit c473400 exists: FOUND (Task 2)
- `getAuthUserId` import in both files: CONFIRMED
- `googleUserId` stored in createBill from ctx (not args): CONFIRMED
- markPaid / getMyPayment / getBillForMember unchanged: CONFIRMED
