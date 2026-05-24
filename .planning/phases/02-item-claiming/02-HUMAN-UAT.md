---
status: partial
phase: 02-item-claiming
source: [02-VERIFICATION.md]
started: 2026-05-25T01:45:00Z
updated: 2026-05-25T01:45:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Inline Name-Entry CSS Transition
expected: Name input + CLAIM button animate open below tapped row (max-height 0→80px, 200ms ease-out); no other rows expand
result: [pending]

### 2. localStorage Name Persistence and One-Tap Flow
expected: After reload, second tap fires claim immediately without prompting for name (stored in tongtong_name_${billId})
result: [pending]

### 3. Real-Time Multi-Member Claim Updates (CLAIM-06)
expected: Other claimant name appears in blue handwriting in second window within ~300ms via Convex WebSocket
result: [pending]

### 4. Your Portion Panel Animation and Live Updates
expected: Panel fades in with opacity+translateY transition on first claim; total updates live; disappears when all unclaimed
result: [pending]

### 5. Handwritten Claimant Names Visual Quality (CLAIM-04)
expected: Both names in Shadows Into Light Two (blue), distinct rotation (−2° to +2°), bold for current session / normal for others
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps
