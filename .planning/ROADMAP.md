# TongTong — Roadmap

**Project:** TongTong
**Total Phases:** 3
**v1 Requirements:** 52 (BILL×6, AUTH×3, SHARE×4, CLAIM×6, CALC×5, PAY×5, DASH×7, UI×13, LAND×3)

## Phases

- [x] **Phase 1: Working Bill** - Organizer creates a bill, shares a link, members view it, payment flow and dashboard work end-to-end (functional, unstyled) (completed 2026-05-23)
- [ ] **Phase 2: Item Claiming** - Members tap to claim individual items; multi-claim splits cost; live proportional totals per person
- [ ] **Phase 3: TongTong Aesthetic** - Full chit visual theme and landing page applied across every screen

## Phase Details

### Phase 1: Working Bill
**Goal:** An organizer can create a bill, share a link, and track who has paid — end-to-end, without visual polish
**Mode:** mvp
**Depends on:** Nothing (first phase)
**Requirements:** BILL-01, BILL-02, BILL-03, BILL-04, BILL-05, BILL-06, AUTH-01, AUTH-02, AUTH-03, SHARE-01, SHARE-02, SHARE-03, SHARE-04, PAY-01, PAY-02, PAY-03, PAY-04, PAY-05, DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, DASH-06, DASH-07
**Success Criteria** (what must be TRUE):
  1. Organizer can fill in a bill form with items, tax toggles, and a DuitNow QR, then tap "Generate Link" to receive a shareable URL
  2. A friend who opens the shared link can see the bill items and their equal-split total, then tap "I've Paid" to register a pending payment
  3. Organizer dashboard shows live per-person payment status (AWAITING / CONFIRMED) and confirm/reject controls that update the member's view in real time
  4. Organizer and member identities persist across page reloads via localStorage with no login screen
**Plans:** 6/6 plans complete

**Wave 1**
- [x] 01-01-PLAN.md — Convex backend functions (bills.ts + payments.ts, schema patch for venueName/billDate)

**Wave 2** *(blocked on Wave 1 — run `pnpm dev:convex` after Wave 1 to regenerate types)*
- [x] 01-02-PLAN.md — Route scaffolds: walking skeleton, all 4 page shells with real Convex subscriptions

**Wave 3** *(blocked on Wave 2)*
- [x] 01-03-PLAN.md — Bill builder form: items state, toggles, running totals, createBill mutation

**Wave 4** *(blocked on Wave 3 — 01-04 and 01-05 run in parallel)*
- [x] 01-04-PLAN.md — QR upload (3-step Convex file storage) + complete share screen
- [x] 01-05-PLAN.md — Member view: bill items, I'VE PAID, SettleStamp state machine

**Wave 5** *(blocked on Wave 4)*
- [x] 01-06-PLAN.md — Organizer dashboard: progress bar, stats, per-person rows, confirm/reject

**Cross-cutting constraints:**
- `params` is a Promise in Next.js 16 — all dynamic routes use `React.use(params)` (waves 2–5)
- localStorage reads must be in `useEffect` — null initial state, guard mutations with null check (waves 2–5)
- Integer RM cents in Convex; display as `(cents/100).toFixed(2)` with "RM" prefix everywhere
**UI hint**: yes

### Phase 2: Item Claiming
**Goal:** Members can claim the specific items they ordered; costs split proportionally so each person sees exactly what they owe
**Mode:** mvp
**Depends on:** Phase 1
**Requirements:** CLAIM-01, CLAIM-02, CLAIM-03, CLAIM-04, CLAIM-05, CLAIM-06, CALC-01, CALC-02, CALC-03, CALC-04, CALC-05
**Success Criteria** (what must be TRUE):
  1. Member can tap an item row to claim it; their name appears inline and their "Your Portion" total updates immediately
  2. Multiple members can claim the same item and each sees their equal share of that item's cost
  3. Tax and service charge appear in each member's total proportional to their subtotal share, not as a flat equal split
  4. Other members' claim actions appear on screen within seconds without a page refresh
**Plans:** TBD
**UI hint**: yes

### Phase 3: TongTong Aesthetic
**Goal:** Every screen carries the full chit visual identity — paper colors, monospace typography, dot leaders, SETTLE stamp, handwritten names — and the landing page converts new visitors
**Mode:** mvp
**Depends on:** Phase 2
**Requirements:** UI-01, UI-02, UI-03, UI-04, UI-05, UI-06, UI-07, UI-08, UI-09, UI-10, UI-11, UI-12, UI-13, LAND-01, LAND-02, LAND-03
**Success Criteria** (what must be TRUE):
  1. The claim screen displays item rows with dot-leader alignment, handwritten blue claimant names at slight random rotations, and a SETTLE stamp with ink-bleed animation on payment confirmation
  2. A visitor to the landing page sees the "tongtong." logotype, Manglish marketing copy, and a "START NEW BILL" chop-style button — and can reach the bill builder in one tap
  3. Every screen uses the correct color roles: warm paper background, charcoal ink, blue pen marks, and red reserved strictly for SETTLE stamp and unclaimed item warnings
**Plans:** TBD
**UI hint**: yes

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Working Bill | 6/6 | Complete   | 2026-05-23 |
| 2. Item Claiming | 0/? | Not started | - |
| 3. TongTong Aesthetic | 0/? | Not started | - |
