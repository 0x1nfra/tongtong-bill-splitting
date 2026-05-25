---
phase: "03"
slug: tongtong-aesthetic
status: audited
nyquist_compliant: false
wave_0_complete: true
created: 2026-05-26
---

# Phase 03 — Validation Strategy

> Retroactively generated from PLAN/SUMMARY artifacts (State B). All 4 plans executed and verified during execution. 27 new tests added by Nyquist audit.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.x + @testing-library/react + jsdom |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `pnpm test` |
| **Full suite command** | `pnpm test` |
| **Estimated runtime** | ~2s |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test`
- **After every plan wave:** Run `pnpm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~2 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirements | Threat Ref | Secure Behavior | Test Type | Automated Command | Test File | Status |
|---------|------|------|--------------|------------|-----------------|-----------|-------------------|-----------|--------|
| 03-01-01 | 01 | 1 | UI-01, UI-02, UI-05 | T-03-01, T-03-02 | No CDN @imports — eliminates Google/cdnfonts ping | grep | `grep -c "fonts.googleapis.com" src/app/globals.css` → 0 | — | ✅ green |
| 03-01-02 | 01 | 1 | UI-01, UI-02 | T-03-SC | No new npm packages; next/font built-in | grep | `grep -c "use client" src/app/layout.tsx` → 0 | — | ✅ green |
| 03-02-01 | 02 | 2 | UI-05, LAND-01 | T-03-03 | Hardcoded data only — no real bill data exposed | unit | `pnpm test` | `src/test/DemoChit.test.tsx` | ✅ green |
| 03-02-02 | 02 | 2 | UI-05, UI-07, UI-08, LAND-01, LAND-02, LAND-03 | T-03-04 | Animation timer cleaned up on unmount | unit | `pnpm test` | `src/test/SettleStamp.test.tsx`, `src/test/landingPage.test.tsx` | ✅ green |
| 03-03-01 | 03 | 2 | UI-03, UI-06, UI-12, UI-13 | T-03-05, T-03-06 | Skeleton shows placeholder bars — no bill data during load | manual | — see Manual-Only table — | — | ⚠️ manual |
| 03-03-02 | 03 | 2 | UI-03, UI-04, UI-06, UI-07, UI-09, UI-10 | T-03-SC | No logic/auth changes; CSS class application only | unit + manual | `pnpm test` (UI-09) | `src/test/rotationDeg.test.ts` | ✅ green |
| 03-04-01 | 04 | 3 | UI-03, UI-04, UI-06, UI-07, UI-11 | T-03-08 | Only CSS classes changed; no new endpoints or auth paths | manual | — see Manual-Only table — | — | ⚠️ manual |
| 03-04-02 | 04 | 3 | UI-11, UI-12 | T-03-07, T-03-08 | Skeleton shows placeholder bars only; 2-col layout preserved | manual | — see Manual-Only table — | — | ⚠️ manual |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ manual-only*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. vitest already configured with jsdom + @testing-library/react + @testing-library/jest-dom. No install step needed.

New test files created by Nyquist audit:
- `src/test/rotationDeg.test.ts` — UI-09 rotation formula (7 tests)
- `src/test/DemoChit.test.tsx` — LAND-01 DemoChit structure (10 tests)
- `src/test/landingPage.test.tsx` — UI-08 logotype, LAND-01/03 (6 tests)
- `src/test/SettleStamp.test.tsx` — extended with UI-05 animation guard (4 new tests)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Warm paper background (#EEEAE2), chit surface (#F4EFE6), correct color roles | UI-01 | Color values only verifiable visually or via computed CSS — not unit-testable | Open app in browser, inspect background colors on all 4 screens |
| Departure Mono in logotype/stamps; JetBrains Mono in item rows; Bungee for SETTLE | UI-02 | Font loading verified by DevTools Network tab (no CDN requests) + rendered glyphs | DevTools → Network filter: font — should show only /fonts/DepartureMono-Regular.woff2, no googleapis or cdnfonts requests |
| Dot-leader visual alignment (name····price) on item rows | UI-03 | CSS ::after pseudo-element not rendered in jsdom | Verify in browser — item names and prices visually connected by dots |
| Hairline rules (0.5px) between item rows | UI-04 | Sub-pixel borders not inspectable via unit tests | Verify `hr.rule-hairline` between items in member view; check 0.5px border |
| Perforation mark dividers between chit sections | UI-06 | CSS repeating-linear-gradient — visual only | Confirm dashed perforation line renders between ITEMS/GRAND TOTAL and other sections |
| GENERATE LINK + START NEW BILL buttons: no border-radius (chop style) | UI-07 | Verified by grep during execution (`grep -c "rounded" src/app/create/page.tsx` → 0); visual confirmation needed | Load bill builder, inspect buttons — no rounded corners |
| Desktop 2-column dashboard layout (md:grid-cols-[60%_40%]) | UI-10 | CSS media queries require browser viewport | Load dashboard at ≥768px width — left/right columns should appear side-by-side |
| Dashboard NOTHING HERE YET empty state in .chit wrapper | UI-11 | dashboard/[billId]/page.tsx uses Convex hooks — requires real or mocked Convex backend | Create a bill with no payments, open dashboard — should see NOTHING HERE YET card with COPY SHARE LINK button |
| Member view loading skeleton (animate-pulse bars) | UI-12 | src/app/c/[billId]/page.tsx uses Convex hooks — not unit-testable without backend | Load a valid bill URL before Convex data resolves — should see gray animated bars, not LOADING... text |
| Member view expired/null state: EXPIRED stamp + THIS CHIT HAS BEEN TORN UP | UI-13 | Same Convex dependency as UI-12 | Navigate to a nonexistent billId — should see EXPIRED stamp in chit wrapper with correct copy |
| Tagline above demo chit; flavor copy below (D-02 layout order) | LAND-02 | Vertical layout order not testable via text queries alone | Visual check: "SPLIT THE BILL..." appears above DemoChit; Manglish copy appears below |
| START NEW BILL button: full-width chop style with no border-radius | LAND-03 | Chop aesthetic is visual (no-rounded verified by class check); full-width layout is visual | Verify button spans full width on mobile viewport with no rounded corners |

---

## Validation Audit 2026-05-26

| Metric | Count |
|--------|-------|
| Gaps found | 7 |
| Resolved (automated) | 4 |
| Escalated (manual-only) | 9 |
| Existing tests confirmed passing | 93 |
| New tests added | 27 |
| Total suite after audit | 120 |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or manual-only entry
- [x] Wave 0 covers all MISSING automated references
- [x] No watch-mode flags
- [x] Feedback latency < 2s
- [ ] Sampling continuity: 3 consecutive tasks with Convex-dep requirements use manual-only (UI-11/12/13) — acceptable for CSS/aesthetic phase
- [ ] `nyquist_compliant: true` — NOT set; visual/aesthetic requirements and Convex-dependent states are manual-only by necessity

**Approval:** audited 2026-05-26 (partial — 4 automated, 9 manual-only)
