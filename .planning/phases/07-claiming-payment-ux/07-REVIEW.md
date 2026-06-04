---
phase: 07
status: has-findings
critical: 1
warning: 4
info: 3
files_reviewed: 6
files_reviewed_list:
  - convex/bills.ts
  - convex/schema.ts
  - src/app/c/[billId]/page.tsx
  - src/app/dashboard/[billId]/page.tsx
  - src/test/roundingAdjInBillTotal.test.ts
  - src/test/updateBankingInfo.test.ts
reviewed: 2026-06-04T00:00:00Z
depth: standard
findings:
  critical: 1
  warning: 4
  info: 3
  total: 8
---

# Phase 07: Code Review Report

**Reviewed:** 2026-06-04
**Depth:** standard
**Files Reviewed:** 6
**Status:** has-findings

## Summary

Phase 07 extends the schema with 4 banking info fields, wires `updateBankingInfo` mutation with auth + archive freeze + XSS sanitization, adds a Rounding Adj. row to the BILL TOTAL section of the member view, and adds banking info display in the member PAYMENT ZONE and corresponding organizer input fields in the dashboard. The scope is tightly bounded; the XSS sanitization contract and auth guard are correctly implemented and validated by TDD tests.

One critical correctness bug was found: the `updateBankingInfo` mutation can silently erase previously saved banking fields whenever the organizer edits a different field from a stale read. The remaining findings are warnings/info-level issues around label accessibility, stale DOM value behaviour, and test coverage gaps.

---

## Critical Issues

### CR-01: Banking info fields silently overwritten on concurrent or stale edits

**File:** `src/app/dashboard/[billId]/page.tsx:519-527` (desktop), `757-766` (mobile, same pattern × 4 handlers)

**Issue:** Each `onBlur` handler reads the three sibling field values from the Convex reactive `bill` object at the time of blur, not from the DOM. This is intentional (avoids needing refs/controlled state), but it creates a data-loss window:

1. Organizer opens dashboard; all four fields load with current values.
2. Organizer types a new Bank Name and immediately types a new Account Number.
3. The Bank Name `onBlur` fires first. At that instant, `bill.accountNumber` still holds the **old** value from the Convex subscription, so the mutation sends `accountNumber: <old value>`.
4. The Account Number `onBlur` fires next, this time with the newly typed value, and overwrites with the correct value.

In the typical "type and tab" sequence this self-heals. But if the organizer types in field A, blurs to field B, types in field B, and quickly blurs out of field B before the Convex subscription has re-delivered the updated value from step 3, field A's new value will be clobbered to the old value from the DB.

Additionally, and more concretely: if two organizer devices are open simultaneously (unlikely but possible — auth is secret-based, not single-session), the last-writer-wins nature of this pattern can permanently lose a field typed on the other device, because the blind `patch` overwrites all four fields on every blur.

**Fix:** Read sibling field values from the DOM (via refs or `key`-matched uncontrolled inputs) instead of from the stale Convex subscription. The simplest surgical fix is to add a `ref` per panel and read sibling `input` values from the ref container on blur:

```typescript
// Alternative: send only the field that changed, let the server skip unset fields
// Use separate mutation args — the server already handles undefined as "no change"
// But that requires changing the server to treat undefined as "leave unchanged" rather than "clear".

// Simplest client fix without server changes: use refs
const bankInfoRefs = {
  bankName: useRef<HTMLInputElement>(null),
  accountNumber: useRef<HTMLInputElement>(null),
  accountHolderName: useRef<HTMLInputElement>(null),
  duitNowId: useRef<HTMLInputElement>(null),
};

// In each onBlur, read all four values from refs rather than from bill:
onBlur={() => {
  updateBankingInfo({
    billId: billId as Id<"bills">,
    organizerSecret: organizerSecret!,
    bankName: bankInfoRefs.bankName.current?.value.trim() || undefined,
    accountNumber: bankInfoRefs.accountNumber.current?.value.trim() || undefined,
    accountHolderName: bankInfoRefs.accountHolderName.current?.value.trim() || undefined,
    duitNowId: bankInfoRefs.duitNowId.current?.value.trim() || undefined,
  }).catch(...);
}}
```

This must be applied to **both** the desktop panel (lines 519–596) and the mobile panel (lines 757–833).

---

## Warnings

### WR-01: `defaultValue` inputs do not re-sync when Convex data updates

**File:** `src/app/dashboard/[billId]/page.tsx:516, 538, 560, 582` (desktop); `755, 777, 799, 821` (mobile)

**Issue:** All eight banking info inputs use `defaultValue` (uncontrolled), which React only applies on initial mount. If the organizer has the dashboard open on one device and banking info is updated from another context (unlikely but possible for the QR/receipt fields which have the same pattern), the displayed value will remain stale until a full page reload. More practically: after a successful `updateBankingInfo` call, Convex pushes an update to `bill.bankName` etc., but the DOM input is not updated because it is uncontrolled.

This means the "read sibling values from `bill` object" pattern in `onBlur` (the current code) is actually more consistent for the multi-field-write case, **but only as long as the DOM has not diverged from the subscription**. The uncontrolled pattern + subscription reads creates a mismatch window where the DOM can show a value the server does not yet have and the subscription can deliver a value the DOM has overwritten.

The existing `updateRoundingAdjustment` field has the same pattern and this is an accepted trade-off. But it is worth flagging because the banking fields are four co-dependent values rather than one independent scalar.

**Fix:** If the uncontrolled pattern is intentional (avoids re-renders), add a `key` prop tied to the Convex data version so the input resets when the subscription delivers fresh data:

```tsx
<input
  key={bill.bankName ?? ''}   // forces remount when DB value changes
  type="text"
  defaultValue={bill.bankName ?? ''}
  ...
/>
```

This ensures the displayed value and the Convex-subscription value stay aligned. Apply to all 8 banking inputs (4 desktop + 4 mobile).

### WR-02: Banking info `<label>` elements have no `htmlFor` — click target does not focus input

**File:** `src/app/dashboard/[billId]/page.tsx:511-515, 533-537, 555-559, 577-581` (desktop); `750-753, 772-775, 794-797, 816-819` (mobile)

**Issue:** All 8 banking info label elements are rendered as bare `<label>` without a `htmlFor` attribute and without the input nested inside the label. This means clicking the label text does not focus the corresponding input, which breaks the standard accessibility contract (WCAG 1.3.1 — info and relationships). The rounding adjustment label at line 489 has the same pattern, but it predates this phase.

```tsx
// Current (broken):
<label className="text-[0.625rem] uppercase tracking-widest text-ink-muted">
  Bank Name
</label>
<input type="text" defaultValue={bill.bankName ?? ''} ... />

// Fix: either associate via htmlFor+id or nest the input inside the label
<label
  htmlFor="bankName-desktop"
  className="text-[0.625rem] uppercase tracking-widest text-ink-muted"
>
  Bank Name
</label>
<input
  id="bankName-desktop"
  type="text"
  defaultValue={bill.bankName ?? ''}
  ...
/>
```

Apply to all 8 banking input labels and both panels. Duplicate `id` values must be avoided between the desktop and mobile panels — use `bankName-desktop` / `bankName-mobile` naming or similar.

### WR-03: `claimItem` capacity check has a TOCTOU gap for multi-qty items — capacity can be exceeded under concurrent load

**File:** `convex/bills.ts:188-201`

**Issue:** For multi-quantity items, the mutation reads `allClaims` to compute `othersClaimed`, then checks capacity, then separately queries for an existing claim to upsert. These are two separate Convex reads. Between the capacity check read and the insert, another concurrent `claimItem` call from a different session could pass the same capacity check and also insert, causing total claimed units to exceed `item.quantity`.

Convex mutations are serialized **per document** but not across queries within a single mutation; two mutations querying different documents can interleave at the query boundary.

This is a pre-existing concern (not introduced in Phase 07) but it falls within the review scope because `claimItem` is one of the reviewed files and this code path was exercised in this phase.

**Fix:** The defensive approach is to re-validate capacity a second time inside the upsert branch, or to move the capacity check after the upsert lookup so it uses the same query. In practice, Convex serializes mutations so interleaving is only possible if two mutations are inflight from the Convex scheduler simultaneously. Documenting the assumption in a comment is the minimum acceptable mitigation if a full fix is deferred:

```typescript
// NOTE: capacity check and insert are not atomic. Under very high concurrency
// (multiple simultaneous mutations on the same item) total claimed units could
// briefly exceed item.quantity. Acceptable for MVP; revisit if contention observed.
```

### WR-04: `updateBankingInfo` does not trim whitespace server-side — client trim is the only defense

**File:** `convex/bills.ts:490-493`

**Issue:** The server-side `updateBankingInfo` handler sanitizes XSS characters (`<>"`) but does not trim leading/trailing whitespace. Trimming currently happens only in the client `onBlur` handler (`e.target.value.trim()`). This means:

- A programmatic or direct API call to `updateBankingInfo` with `bankName: "  Maybank  "` will store the padded value, which will then render with extra whitespace in the member view.
- Future callers (e.g., a mobile app, an API migration) bypass the client trim.

The XSS test predicates in `updateBankingInfo.test.ts` do not test trim behavior, so this gap has no coverage.

**Fix:** Add `.trim()` inside the server handler after the XSS replace:

```typescript
const sanitizedBankName = bankName !== undefined
  ? bankName.replace(/[<>"]/g, "").trim()
  : undefined;
// ...repeat for the other three fields
```

---

## Info

### IN-01: XSS sanitization does not strip `&` — `&amp;` encoding round-trips in member view

**File:** `convex/bills.ts:490-493`

**Issue:** The sanitization regex `/[<>"]/g` strips the characters required for HTML tag injection (`<`, `>`) and attribute breakout (`"`). However, `&` is not stripped. A value like `Maybank&amp;Trust` stored in the DB will render as `Maybank&amp;Trust` in JSX (React auto-escapes), which is visually correct. But `Maybank & Trust` stored as-is also renders correctly. The concern is cosmetic / defense-in-depth: `&#x3C;` is a valid HTML entity for `<` — if the member view ever renders these values via `dangerouslySetInnerHTML` in a future change, `&` becomes an injection vector. No current XSS risk exists because React escapes all JSX text children.

**Fix:** No immediate action required. Consider adding `&` to the stripped characters as defense-in-depth if the codebase ever adds non-React rendering of these fields:

```typescript
bankName.replace(/[<>"&]/g, "")
```

### IN-02: `isSafeText` test predicate comment mentions `bankAccountNumber` and `bankAccountName` — field names differ from schema

**File:** `src/test/updateBankingInfo.test.ts:29`

**Issue:** The comment on `isSafeText` says it guards `bankName, bankAccountNumber, and bankAccountName fields`. The actual schema field names are `bankName`, `accountNumber`, `accountHolderName`, and `duitNowId`. The comment omits `duitNowId` and uses incorrect aliases for the other two.

**Fix:** Update the comment to match actual field names:

```typescript
// Replicates the XSS sanitisation contract that updateBankingInfo must enforce
// for bankName, accountNumber, accountHolderName, and duitNowId fields.
```

### IN-03: Rounding adjustment row in BILL TOTAL uses `?? 0` double-null-coalescing on a value already returned as a number

**File:** `src/app/c/[billId]/page.tsx:736-743`

**Issue:** `totals.roundingAdjustmentCents` is typed as `number` in the `calculateTotals` return type — it is never `null` or `undefined`. The `?? 0` guard is unnecessary noise. The same pattern appears in the YOUR PORTION zone (pre-existing) but this is new code introduced in Phase 07.

```tsx
// Current — ?? 0 on a non-nullable number:
{(totals.roundingAdjustmentCents ?? 0) !== 0 ? (

// Fix — simpler, correct:
{totals.roundingAdjustmentCents !== 0 ? (
```

This applies to lines 736, 739, 740 in the BILL TOTAL zone. The YOUR PORTION zone equivalent is pre-existing and out of this phase's scope.

---

_Reviewed: 2026-06-04_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
