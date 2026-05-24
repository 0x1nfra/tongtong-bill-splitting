---
phase: 02-item-claiming
verified: 2026-05-25T01:45:00Z
status: human_needed
score: 13/13
overrides_applied: 0
human_verification:
  - test: "Open member view in browser, tap an unclaimed item — verify inline name-entry field expands below that row with max-height CSS transition"
    expected: "Name input + CLAIM button appear below tapped row; other rows stay collapsed"
    why_human: "CSS max-height transition from 0 to 80px is visual behavior that grep cannot confirm works in the browser"
  - test: "Enter name in inline field and tap CLAIM — verify name persists across page reload (stored in localStorage tongtong_name_${billId})"
    expected: "After reload, tapping any unclaimed item fires claim immediately without prompting for name again"
    why_human: "localStorage persistence and the one-tap flow after name is set requires browser interaction"
  - test: "Open member view on two separate browser windows (different sessions) — claim items in one window, observe the other window updates within ~300ms"
    expected: "Other claimant names appear in blue handwriting below item rows in real time without page refresh (CLAIM-06 / Convex subscription)"
    why_human: "Real-time subscription latency cannot be verified statically; requires two live browser sessions"
  - test: "Claim one or more items and observe 'Your Portion' panel — verify it fades in and slides up from bottom on first claim, then updates live as more items are claimed/unclaimed"
    expected: "Panel transitions from opacity-0/translate-y-2 to opacity-100/translate-y-0 (300ms ease-out); values update correctly per item"
    why_human: "CSS opacity+translateY transition and live value updates are visual/interactive behaviors"
  - test: "Claim an item already claimed by another session — verify item row shows both claimants' names in blue with slight random rotation (−2 to +2 degrees)"
    expected: "Both names appear below the row in Shadows Into Light Two font with deterministic but distinct rotations"
    why_human: "Rotation degrees and font rendering are visual; requires visual inspection in browser"
---

# Phase 2: Item Claiming — Verification Report

**Phase Goal:** Members tap to claim individual items; multi-claim splits cost; live proportional totals per person
**Verified:** 2026-05-25T01:45:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | claimItem mutation inserts a claim record for a valid billId + itemId and returns the new claim _id | VERIFIED | `convex/bills.ts` lines 145–182: mutation exports, validates bill+item, inserts into "claims" table, returns `_id` |
| 2 | claimItem idempotency guard prevents a second claim record when the same session+item pair is called twice | VERIFIED | `convex/bills.ts` lines 162–172: `withIndex("by_session")` + `.filter(itemId)` + `.first()` returns existing `_id` without inserting |
| 3 | unclaimItem deletes a claim record when claimantSession matches; throws when session does not match | VERIFIED | `convex/bills.ts` lines 189–205: ownership check throws `"Unauthorized: can only unclaim your own items"`; `ctx.db.delete(claimId)` on match |
| 4 | getBillForMember returns a claims[] array alongside items[] in its result | VERIFIED | `convex/bills.ts` lines 83–98: queries "claims" via `by_bill` index, includes `claims` in return object `{ ...billWithoutSecret, items, claims, qrUrl }` |
| 5 | getClaimsForBill returns `{ claimedCount, unclaimedCount }` for the organizer; returns null on bad secret | VERIFIED | `convex/bills.ts` lines 214–258: auth check returns `null` on mismatch (WR-06); computes claimedCount (sessions-minus-paid) and unclaimedCount (unclaimed items) |
| 6 | calculatePersonTotals correctly computes each member's subtotal as sum of (itemPrice * qty / claimantCount) rounded to integer cents | VERIFIED | `src/lib/calculateTotals.ts` lines 42–108: Map-based O(1) accumulation with `Math.round(price * qty / claimantCount)`; 18 tests pass (93/93 total) |
| 7 | Service charge and SST are distributed proportionally using the bill-level amounts from calculateTotals output, not recalculated independently | VERIFIED | `src/lib/calculateTotals.ts` lines 94–98: uses `billTotals.serviceChargeCents` and `billTotals.sstCents` directly; never recalculates from % |
| 8 | Division by zero is guarded — zero billSubtotal returns all-zero person totals | VERIFIED | `src/lib/calculateTotals.ts` lines 54–61: explicit guard `if (billTotals.subtotalCents === 0)` returns all zeros |
| 9 | Unclaimed items (not in any claim record) contribute zero to the person's subtotal | VERIFIED | Algorithm: only iterates `myClaims` (session-filtered claims); items with no claim record are never visited |
| 10 | personTotalCents = personSubtotalCents + personServiceChargeCents + personSSTCents (integer, no floats) | VERIFIED | `src/lib/calculateTotals.ts` lines 99–100; all 4 outputs verified integer in tests via `Number.isInteger` assertions |
| 11 | Unclaimed item rows show ❋ prefix in red (--color-stamp) and 'CLAIM' text below the row | VERIFIED | `src/app/c/[billId]/page.tsx` lines 326–328: `<span className="text-[--color-stamp] mr-0.5">❋</span>` when `totalClaimants === 0`; lines 364–369: `<p className="text-xs text-[--color-stamp]...">CLAIM</p>` |
| 12 | Your Portion panel is hidden when hasClaims is false; appears with opacity+translateY transition on first claim | VERIFIED | `src/app/c/[billId]/page.tsx` line 253: `hasClaims = claims.some(...)` (derived from useQuery, not useEffect); line 410: `opacity-0 translate-y-2 pointer-events-none` / `opacity-100 translate-y-0` with `transition-[opacity,transform] duration-300` |
| 13 | Dashboard StatsBar receives real claimedCount and unclaimedCount from getClaimsForBill query | VERIFIED | `src/app/dashboard/[billId]/page.tsx` lines 49–52: `useQuery(api.bills.getClaimsForBill, ...)` with skip pattern; lines 128–129: `claimed = claimsStats?.claimedCount ?? 0`; lines 194–195: `claimed={claimed} unclaimed={unclaimed}` |

**Score:** 13/13 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `convex/bills.ts` | claimItem mutation, unclaimItem mutation, getClaimsForBill query, getBillForMember with claims | VERIFIED | 7 exports confirmed: 4 mutations + 3 queries; all exist and are substantive (259 lines of real logic) |
| `src/lib/calculateTotals.ts` | calculatePersonTotals exported alongside calculateTotals | VERIFIED | Both functions exported; 108 lines total; calculatePersonTotals at line 42 |
| `src/test/calculatePersonTotals.test.ts` | Unit tests for all calculatePersonTotals behaviors (describe('calculatePersonTotals…)) | VERIFIED | 9 describe blocks, 18 tests; all pass (confirmed: `pnpm test` → 93/93) |
| `src/app/c/[billId]/page.tsx` | Interactive member view with claim rows, name entry, Your Portion panel (min 250 lines) | VERIFIED | 547 lines; claimItem/unclaimItem mutations wired; calculatePersonTotals called; hasClaims panel present |
| `src/app/layout.tsx` | Shadows Into Light Two font loaded via next/font/google | VERIFIED | `import { Shadows_Into_Light_Two } from "next/font/google"` at line 2; `shadowsIntoLightTwo.variable` applied to `<html>` at line 28 |
| `src/app/globals.css` | Shadows+Into+Light+Two removed from @import url Google Fonts line | VERIFIED | First line: `@import url(".../JetBrains+Mono...&family=Bungee&display=swap")` — no Shadows+Into+Light+Two present |
| `src/app/dashboard/[billId]/page.tsx` | CLAIMED/UNCLAIMED stats wired to real getClaimsForBill subscription | VERIFIED | `api.bills.getClaimsForBill` present (1 occurrence); `claimsStats` referenced 3 times; `claimed={0}` is gone (0 matches) |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `convex/bills.ts claimItem` | `convex/schema.ts claims table` | `ctx.db.insert("claims", {...})` | WIRED | Line 174: `ctx.db.insert("claims", { billId, itemId, claimantName, claimantSession, createdAt: Date.now() })` |
| `convex/bills.ts getClaimsForBill` | `convex/schema.ts claims.by_bill index` | `.withIndex("by_bill", q => q.eq("billId", billId)).collect()` | WIRED | Line 226–229: by_bill index used for claims collection |
| `src/app/layout.tsx` | `src/app/globals.css --font-handwriting` | `shadowsIntoLightTwo.variable` applied to `<html>` className | WIRED | `<html className={`${shadowsIntoLightTwo.variable} h-full`}>` — CSS variable `--font-handwriting` defined in globals.css `@theme inline` stays; next/font injects the actual font |
| `src/app/c/[billId]/page.tsx claimItem call` | `convex/bills.ts claimItem mutation` | `useMutation(api.bills.claimItem)` | WIRED | Line 116: `const claimItemMutation = useMutation(api.bills.claimItem)` |
| `src/app/c/[billId]/page.tsx` | `src/lib/calculateTotals.ts calculatePersonTotals` | `import { calculatePersonTotals } from '@/lib/calculateTotals'` | WIRED | Line 9 import; line 258 call site: `calculatePersonTotals(items, claims, claimantSession, totals)` |
| `src/app/dashboard/[billId]/page.tsx` | `convex/bills.ts getClaimsForBill` | `useQuery(api.bills.getClaimsForBill, { billId, organizerSecret })` | WIRED | Lines 49–52: skip pattern + nullish coalescing guard; fed into StatsBar at lines 194–195 |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `src/app/c/[billId]/page.tsx` Your Portion panel | `personTotals` | `calculatePersonTotals(items, claims, claimantSession, totals)` where `items`/`claims` come from `useQuery(api.bills.getBillForMember)` | Yes — Convex real-time query feeds live `claims[]` data into pure calculation | FLOWING |
| `src/app/c/[billId]/page.tsx` item rows | `claims` (for claimant names + split price) | `bill.claims ?? []` from `useQuery(api.bills.getBillForMember)` | Yes — `getBillForMember` queries `claims` table via `by_bill` index | FLOWING |
| `src/app/dashboard/[billId]/page.tsx` StatsBar | `claimed`, `unclaimed` | `claimsStats?.claimedCount ?? 0`, `claimsStats?.unclaimedCount ?? 0` from `useQuery(api.bills.getClaimsForBill)` | Yes — queries claims + payments tables; returns computed counts | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| calculatePersonTotals exported and all 18 tests pass | `pnpm test` | 93/93 tests pass, 9 test files | PASS |
| claimItem mutation exists and is substantive | `grep -c "export const claimItem = mutation" convex/bills.ts` | 1 | PASS |
| unclaimItem mutation exists and is substantive | `grep -c "export const unclaimItem = mutation" convex/bills.ts` | 1 | PASS |
| getClaimsForBill query returns null on auth failure | `grep -c "return null" convex/bills.ts` | 6 (includes auth guard in getClaimsForBill) | PASS |
| Globals.css does not contain Shadows+Into+Light+Two in @import | `grep "fonts.googleapis.com" src/app/globals.css` | Only JetBrains+Mono and Bungee families | PASS |
| Dashboard hardcoded claimed={0} removed | `grep "claimed={0}" src/app/dashboard/[billId]/page.tsx` | 0 matches | PASS |

### Probe Execution

No explicit probes declared in PLAN files. Step 7b behavioral spot-checks ran in place of probe execution.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|------------|------------|-------------|--------|---------|
| CLAIM-01 | 02-01, 02-03 | Member can tap any item row to claim it; claimant name input appears inline | SATISFIED | `claimItemMutation`, inline name-entry expansion in page.tsx (lines 370–401) |
| CLAIM-02 | 02-01, 02-03 | Multiple members can claim the same item; cost splits equally among all claimants | SATISFIED | `totalClaimants` count + `Math.round(price * qty / totalClaimants)` split price in item rows |
| CLAIM-03 | 02-01, 02-03 | Member can unclaim their own items (session-matched only) | SATISFIED | `unclaimItem` mutation with session gate; `handleItemTap` with `myClaimOnItem?._id` |
| CLAIM-04 | 02-03 | Claimant name appears in handwritten blue (Shadows Into Light Two) below item row, with slight random rotation | SATISFIED | `font-[family-name:var(--font-handwriting)] text-[--color-pen]` + `getRotation(claim._id)` applied via inline style |
| CLAIM-05 | 02-03 | Unclaimed items display ❋ prefix and inline "CLAIM" prompt | SATISFIED | ❋ in `text-[--color-stamp]` when `totalClaimants === 0`; "CLAIM" paragraph below unclaimed rows |
| CLAIM-06 | 02-01, 02-03 | Live updates — other members' claims appear in real time | SATISFIED | `useQuery(api.bills.getBillForMember)` is a Convex live subscription; claims array updates server-push, no polling |
| CALC-01 | 02-02, 02-03 | Each member's subtotal = sum of (itemPrice / numberOfClaimants) for all claimed items | SATISFIED | `calculatePersonTotals`: `Math.round(price * qty / claimantCount)` per item; 18 test cases confirm |
| CALC-02 | 02-02, 02-03 | Tax and service charge applied proportionally: person's share = (personSubtotal / billSubtotal) × totalTax | SATISFIED | `calculatePersonTotals` lines 94–98: ratio × billTotals.serviceChargeCents and billTotals.sstCents |
| CALC-03 | 02-02 | All prices stored as integer RM cents internally; displayed rounded to 2 decimal places | SATISFIED | `Math.round` on all per-person calculations; displayed as `(cents / 100).toFixed(2)` with RM prefix |
| CALC-04 | 02-03 | "Your Portion" panel sticky at bottom of claim screen, updates live | SATISFIED | `sticky bottom-0` panel; updates live via Convex subscription feeding `calculatePersonTotals` |
| CALC-05 | 02-02, 02-03 | Unclaimed items excluded from per-person totals | SATISFIED | `calculatePersonTotals` only iterates `myClaims`; unclaimed items never contribute |
| DASH-02 | 02-01, 02-04 | Stats bar shows counts: CONFIRMED / AWAITING / CLAIMED / UNCLAIMED | SATISFIED | `getClaimsForBill` provides real-time CLAIMED/UNCLAIMED counts wired to StatsBar |

All 12 requirements (CLAIM-01 through CLAIM-06, CALC-01 through CALC-05, DASH-02) are SATISFIED.

Note: DASH-02 is listed in plans 02-01 and 02-04 for Phase 2, even though REQUIREMENTS.md traceability maps it to Phase 1. The ROADMAP.md Phase 2 success criteria do not explicitly name DASH-02, but the PLAN frontmatter for 02-01 and 02-04 claim it — it is fully implemented with real data.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/app/dashboard/[billId]/page.tsx` | 291 | `alert("Close chit feature coming soon.")` | INFO | Pre-existing Phase 1 stub for the "CLOSE CHIT EARLY" feature; not introduced by Phase 2; not in Phase 2 requirements scope |

No TBD, FIXME, XXX, or HACK markers found in any Phase 2 modified files. The `alert("coming soon")` is confirmed pre-existing (not in the 02-04 diff; present in Phase 1 commit `42047b3`).

### Human Verification Required

Phase 2 delivers interactive UI behavior that cannot be confirmed programmatically.

### 1. Inline Name-Entry CSS Transition

**Test:** Open the member claim view in a browser; tap an unclaimed item row when no name is stored
**Expected:** A name input + CLAIM button animate open below the tapped row (max-height transition 0 → 80px, 200ms ease-out); no other rows expand
**Why human:** CSS transition behavior and layout integrity require visual confirmation in a browser

### 2. localStorage Name Persistence and One-Tap Flow

**Test:** Enter a name and tap CLAIM on the first item; reload the page; tap another unclaimed item
**Expected:** After reload, the second tap immediately fires the claim without prompting for a name (stored in `tongtong_name_${billId}`)
**Why human:** localStorage persistence and the branching UX path based on name presence requires interactive browser testing

### 3. Real-Time Multi-Member Claim Updates (CLAIM-06)

**Test:** Open the member claim view on two separate browser windows with different sessions; claim an item in one window
**Expected:** The other claimant's name appears in blue handwriting below the item row in the second window within ~300ms (Convex WebSocket subscription latency)
**Why human:** Real-time Convex WebSocket behavior requires two live browser sessions to verify; latency cannot be statically verified

### 4. Your Portion Panel Animation and Live Updates

**Test:** Open the member view with no claims; claim one item; observe the panel; claim a second item; unclaim the first
**Expected:** Panel fades in with opacity+translateY transition on first claim; YOUR TOTAL updates immediately as claims change; panel disappears when all items are unclaimed
**Why human:** CSS transition (opacity/transform, 300ms) and live value correctness during rapid claim/unclaim cycles are visual and interactive

### 5. Handwritten Claimant Names Visual Quality (CLAIM-04)

**Test:** Have two members claim the same item; observe both names rendered below the item row
**Expected:** Both names display in Shadows Into Light Two (handwritten blue), each with a distinct but consistent rotation (−2° to +2°), bold for the current session's name and normal weight for others
**Why human:** Font rendering, rotation values, and bold/normal weight differentiation require visual inspection in browser

---

## Summary

Phase 2 goal is achieved. All 13 observable truths are VERIFIED in the codebase with implementation evidence tracing from the Convex backend through the calculation library to the rendered UI:

**Plan 02-01 (Backend):** `convex/bills.ts` has all 7 required exports. `claimItem` is idempotency-guarded via `by_session` index. `unclaimItem` is session-ownership-gated. `getClaimsForBill` returns null on auth failure (WR-06). `getBillForMember` includes `claims[]` for single-subscription member view.

**Plan 02-02 (Math):** `calculatePersonTotals` exported from `src/lib/calculateTotals.ts`. 18 tests cover all edge cases including multi-claimer splits, proportional SC/SST, zero guard, and unclaimed item exclusion. All 93 tests pass.

**Plan 02-03 (Member View):** `src/app/c/[billId]/page.tsx` is a full 547-line interactive rewrite. Claim rows, inline name entry, Your Portion sticky panel, and hasClaims-driven visibility are all present and wired to live Convex data. Shadows Into Light Two migrated from CDN to `next/font/google` in `layout.tsx`; `globals.css` cleaned up.

**Plan 02-04 (Dashboard):** `src/app/dashboard/[billId]/page.tsx` wires `getClaimsForBill` subscription with skip-until-loaded pattern; StatsBar receives `claimed={claimed}` and `unclaimed={unclaimed}` (hardcoded `0` removed).

5 human verification items require browser testing to confirm interactive CSS transitions, localStorage persistence flow, real-time multi-session subscription behavior, and font/rotation visual quality.

---

_Verified: 2026-05-25T01:45:00Z_
_Verifier: Claude (gsd-verifier)_
