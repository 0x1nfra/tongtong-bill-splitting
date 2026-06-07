---
phase: 07-claiming-payment-ux
verified: 2026-06-05T16:16:00Z
status: human_needed
score: 21/21 must-haves verified
overrides_applied: 0
re_verification:
  previous_status: human_needed
  previous_score: 18/18
  gaps_closed: []
  gaps_remaining: []
  new_truths_added:
    - "Plan 07-05: Organizer can enter banking info at bill creation (CLAIM-BANK-01 gap closure)"
    - "Plan 07-05: createBill mutation accepts and sanitizes 4 optional banking info fields"
    - "Plan 07-05: Create page has PAYMENT DETAILS section with 4 controlled inputs wired to createBill"
  regressions: []
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
  - test: "Open /create. Fill in items. Fill in PAYMENT DETAILS fields: Bank Name='Maybank', Account No.='1234567890'. Tap GENERATE LINK. Open /c/[billId] — confirm TRANSFER TO block shows 'Maybank' and '1234567890' without any dashboard visit."
    expected: "Banking info entered on the create page is visible in the member view PAYMENT ZONE immediately after bill creation, with no additional dashboard configuration needed."
    why_human: "End-to-end flow requires a live Convex backend. The create→bill→member-view data path cannot be verified by static analysis alone."
---

# Phase 7: Claiming & Payment UX Verification Report

**Phase Goal:** Banking info on bill creation and member view payment display (CLAIM-BANK-01, CLAIM-BANK-DISPLAY-01, CLAIM-BANK-DASH-01, UAT-ADJ-01)
**Verified:** 2026-06-05T16:16:00Z
**Status:** human_needed
**Re-verification:** Yes — after 07-05 gap closure plan (banking info at bill creation). Previous score: 18/18. New truths added from Plan 07-05.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | updateBankingInfo auth boundary is tested: null bill, wrong secret, and correct secret cases all produce expected results | ✓ VERIFIED | `src/test/updateBankingInfo.test.ts` lines 38–51: 3 it() cases for isAuthorized; 15/15 tests pass in isolated run |
| 2 | updateBankingInfo archive freeze boundary is tested: archivedAt set vs absent | ✓ VERIFIED | `src/test/updateBankingInfo.test.ts` lines 57–69: 3 it() cases for isArchived |
| 3 | XSS sanitization predicate is tested: strings with `<`, `>`, or `"` fail; plain strings and empty strings pass | ✓ VERIFIED | `src/test/updateBankingInfo.test.ts` lines 75–99: 6 it() cases for isSafeText |
| 4 | roundingAdjInBillTotal test documents that calculateTotals returns roundingAdjustmentCents in its output shape | ✓ VERIFIED | `src/test/roundingAdjInBillTotal.test.ts` exists with 3 passthrough assertions; 15/15 tests pass in isolated vitest run |
| 5 | bills table in schema has 4 new optional string fields: bankName, accountNumber, accountHolderName, duitNowId | ✓ VERIFIED | `convex/schema.ts` lines 16–20: all 4 fields present as `v.optional(v.string())` with "Banking info for transfer payment display (Phase 07)" comment |
| 6 | updateBankingInfo mutation exists in convex/bills.ts with auth guard + archive freeze + XSS sanitization | ✓ VERIFIED | `convex/bills.ts` lines 492–518: exported mutation with two-condition auth check, archivedAt check, `.replace(/[<>"]/g, "")` + `.trim()` on all 4 fields before ctx.db.patch |
| 7 | getBillForMember automatically returns new banking fields via spread (no code change needed) | ✓ VERIFIED | `convex/bills.ts` lines 105–110: `...billWithoutSecret` spread includes all table fields automatically |
| 8 | BILL TOTAL section shows a Rounding Adj. row between SST and GRAND TOTAL when totals.roundingAdjustmentCents is non-zero | ✓ VERIFIED | `src/app/c/[billId]/page.tsx` lines 735–743: conditional block `{(totals.roundingAdjustmentCents ?? 0) !== 0 ? ... : null}` placed between SST block close and GRAND TOTAL row |
| 9 | BILL TOTAL Rounding Adj. row uses text-pen for positive, text-ink for negative — never text-stamp | ✓ VERIFIED | `src/app/c/[billId]/page.tsx` line 739: ternary `> 0 ? "text-pen" : "text-ink"` with no text-stamp in the new block |
| 10 | BILL TOTAL Rounding Adj. row is absent when totals.roundingAdjustmentCents is 0 or undefined | ✓ VERIFIED | Guard condition `(totals.roundingAdjustmentCents ?? 0) !== 0` collapses to null when 0 or undefined |
| 11 | PAYMENT ZONE shows a TRANSFER TO section below the QR image when at least one banking field is set | ✓ VERIFIED | `src/app/c/[billId]/page.tsx` lines 842–873: outer condition `(bill.bankName \|\| bill.accountNumber \|\| bill.accountHolderName \|\| bill.duitNowId)` gates the block |
| 12 | Banking info section renders individual dot-leader rows only for the fields that are non-empty | ✓ VERIFIED | Each field has its own truthy guard (`{bill.bankName ? ... : null}` pattern at lines 848–871) |
| 13 | Banking info display uses text-ink and text-ink-muted — never text-stamp | ✓ VERIFIED | New markup uses `text-ink` / `text-ink-muted` only; comment at line 842 states "text-ink only, never text-stamp" |
| 14 | Banking info section is completely absent when no banking field is set | ✓ VERIFIED | Outer OR condition at line 843 renders null when all four fields are falsy |
| 15 | Dashboard wires updateBankingInfo useMutation from api.bills.updateBankingInfo | ✓ VERIFIED | `src/app/dashboard/[billId]/page.tsx` line 70: `const updateBankingInfo = useMutation(api.bills.updateBankingInfo);` |
| 16 | Desktop right panel has 4 banking info input fields after the Rounding Adjustment field | ✓ VERIFIED | Lines 529–615: BANKING INFO comment block with Bank Name, Account No., Account Holder, DuitNow ID fields before `{/* Quick actions */}` |
| 17 | Mobile quick actions section has the same 4 banking info input fields after its Rounding Adjustment field | ✓ VERIFIED | Lines 766–852: second BANKING INFO comment block with identical 4 fields before `QUICK ACTIONS` h3 |
| 18 | Each input uses defaultValue (not value) pattern; disabled={isArchived}; onBlur reads all 4 field values from DOM container ref and calls mutation | ✓ VERIFIED | All 8 inputs (4 desktop + 4 mobile) use `defaultValue={bill.fieldName ?? ''}`, `disabled={isArchived}`, `onBlur` with `readBankInfoFromContainer(ref)` spread into updateBankingInfo call; stale-closure fix applied via `data-field` + container ref |
| 19 | Organizer can enter banking info at bill creation — create page has PAYMENT DETAILS section with 4 controlled inputs | ✓ VERIFIED | `src/app/create/page.tsx` lines 327–387: PAYMENT DETAILS ZONE section with 4 labeled inputs (Bank Name, Account No., Account Holder, DuitNow ID), each controlled by useState |
| 20 | createBill mutation accepts 4 optional banking info args and applies XSS sanitization before insert | ✓ VERIFIED | `convex/bills.ts` lines 21–24 (args) and 46–65 (handler): all 4 fields present as `v.optional(v.string())`, each sanitized with `.replace(/[<>"]/g, "").trim()` before `ctx.db.insert` |
| 21 | Banking info entered on create page flows through createBill to the bill document (key link wired) | ✓ VERIFIED | `src/app/create/page.tsx` lines 126–129: `bankName: bankName \|\| undefined`, `accountNumber: accountNumber \|\| undefined`, `accountHolderName: accountHolderName \|\| undefined`, `duitNowId: duitNowId \|\| undefined` passed to createBill call |

**Score:** 21/21 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/test/updateBankingInfo.test.ts` | Pure-predicate boundary tests (min 60 lines) | ✓ VERIFIED | 99 lines, 12 tests across 3 describe blocks; 15/15 pass |
| `src/test/roundingAdjInBillTotal.test.ts` | calculateTotals shape smoke tests (min 20 lines) | ✓ VERIFIED | 26 lines, 3 tests; 15/15 pass in isolated run |
| `convex/schema.ts` | Extended bills table with 4 banking fields | ✓ VERIFIED | `bankName: v.optional(v.string())` and 3 sibling fields at lines 17–20 |
| `convex/bills.ts` | `updateBankingInfo` mutation exported + `createBill` extended | ✓ VERIFIED | `updateBankingInfo` exported at line 492; `createBill` extended with 4 optional banking args at lines 21–24 with XSS sanitization at lines 47–50 |
| `src/app/c/[billId]/page.tsx` | UAT gap fix + banking info display ("TRANSFER TO") | ✓ VERIFIED | Both insertions present; "UAT gap fix" comment at line 735, "TRANSFER TO" at line 846 |
| `src/app/dashboard/[billId]/page.tsx` | Banking info input fields + updateBankingInfo wired | ✓ VERIFIED | useMutation at line 70; 4+4 inputs in desktop/mobile panels with stale-closure fix via container refs |
| `src/app/create/page.tsx` | PAYMENT DETAILS section with 4 controlled inputs + state wired to createBill | ✓ VERIFIED | 4 useState hooks at lines 55–58; PAYMENT DETAILS section at lines 327–387; all 4 fields passed to createBill at lines 126–129 |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/test/updateBankingInfo.test.ts` | `convex/bills.ts updateBankingInfo` | documents contract via inline predicate functions | ✓ VERIFIED | Pattern `isSafeText\|isAuthorized\|isArchived` found in test file |
| `src/test/roundingAdjInBillTotal.test.ts` | `src/lib/calculateTotals.ts` | import + `roundingAdjustmentCents` passthrough assertion | ✓ VERIFIED | `roundingAdjustmentCents` pattern confirmed in test file |
| `convex/bills.ts updateBankingInfo` | `convex/schema.ts bills table` | `ctx.db.patch` with all 4 banking fields | ✓ VERIFIED | Lines 511–515: patch object contains all 4 banking fields |
| `convex/bills.ts createBill` | `convex/schema.ts bills table` | `ctx.db.insert` with 4 sanitized banking fields | ✓ VERIFIED | Lines 62–65: insert object contains `bankName: sanitizedBankName`, `accountNumber: sanitizedAccountNumber`, `accountHolderName: sanitizedAccountHolderName`, `duitNowId: sanitizedDuitNowId` |
| `convex/bills.ts getBillForMember` | `convex/schema.ts bills table` | `...billWithoutSecret` spread auto-includes new fields | ✓ VERIFIED | `{ ...billWithoutSecret, items, claims, qrUrl, receiptUrl }` |
| `src/app/c/[billId]/page.tsx BILL TOTAL zone` | `src/lib/calculateTotals.ts` | `totals.roundingAdjustmentCents` computed at line 343 | ✓ VERIFIED | Line 343: `calculateTotals(items, bill.applySST, bill.applyServiceCharge, bill.roundingAdjustmentCents ?? 0)` |
| `src/app/c/[billId]/page.tsx PAYMENT ZONE` | `convex/bills.ts getBillForMember` | `bill.bankName`, `bill.accountNumber`, etc. auto-included via spread | ✓ VERIFIED | Lines 843/848/854/860/866 access `bill.bankName`, `bill.accountNumber`, `bill.accountHolderName`, `bill.duitNowId` |
| `src/app/dashboard/[billId]/page.tsx useMutation` | `convex/bills.ts updateBankingInfo` | `useMutation(api.bills.updateBankingInfo)` | ✓ VERIFIED | Line 70 |
| `dashboard banking inputs` | `bill object from useQuery` | `defaultValue={bill.bankName ?? ''}` pattern with container ref DOM read | ✓ VERIFIED | Desktop refs lines 536–613; mobile refs lines 775–850; `readBankInfoFromContainer` helper at lines 77–88 |
| `src/app/create/page.tsx` | `convex/bills.ts createBill` | `createBill({ bankName, accountNumber, accountHolderName, duitNowId })` | ✓ VERIFIED | Lines 126–129: all 4 fields passed as `field \|\| undefined` |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `src/app/c/[billId]/page.tsx` banking info block | `bill.bankName`, `bill.accountNumber`, `bill.accountHolderName`, `bill.duitNowId` | `getBillForMember` Convex query via `...billWithoutSecret` spread | Yes — fields come from real DB row via Convex subscription | ✓ FLOWING |
| `src/app/c/[billId]/page.tsx` BILL TOTAL rounding adj row | `totals.roundingAdjustmentCents` | `calculateTotals(items, ..., bill.roundingAdjustmentCents ?? 0)` at line 343 — reads from live Convex bill object | Yes — computed from real schema field | ✓ FLOWING |
| `src/app/dashboard/[billId]/page.tsx` banking inputs | `bill.bankName ?? ''` etc. as defaultValue | `getBillForOrganizer` Convex query; `bill` object from `data.bill` | Yes — reads from real DB via Convex subscription | ✓ FLOWING |
| `src/app/create/page.tsx` banking info state | `bankName`, `accountNumber`, `accountHolderName`, `duitNowId` useState | User input → state → createBill mutation → DB insert | Yes — controlled inputs wired directly to createBill args | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| updateBankingInfo.test.ts passes (12 tests) | `npx vitest run src/test/updateBankingInfo.test.ts` | `Test Files 2 passed (2), Tests 15 passed (15)` | ✓ PASS |
| roundingAdjInBillTotal.test.ts passes (3 tests) | `npx vitest run src/test/roundingAdjInBillTotal.test.ts` | included in above run | ✓ PASS |
| schema has 4 banking fields | `grep -c "bankName\|accountNumber\|accountHolderName\|duitNowId" convex/schema.ts` | 4 | ✓ PASS |
| dashboard has updateBankingInfo wired | `grep -c "updateBankingInfo" src/app/dashboard/[billId]/page.tsx` | Multiple matches: line 70 (useMutation) + onBlur callsites in both panels | ✓ PASS |
| member view has TRANSFER TO block | `grep -c "TRANSFER TO\|BANKING INFO" src/app/c/[billId]/page.tsx` | 2 | ✓ PASS |
| createBill has banking info args | `grep -c "bankName: v.optional(v.string())" convex/bills.ts` | 2 (createBill + updateBankingInfo) | ✓ PASS |
| create page has PAYMENT DETAILS section | `grep "PAYMENT DETAILS\|bankName.*useState" src/app/create/page.tsx` | line 55 (useState), line 327 (PAYMENT DETAILS ZONE) | ✓ PASS |
| Full test suite — 8 pre-existing failures, 0 new regressions | `npx vitest run` | `3 failed \| 16 passed (19)` — same 8 failures (SettleStamp, StatusBadge, landingPage) that pre-date Phase 7 per git history | ✓ PASS (no regressions) |

### Probe Execution

Step 7c: SKIPPED — no `scripts/*/tests/probe-*.sh` found; phase uses vitest tests and grep-based spot checks only.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| CLAIM-BANK-01 | 07-01, 07-02, 07-05 | Banking info fields + updateBankingInfo mutation with auth/archive/XSS + banking info at bill creation via createBill + create page PAYMENT DETAILS section | ✓ SATISFIED | 4 schema fields in convex/schema.ts; mutation exported from convex/bills.ts with all guards; createBill extended with 4 optional banking args; create page PAYMENT DETAILS section with 4 controlled inputs; all wired through to createBill submission |
| CLAIM-BANK-DISPLAY-01 | 07-03 | TRANSFER TO section displayed on member view in PAYMENT ZONE | ✓ SATISFIED | Conditional block at src/app/c/[billId]/page.tsx lines 842–873; per-field conditional rendering confirmed |
| CLAIM-BANK-DASH-01 | 07-04 | Banking info inputs in organizer dashboard (desktop + mobile) | ✓ SATISFIED | 4 inputs in desktop panel (lines 529–615) and 4 inputs in mobile panel (lines 766–852); all wired to useMutation via container ref pattern |
| UAT-ADJ-01 | 07-01, 07-03 | Rounding Adj. row shown in BILL TOTAL section of member view | ✓ SATISFIED | Conditional block at src/app/c/[billId]/page.tsx lines 735–743; text-pen/text-ink color logic verified |

**Note on REQUIREMENTS.md coverage:** CLAIM-BANK-01, CLAIM-BANK-DISPLAY-01, CLAIM-BANK-DASH-01, and UAT-ADJ-01 are phase-internal requirement IDs defined in ROADMAP.md Phase 7. They do not appear in REQUIREMENTS.md (which covers v1/v2 formal requirements mapped to Phases 1–3). No orphaned requirements were found in REQUIREMENTS.md for Phase 7 — all REQUIREMENTS.md IDs are mapped to Phases 1–3 per the traceability table.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/app/dashboard/[billId]/page.tsx` | 186 | `"#TT-XXXX"` string literal in a comment | ℹ️ Info | False positive — this is a documentation string describing the display code format `#TT-{first4chars}`, not a debt marker. No action required. |

No TBD, FIXME, or XXX debt markers found in Phase 7 files. No placeholder returns, empty handlers, or stub implementations. The 8 pre-existing test failures (SettleStamp.test.tsx, StatusBadge.test.tsx, landingPage.test.tsx) pre-date Phase 7 and are out-of-scope.

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

#### 4. Banking info entered at creation flows to member view (end-to-end)

**Test:** Open /create. Add items. Fill in PAYMENT DETAILS fields: Bank Name = "Maybank", Account No. = "1234567890". Tap GENERATE LINK. Open the resulting /c/[billId] URL directly (no dashboard visit).
**Expected:** The member view PAYMENT ZONE shows a "TRANSFER TO" section with "Bank — Maybank" and "Account No. — 1234567890" immediately, without the organizer needing to enter banking info in the dashboard afterward.
**Why human:** End-to-end create→view flow requires a live Convex backend and browser. Static analysis confirms the wiring but cannot execute the data flow.

### Gaps Summary

No gaps. All 21 must-have truths (18 from the original verification plus 3 new truths from Plan 07-05) are verified against the actual codebase. The 4 human verification items are functional/visual end-to-end checks that require a running Convex backend and browser.

**Re-verification outcome:** The previous verification (2026-06-04, 18/18) was run before Plan 07-05 (banking info at bill creation) was executed. This re-verification adds 3 new truths covering Plan 07-05 and confirms no regressions in the previously verified truths. The overall phase goal — banking info on bill creation AND member view payment display — is now fully implemented at the code level.

---

_Verified: 2026-06-05T16:16:00Z_
_Verifier: Claude (gsd-verifier)_
