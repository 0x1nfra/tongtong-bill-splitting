---
status: complete
phase: 05-bonus-additions-departure-mono-headings-landing-page-enhance
source: [05-01-SUMMARY.md, 05-02-SUMMARY.md, 05-03-SUMMARY.md, 05-04-SUMMARY.md]
started: 2026-05-30T00:00:00Z
updated: 2026-05-30T06:00:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

[testing complete]

## Tests

### 1. Landing page benefits section
expected: Open the landing page. Below the DemoChit hero, a "WHY TONGTONG?" chit section appears with 3 dot-leader rows: "No more chasing lah ✓", "See your exact share, live ✓", "Pay with DuitNow QR ✓". No red text used in this section.
result: pass

### 2. Landing page how-it-works section
expected: On the landing page, below the benefits section, a "HOW IT WORKS" chit section appears with 3 numbered steps (01. / 02. / 03.) separated by thin horizontal rules. Step numbers render in Departure Mono font. No red text used.
result: pass

### 3. Landing page section order
expected: Scrolling top to bottom: DemoChit hero → Manglish paragraph → WHY TONGTONG? (benefits) → HOW IT WORKS → START NEW BILL CTA. The CTA appears after the how-it-works section, not before it.
result: pass

### 4. Member view Departure Mono heading
expected: Open a bill's member/claim view (/c/[billId]). The bill title h1 at the top renders in Departure Mono — a distinct monospaced font visibly different from body text.
result: pass

### 5. Create page Departure Mono heading
expected: Open /create. The "CREATE NEW CHIT" h1 heading renders in Departure Mono — visibly distinct monospaced font.
result: pass

### 6. Create page receipt upload
expected: On the /create page, a "RECEIPT PHOTO (OPTIONAL)" upload section appears above the items list. Can interact with it (click to select a photo). The field is optional — bill can be created without uploading.
result: pass

### 7. Dashboard Departure Mono headings
expected: Open the organizer dashboard for a bill. The bill title h1 renders in Departure Mono font.
result: pass

### 8. Dashboard QR upload button
expected: On the organizer dashboard quick actions, an "UPLOAD QR" button appears (or "REPLACE QR" if a QR is already set). Clicking it opens a file picker for uploading a QR image.
result: pass

## Summary

total: 8
passed: 8
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

[none yet]
