---
status: complete
phase: 02-item-claiming
source: [02-01-SUMMARY.md, 02-02-SUMMARY.md, 02-03-SUMMARY.md, 02-04-SUMMARY.md]
started: 2026-05-25T01:50:00Z
updated: 2026-05-25T02:05:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Claim an Item
expected: Open the member view (/c/[billId]). Unclaimed items show red ❋ prefix and "CLAIM" prompt below each row. Tap an unclaimed item — name input expands below that row. Enter name, tap CLAIM — your name appears in blue handwriting below the item row; ❋ and CLAIM prompt disappear for that item.
result: issue
reported: "kind of works with some bugs. 1. the prefix is not red. 2. when trying to claim an item the name input only appears only when we click the item name not the CLAIM button below it. 3. better place to organise the member portion and not on top of the total"
severity: major

### 2. Name Persists Across Reload
expected: After claiming an item (name now stored), reload the page. Tap a different unclaimed item. The claim fires immediately — no name input prompt appears. The second item shows your name right away.
result: pass

### 3. Unclaim Your Item
expected: Tap an item row you've already claimed. The claim is removed — your name disappears from the row, and the ❋ prefix and "CLAIM" prompt return for that item.
result: pass

### 4. Shared Item Splits Cost Equally
expected: Have two different members (two browser sessions) both claim the same item. Each member's Your Portion panel shows only half the item's price attributed to that item. The split is equal (rounded to nearest cent).
result: pass

### 5. Your Portion Panel — Live Totals
expected: After claiming at least one item, a sticky panel appears at the bottom of the member view labeled "Your Portion". It shows YOUR TOTAL (subtotal + service charge + SST) for your claimed items. Claim or unclaim more items — the total updates immediately in real time without a page refresh.
result: pass

### 6. Unclaimed Item Markers
expected: Items with no claims show a red ❋ before the item name and a small "CLAIM" label below the row. Items that have at least one claim do not show these markers.
result: pass

### 7. Real-Time Updates — Other Member's Claims
expected: Open the member view in two separate browser windows (or tabs) with different sessions. Claim an item in one window. In the other window — without refreshing — the claimed item shows the other member's name in blue handwriting within a few seconds.
result: issue
reported: "pass but the handwriting is not in blue"
severity: cosmetic

### 8. Dashboard Claim Stats
expected: Open the organizer dashboard. The stats bar shows CLAIMED and UNCLAIMED counts. After a member claims items in the member view, the CLAIMED count in the dashboard updates in real time (no refresh needed).
result: pass

## Summary

total: 8
passed: 6
issues: 2
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "❋ prefix on unclaimed items renders in red (--color-stamp)"
  status: failed
  reason: "User reported: prefix is not red"
  severity: cosmetic
  test: 1
  artifacts: []
  missing: []

- truth: "Tapping the CLAIM button below an item row expands the name input"
  status: failed
  reason: "User reported: name input only appears when clicking item name, not the CLAIM button"
  severity: major
  test: 1
  artifacts: []
  missing: []

- truth: "Your Portion panel placement is distinct from Bill Total section"
  status: failed
  reason: "User reported: better place for member portion, not on top of the total"
  severity: cosmetic
  test: 1
  artifacts: []
  missing: []

- truth: "Claimant names render in blue (--color-pen) handwriting font"
  status: failed
  reason: "User reported: handwriting is not in blue"
  severity: cosmetic
  test: 7
  artifacts: []
  missing: []
