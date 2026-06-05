---
phase: 07-claiming-payment-ux
plan: 05
subsystem: bill-creation
tags: [banking-info, create-page, convex-mutation, xss-sanitization, gap-closure]
requirements: [CLAIM-BANK-01]

dependency_graph:
  requires: [07-04]
  provides: [banking-info-at-creation]
  affects: [convex/bills.ts, src/app/create/page.tsx]

tech_stack:
  added: []
  patterns:
    - XSS sanitization via .replace(/[<>"]/g, "").trim() on banking info args (mirrors T-04-04 pattern)
    - Optional string args in Convex mutation defaulting to undefined when client sends empty string

key_files:
  created: []
  modified:
    - convex/bills.ts
    - src/app/create/page.tsx

decisions:
  - Added 4 banking info args after roundingAdjustmentCents in createBill args object (consistent with updateBankingInfo field order)
  - Used `field || undefined` convention in handleGenerate (matches existing venueName/billDate pattern)
  - PAYMENT DETAILS section placed between ATTACHMENTS and GENERATE LINK with flanking perforations (replaced single perforation)

metrics:
  duration: "2m 22s"
  completed_date: "2026-06-05"
  tasks_completed: 2
  files_modified: 2
---

# Phase 07 Plan 05: Banking Info at Bill Creation Summary

**One-liner:** Added 4 optional banking info fields (bankName, accountNumber, accountHolderName, duitNowId) to createBill mutation with XSS sanitization and a PAYMENT DETAILS section to the create page.

## What Was Built

- `createBill` mutation in `convex/bills.ts` now accepts 4 optional banking info args after `roundingAdjustmentCents`. Each field is XSS-sanitized with `.replace(/[<>"]/g, "").trim()` before being stored (T-07-05-01 threat mitigation, mirrors updateBankingInfo T-04-04 pattern).
- `src/app/create/page.tsx` has 4 new `useState` hooks for banking info, a PAYMENT DETAILS section with 4 labelled text inputs (Bank Name, Account No., Account Holder, DuitNow ID), and all 4 fields passed to `createBill` as `field || undefined`.

## Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Extend createBill mutation with optional banking info args | 2466950 | convex/bills.ts |
| 2 | Add banking info state and UI section to create page | b4dc77c | src/app/create/page.tsx |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — banking info fields are fully wired from create page form to Convex mutation to bill document. The member view TRANSFER TO block was already wired to display banking info from a prior plan (07-04); bills created via this plan will show banking info immediately without a dashboard visit.

## Threat Flags

None — all threat register mitigations from the plan's `<threat_model>` were applied (T-07-05-01: XSS sanitization on all 4 banking info args in createBill handler).

## Self-Check: PASSED

- `convex/bills.ts` modified: confirmed (2466950)
- `src/app/create/page.tsx` modified: confirmed (b4dc77c)
- Both commits exist: `git log --oneline` shows 2466950 and b4dc77c on worktree-agent-a2f15f5054f282cd3
- Pre-existing TypeScript error in `src/test/calculatePersonTotals.test.ts` (line 253) is out of scope — confirmed present on base commit before any changes
