---
status: partial
phase: 07-claiming-payment-ux
source: [07-VERIFICATION.md]
started: 2026-06-05T16:16:00Z
updated: 2026-06-05T16:16:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Dashboard banking info persistence
expected: Banking info persists across page reloads. Field shows 'Maybank' after reload.
result: [pending]

### 2. Member view TRANSFER TO display
expected: TRANSFER TO label visible with 'Bank: Maybank' and 'Account No.: 1234567890' rows. No text-stamp (red) anywhere in the banking info block.
result: [pending]

### 3. Member view Rounding Adj. row
expected: Row present for non-zero roundingAdjustmentCents (between SST and GRAND TOTAL); row absent for zero. Positive value prefixed with '+', negative without prefix. No red color.
result: [pending]

### 4. Create-to-member-view banking info flow
expected: Banking info entered on the create page is visible in the member view PAYMENT ZONE immediately after bill creation, with no additional dashboard configuration needed.
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps
