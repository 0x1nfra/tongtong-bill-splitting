---
phase: 07-claiming-payment-ux
verified: 2026-06-04T20:40:00Z
status: human_needed
score: 18/18 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Open a dashboard for an active bill — type 'Maybank' in Bank Name, click away. Reload page. Confirm the field still shows 'Maybank' (defaultValue reflects persisted value)."
    expected: "Banking info persists across page reloads. Field shows 'Maybank' after reload."
    why_human: "defaultValue is uncontrolled — it only sets the initial value from the server query. Programmatic grep cannot verify that the Convex subscription re-hydrates the field on page load."
  - test: "Open a bill on the member view with bankName='Maybank' and accountNumber='1234567890'. Confirm TRANSFER TO section appears in PAYMENT ZONE with both fields shown, and no red text is visible in the banking block."
    expected: "TRANSFER TO label visible with 'Bank: Maybank' and 'Account No.: 1234567890' rows. No text-stamp (red) anywhere in the banking info block."
    why_human: "Rendering of optional fields conditional on bill object values — requires a live Convex-backed page to test the display path. Text color correctness in context is a visual check."
  - test: "Open a bill member view with roundingAdjustmentCents set to a non-zero value (e.g. 7). Confirm 'Rounding Adj.' row appears between SST row and GRAND TOTAL in the BILL TOTAL section. Then confirm the row is absent on a bill with roundingAdjustmentCents = 0."
    expected: "Row present for non-zero; row absent for zero. Positive value prefixed with '+', negative without prefix. No red color on the row."
    why_human: "Conditional rendering based on live Convex bill data — grep verifies the JSX exists but not the runtime conditional behavior."
---

# Phase 7: Claiming & Payment UX Verification Report

**Phase Goal:** Members can claim items by quantity (not just one-of), and organizers can display banking transfer info alongside QR
**Verified:** 2026-06-04T20:40:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | updateBankingInfo auth boundary is tested: null bill, wrong secret, and correct secret cases all produce expected results | ✓ VERIFIED | `src/test/updateBankingInfo.test.ts` lines 38–51: 3 it() cases for isAuthorized; all pass (15/15 in isolated run) |
| 2 | updateBankingInfo archive freeze boundary is tested: archivedAt set vs absent | ✓ VERIFIED | `src/test/updateBankingInfo.test.ts` lines 57–69: 3 it() cases for isArchived |
| 3 | XSS sanitization predicate is tested: strings with `<`, `>`, or `"` fail; plain strings and empty strings pass | ✓ VERIFIED | `src/test/updateBankingInfo.test.ts` lines 75–99: 6 it() cases for isSafeText |
| 4 | roundingAdjInBillTotal test documents that calculateTotals returns roundingAdjustmentCents in its output shape | ✓ VERIFIED | `src/test/roundingAdjInBillTotal.test.ts` exists with 3 passthrough assertions; confirmed 15/15 tests pass in isolated vitest run |
| 5 | bills table in schema has 4 new optional string fields: bankName, accountNumber, accountHolderName, duitNowId | ✓ VERIFIED | `convex/schema.ts` lines 16–20: all 4 fields present as `v.optional(v.string())` with "Banking info for transfer payment display (Phase 07)" comment |
| 6 | updateBankingInfo mutation exists in convex/bills.ts with auth guard + archive freeze + XSS sanitization | ✓ VERIFIED | `convex/bills.ts` lines 471–501: exported mutation with two-condition auth check, archivedAt check, `.replace(/[<>"]/g, "")` on all 4 fields before ctx.db.patch |
| 7 | getBillForMember automatically returns new banking fields via spread (no code change needed) | ✓ VERIFIED | `convex/bills.ts` lines 105–110: `...billWithoutSecret` spread includes all table fields automatically; no modification to getBillForMember |
| 8 | BILL TOTAL section shows a Rounding Adj. row between SST and GRAND TOTAL when totals.roundingAdjustmentCents is non-zero | ✓ VERIFIED | `src/app/c/[billId]/page.tsx` lines 735–743: conditional block `{(totals.roundingAdjustmentCents ?? 0) !== 0 ? ... : null}` placed between SST block close and GRAND TOTAL row |
| 9 | BILL TOTAL Rounding Adj. row uses text-pen for positive, text-ink for negative — never text-stamp | ✓ VERIFIED | `src/app/c/[billId]/page.tsx` line 739: ternary `> 0 ? "text-pen" : "text-ink"` with no text-stamp in the new block |
| 10 | BILL TOTAL Rounding Adj. row is absent when totals.roundingAdjustmentCents is 0 or undefined | ✓ VERIFIED | Guard condition `(totals.roundingAdjustmentCents ?? 0) !== 0` collapses to null when 0 or undefined |
| 11 | PAYMENT ZONE shows a TRANSFER TO section below the QR image when at least one banking field is set | ✓ VERIFIED | `src/app/c/[billId]/page.tsx` lines 842–873: outer condition `(bill.bankName \|\| bill.accountNumber \|\| bill.accountHolderName \|\| bill.duitNowId)` gates the block |
| 12 | Banking info section renders individual dot-leader rows only for the fields that are non-empty | ✓ VERIFIED | Each field has its own truthy guard (`{bill.bankName ? ... : null}` pattern at lines 848–871) |
| 13 | Banking info display uses text-ink and text-ink-muted — never text-stamp | ✓ VERIFIED | New markup uses `text-ink` / `text-ink-muted` only; comment at line 842 states "text-ink only, never text-stamp"; grep for text-stamp in member view shows only pre-existing lines 269/311 (EXPIRED stamp, unrelated) |
| 14 | Banking info section is completely absent when no banking field is set | ✓ VERIFIED | Outer OR condition at line 843 renders null when all four fields are falsy |
| 15 | Dashboard wires updateBankingInfo useMutation from api.bills.updateBankingInfo | ✓ VERIFIED | `src/app/dashboard/[billId]/page.tsx` line 70: `const updateBankingInfo = useMutation(api.bills.updateBankingInfo);` |
| 16 | Desktop right panel has 4 banking info input fields after the Rounding Adjustment field | ✓ VERIFIED | Lines 509–597: BANKING INFO comment block with Bank Name, Account No., Account Holder, DuitNow ID fields after rounding adjustment div, before `{/* Quick actions */}` |
| 17 | Mobile quick actions section has the same 4 banking info input fields after its Rounding Adjustment field | ✓ VERIFIED | Lines 748–836: second BANKING INFO comment block with identical 4 fields after mobile rounding adjustment div, before `QUICK ACTIONS` h3 |
| 18 | Each input uses defaultValue (not value) pattern; disabled={isArchived}; onBlur trims and calls mutation | ✓ VERIFIED | All 8 inputs (4 desktop + 4 mobile) use `defaultValue={bill.fieldName ?? ''}`, `disabled={isArchived}`, `onBlur` with `e.target.value.trim()` and `value \|\| undefined` coercion |

**Score:** 18/18 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/test/updateBankingInfo.test.ts` | Pure-predicate boundary tests (min 60 lines) | ✓ VERIFIED | 100 lines, 12 tests across 3 describe blocks |
| `src/test/roundingAdjInBillTotal.test.ts` | calculateTotals shape smoke tests (min 20 lines) | ✓ VERIFIED | 3 tests; isolated run: 15/15 pass |
| `convex/schema.ts` | Extended bills table with 4 banking fields | ✓ VERIFIED | `bankName: v.optional(v.string())` and 3 sibling fields at lines 16–20 |
| `convex/bills.ts` | `updateBankingInfo` mutation exported | ✓ VERIFIED | Exported at line 475; full auth + archive + XSS + patch implementation |
| `src/app/c/[billId]/page.tsx` | UAT gap fix + banking info display ("TRANSFER TO") | ✓ VERIFIED | Both insertions present; grep confirms "TRANSFER TO" and "UAT gap fix" comment |
| `src/app/dashboard/[billId]/page.tsx` | Banking info input fields + updateBankingInfo wired | ✓ VERIFIED | useMutation at line 70; 4+4 inputs in desktop/mobile panels |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/test/updateBankingInfo.test.ts` | `convex/bills.ts updateBankingInfo` | documents contract via inline predicate functions | ✓ VERIFIED | Pattern `isSafeText\|isAuthorized\|isArchived` found in test file |
| `src/test/roundingAdjInBillTotal.test.ts` | `src/lib/calculateTotals.ts` | import + `roundingAdjustmentCents` passthrough assertion | ✓ VERIFIED | `roundingAdjustmentCents` pattern confirmed in test file |
| `convex/bills.ts updateBankingInfo` | `convex/schema.ts bills table` | `ctx.db.patch` with all 4 banking fields | ✓ VERIFIED | Lines 494–498: patch object contains `bankName`, `accountNumber`, `accountHolderName`, `duitNowId` |
| `convex/bills.ts getBillForMember` | `convex/schema.ts bills table` | `...billWithoutSecret` spread auto-includes new fields | ✓ VERIFIED | Line 110: `{ ...billWithoutSecret, items, claims, qrUrl, receiptUrl }` |
| `src/app/c/[billId]/page.tsx BILL TOTAL zone` | `src/lib/calculateTotals.ts` | `totals.roundingAdjustmentCents` already computed at line 343 | ✓ VERIFIED | Line 343: `calculateTotals(items, bill.applySST, bill.applyServiceCharge, bill.roundingAdjustmentCents ?? 0)` |
| `src/app/c/[billId]/page.tsx PAYMENT ZONE` | `convex/bills.ts getBillForMember` | `bill.bankName`, `bill.accountNumber`, etc. auto-included via spread | ✓ VERIFIED | Lines 843/848/854/860/866 access `bill.bankName`, `bill.accountNumber`, `bill.accountHolderName`, `bill.duitNowId` |
| `src/app/dashboard/[billId]/page.tsx useMutation` | `convex/bills.ts updateBankingInfo` | `useMutation(api.bills.updateBankingInfo)` | ✓ VERIFIED | Line 70 |
| dashboard banking inputs | bill object from useQuery | `defaultValue={bill.bankName ?? ''}` pattern | ✓ VERIFIED | Lines 516, 538, 560, 582 (desktop) and 755, 777, 799, 821 (mobile) |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `src/app/c/[billId]/page.tsx` banking info block | `bill.bankName`, `bill.accountNumber`, `bill.accountHolderName`, `bill.duitNowId` | `getBillForMember` Convex query (line 343 context; `...billWithoutSecret` spread) | Yes — fields come from real DB row via Convex subscription | ✓ FLOWING |
| `src/app/c/[billId]/page.tsx` BILL TOTAL rounding adj row | `totals.roundingAdjustmentCents` | `calculateTotals(items, ..., bill.roundingAdjustmentCents ?? 0)` at line 343 — reads from live Convex bill object | Yes — computed from real schema field | ✓ FLOWING |
| `src/app/dashboard/[billId]/page.tsx` banking inputs | `bill.bankName ?? ''` etc. as defaultValue | `getBillForOrganizer` Convex query; `bill` object from `data.bill` | Yes — reads from real DB via Convex subscription | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| updateBankingInfo.test.ts passes (12 tests) | `npx vitest run src/test/updateBankingInfo.test.ts` | `Test Files 2 passed (2), Tests 15 passed (15)` (run with roundingAdjInBillTotal together) | ✓ PASS |
| roundingAdjInBillTotal.test.ts passes (3 tests) | `npx vitest run src/test/roundingAdjInBillTotal.test.ts` | included in above run | ✓ PASS |
| schema has 4 banking fields | `grep -c "bankName\|accountNumber\|accountHolderName\|duitNowId" convex/schema.ts` | 4 | ✓ PASS |
| dashboard has updateBankingInfo wired | `grep -c "updateBankingInfo" src/app/dashboard/[billId]/page.tsx` | matches found at line 70 + 8 onBlur callsites | ✓ PASS |
| member view has TRANSFER TO block | `grep -c "TRANSFER TO\|BANKING INFO" src/app/c/[billId]/page.tsx` | 2 | ✓ PASS |

### Probe Execution

Step 7c: SKIPPED — no `scripts/*/tests/probe-*.sh` found; phase uses vitest tests and grep-based spot checks only.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| CLAIM-BANK-01 | 07-01, 07-02 | Banking info fields + updateBankingInfo mutation with auth/archive/XSS | ✓ SATISFIED | 4 schema fields verified in convex/schema.ts; mutation exported from convex/bills.ts with all guards; TDD tests pass |
| CLAIM-BANK-DISPLAY-01 | 07-03 | TRANSFER TO section displayed on member view in PAYMENT ZONE | ✓ SATISFIED | Conditional block at src/app/c/[billId]/page.tsx lines 842–873; per-field conditional rendering confirmed |
| CLAIM-BANK-DASH-01 | 07-04 | Banking info inputs in organizer dashboard (desktop + mobile) | ✓ SATISFIED | 4 inputs in desktop panel (lines 509–597) and 4 inputs in mobile panel (lines 748–836); all wired to useMutation |
| UAT-ADJ-01 | 07-01, 07-03 | Rounding Adj. row shown in BILL TOTAL section of member view | ✓ SATISFIED | Conditional block at src/app/c/[billId]/page.tsx lines 735–743; text-pen/text-ink color logic verified |

**Note:** CLAIM-BANK-01, CLAIM-BANK-DISPLAY-01, CLAIM-BANK-DASH-01, and UAT-ADJ-01 are phase-internal requirement IDs defined in the ROADMAP.md Phase 7 section. They do not appear in REQUIREMENTS.md (which only covers v1/v2 formal requirements). No orphaned requirements were found in REQUIREMENTS.md for Phase 7.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None found | — | — | — | No TBD/FIXME/XXX markers, no placeholder returns, no empty handlers in new code |

The 8 pre-existing test failures (SettleStamp.test.tsx, StatusBadge.test.tsx, landingPage.test.tsx) were introduced before Phase 7 and are documented in 07-02-SUMMARY.md and 07-04-SUMMARY.md as out-of-scope. They do not affect Phase 7 goal achievement.

### Human Verification Required

#### 1. Dashboard banking info persistence across page reload

**Test:** Open a dashboard for an active bill. Type "Maybank" in the Bank Name field. Click outside the field (triggers onBlur). Reload the page.
**Expected:** The Bank Name field shows "Maybank" after reload, confirming the mutation fired and the Convex subscription re-hydrates the defaultValue from the updated bill record.
**Why human:** `defaultValue` is uncontrolled — it only reads the initial value on mount. Grep cannot verify that the Convex reactive subscription returns updated bill data that will be reflected in the defaultValue on the next mount.

#### 2. Member view banking info display (end-to-end)

**Test:** Set bankName="Maybank" and accountNumber="1234567890" on a bill via the dashboard. Open the member view for that bill. Check the PAYMENT ZONE section.
**Expected:** A "TRANSFER TO" heading appears, with "Bank — Maybank" and "Account No. — 1234567890" dot-leader rows. No red color (#B91C1C) in the banking section. Fields not set (accountHolderName, duitNowId) do not render rows.
**Why human:** Requires live Convex backend and a browser to test conditional field rendering with real data. Visual color check for text-stamp absence in rendering context.

#### 3. Member view Rounding Adj. row in BILL TOTAL (end-to-end)

**Test:** Create a bill with roundingAdjustmentCents = 7. Open the member view. Look at the BILL TOTAL section.
**Expected:** A "Rounding Adj." row appears between the SST (or service charge) row and GRAND TOTAL, showing "+RM0.07" in blue (text-pen). On a bill with roundingAdjustmentCents = 0, the row is absent entirely.
**Why human:** Conditional rendering depends on live Convex bill data and the calculated totals object at runtime.

### Gaps Summary

No gaps. All 18 must-have truths are verified against the actual codebase. The 3 human verification items are functional/visual end-to-end checks that cannot be verified programmatically without a running Convex backend and browser.

---

_Verified: 2026-06-04T20:40:00Z_
_Verifier: Claude (gsd-verifier)_
