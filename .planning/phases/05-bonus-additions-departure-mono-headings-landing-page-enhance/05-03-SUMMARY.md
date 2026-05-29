---
plan: 05-03
phase: 05-bonus-additions-departure-mono-headings-landing-page-enhance
status: complete
wave: 1
completed_at: "2026-05-30"
commits:
  - 693fc3f
  - 8a516a5
key-files:
  created: []
  modified:
    - src/app/page.tsx
    - src/test/landingPage.test.tsx
    - src/app/c/[billId]/page.tsx
---

# Plan 05-03 Summary

## What was built

Landing page received two new chit-styled sections (benefits + how-it-works) inserted between the DemoChit hero and the START NEW BILL CTA, matching the D-09 page order. Member view h1 elements gained Departure Mono via `style={{ fontFamily: "var(--font-display)" }}`.

## Task outcomes

**Task 1 — Landing page benefits + how-it-works (src/app/page.tsx + test fix):**
- Inserted `perforation` divider → `.chit` benefits card (rotate 0.3deg) with "WHY TONGTONG?" header and 3 dot-leader rows: "No more chasing lah ✓", "See your exact share, live ✓", "Pay with DuitNow QR ✓"
- Inserted second `perforation` → `.chit` how-it-works card (rotate -0.2deg) with "HOW IT WORKS" header and 3 step rows (01.–03.) with `rule-hairline` separators. Step numbers use `text-pen` + `var(--font-display)`. No `text-stamp` red used.
- `src/test/landingPage.test.tsx`: fixed "No more chasing" assertion to use `getAllByText` (text appears in both benefits and step 03 sub-copy)
- All 4 previously-RED landing page stubs now PASS (GREEN)

**Task 2 — Member view h1 Departure Mono (src/app/c/[billId]/page.tsx):**
- Added `style={{ fontFamily: "var(--font-display)" }}` to the "THIS CHIT HAS BEEN TORN UP" h1 (error state)
- Added same style prop to the `{bill.title}` h1 (main view)
- `grep -c` confirms exactly 2 occurrences

## Verification

- All 384 tests pass (43 test files). 5 vitest worker-pool timeout errors are pre-existing infrastructure issue, not test failures.
- `grep -c 'fontFamily: "var(--font-display)"' src/app/c/[billId]/page.tsx` → 2
- No `text-stamp` in new sections confirmed
- Page order: DemoChit → Manglish paragraph → Benefits .chit → How-it-works .chit → START NEW BILL

## Self-Check: PASSED

All acceptance criteria met. No deviations from plan spec.
