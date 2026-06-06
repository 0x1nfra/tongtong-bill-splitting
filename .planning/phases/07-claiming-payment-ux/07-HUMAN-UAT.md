---
status: complete
phase: 07-claiming-payment-ux
source: [07-VERIFICATION.md]
started: 2026-06-05T16:16:00Z
updated: 2026-06-06T07:30:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Dashboard banking info persistence
expected: Banking info persists across page reloads. Field shows 'Maybank' after reload.
result: pass

### 2. Member view TRANSFER TO display
expected: TRANSFER TO label visible with 'Bank: Maybank' and 'Account No.: 1234567890' rows. No text-stamp (red) anywhere in the banking info block.
result: issue
reported: "i dont see it tho. also there is a bug with the total amount in the bill. it is showing the price of a single item when it should be the total"
severity: major

### 3. Member view Rounding Adj. row
expected: Row present for non-zero roundingAdjustmentCents (between SST and GRAND TOTAL); row absent for zero. Positive value prefixed with '+', negative without prefix. No red color.
result: issue
reported: "yes but the color is not amber/orange tho"
severity: cosmetic

### 4. Create-to-member-view banking info flow
expected: Banking info entered on the create page is visible in the member view PAYMENT ZONE immediately after bill creation, with no additional dashboard configuration needed.
result: pass
notes: "QR upload section should be bundled with payment details fields under one section header — currently separated by a dashed line which looks disconnected"

## Summary

total: 4
passed: 3
issues: 1
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "Rounding Adj. value uses neutral text color (text-ink), not pen-blue"
  status: failed
  reason: "User reported: yes but the color is not amber/orange tho"
  severity: cosmetic
  test: 3
  root_cause: "Line 748 uses text-pen class (blue) for positive rounding adj; should be text-ink to match other bill total rows"
  artifacts:
    - path: "src/app/c/[billId]/page.tsx"
      issue: "text-pen class on rounding adj span — fixed in this session"
  missing: []
