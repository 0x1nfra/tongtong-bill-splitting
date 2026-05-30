# TongTong — Roadmap

**Project:** TongTong
**Total Phases:** 4
**v1 Requirements:** 52 (BILL×6, AUTH×3, SHARE×4, CLAIM×6, CALC×5, PAY×5, DASH×7, UI×13, LAND×3)

## Phases

- [x] **Phase 1: Working Bill** - Organizer creates a bill, shares a link, members view it, payment flow and dashboard work end-to-end (functional, unstyled) (completed 2026-05-23)
- [x] **Phase 2: Item Claiming** - Members tap to claim individual items; multi-claim splits cost; live proportional totals per person (completed 2026-05-24)
- [x] **Phase 3: TongTong Aesthetic** - Full chit visual theme and landing page applied across every screen (completed 2026-05-25)
- [x] **Phase 4: Bonus Features** - Auto-archive, reminder nudges, dark mode, Google OAuth bill history; dashboard people-from-claims + flat cards (in progress) (completed 2026-05-29)

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

### Phase 01.1: Tech debt: DASH-04 label fix + calculateTotals extraction (INSERTED)

**Goal:** Extract shared calculateTotals utility to src/lib/calculateTotals.ts and confirm DASH-04 fix is in place — eliminating duplicated arithmetic across three consumer files
**Requirements**: TBD (tech debt phase — no formal requirement IDs)
**Depends on:** Phase 1
**Plans:** 3 plans

**Wave 1**
- [x] 01.1-01-PLAN.md — Create src/lib/calculateTotals.ts (shared utility) + verify DASH-04 fix already present in dashboard

**Wave 2** *(blocked on Wave 1 — src/lib/calculateTotals.ts must exist before consumers can import it; 01.1-02 and 01.1-03 run in parallel)*
- [x] 01.1-02-PLAN.md — Replace inline calculateTotals in dashboard/[billId]/page.tsx + BillSummaryCard.tsx
- [x] 01.1-03-PLAN.md — Replace inline calculateTotals in c/[billId]/page.tsx (4 display-site updates)

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
**Plans:** 4/4 plans complete

**Wave 1**
- [x] 02-01-PLAN.md — Convex backend: claimItem + unclaimItem mutations, getClaimsForBill query, extend getBillForMember to return claims[]

**Wave 2** *(02-02 and 02-04 run in parallel — both blocked only on Wave 1)*
- [x] 02-02-PLAN.md — calculatePersonTotals TDD: write tests first, then implement proportional per-person math in src/lib/calculateTotals.ts
- [x] 02-04-PLAN.md — Dashboard wiring: add getClaimsForBill subscription, replace hardcoded claimed=0/unclaimed=0 with real counts

**Wave 3** *(blocked on 02-01 and 02-02)*
- [x] 02-03-PLAN.md — Member view rewrite: interactive claim rows, inline name entry, Your Portion panel, Shadows Into Light Two font migration

**Cross-cutting constraints:**
- Guard all mutations with `if (!claimantSession) return` — session is null on first render (SSR-safe useEffect)
- `next/font/google` used in layout.tsx (Server Component only) — never in "use client" files
- Convex queries return null on auth failure, never throw (WR-06 pattern)
- Math.round() on all per-person cent calculations — no floats
- Use calculateTotals output for bill-level SC/SST in calculatePersonTotals — never recalculate independently
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
**Plans:** 4/4 plans complete

**Wave 1**
- [x] 03-01-PLAN.md — Font migration (JetBrains Mono + Bungee → next/font/google; Departure Mono → self-hosted WOFF2) + CSS animation token + SVG ink-bleed filter in layout.tsx

**Wave 2** *(03-02 and 03-03 run in parallel — both blocked on Wave 1 font delivery)*
- [x] 03-02-PLAN.md — Landing page full rewrite (logotype, DemoChit hero, Manglish copy, CTA) + SettleStamp thwack animation + ink-bleed filter
- [x] 03-03-PLAN.md — Member/claim view aesthetic polish: .chit wrappers, .dot-leader rows, .rule-hairline, .perforation, loading skeleton, EXPIRED stamp state, UI-09 rotation

**Wave 3** *(blocked on Wave 2)*
- [x] 03-04-PLAN.md — Organizer screens: bill builder .chit form, dashboard skeleton/empty-state/panels, BillSummaryCard .chit upgrade

**Cross-cutting constraints:**
- next/font/google functions only in Server Components (layout.tsx) — never in "use client" files
- Use Tailwind color tokens (text-ink, text-pen, text-stamp, bg-paper-chit, bg-paper-table) — never raw hex in component code
- Red (#B91C1C / text-stamp) reserved strictly for SETTLE stamp, unclaimed ❋, EXPIRED stamp, CLAIM prompt — no other use
- One-imperfection rule (UI-09): outer .chit rotation OR crease — never both on same element
**UI hint**: yes

### Phase 4: Bonus Features
**Goal:** Ship remaining bonus capabilities — bill auto-archive, organizer reminder nudges, dark mode carbon-copy theme, and Google OAuth for bill history
**Mode:** mvp
**Depends on:** Phase 3
**Requirements:** BONUS-03, BONUS-04, BONUS-05, BONUS-06
**Success Criteria** (what must be TRUE):
  1. Bills with no activity for 30 days are automatically archived and show an ARCHIVED stamp to any visitor
  2. Organizer can trigger a reminder nudge from the dashboard that generates a fresh shareable link scoped to unpaid members
  3. A "carbon copy" dark mode theme (blue text on dark blue) toggles cleanly across all screens with no color-token regressions
  4. Signing in with Google persists bill ownership so the organizer can access their dashboard from any device
**Plans:** 5/5 plans complete

**Wave 0** *(Nyquist test stubs — must run first)*
- [x] 04-01-PLAN.md — Test stubs: archiveStale.test.ts (pure boundary tests), archivedBill.test.tsx (RED — ArchivedStamp not yet created), SignIn.test.tsx (RED — SignInButton not yet created)

**Wave 1** *(blocked on Wave 0)*
- [x] 04-02-PLAN.md — Convex backend: convex/crons.ts (daily archive job) + archiveStale internalMutation + freeze checks on 6 write mutations (bills.ts + payments.ts)

**Wave 2** *(blocked on Wave 1)*
- [x] 04-03-PLAN.md — Frontend features: ArchivedStamp component + ARCHIVED overlay on member view + ARCHIVED banner on dashboard + per-member NUDGE WhatsApp handler (BONUS-03 UI + BONUS-04)

**Wave 3** *(blocked on Wave 2)*
- [x] 04-04-PLAN.md — Dark mode: next-themes install (after human verification) + @custom-variant dark + carbon-copy token overrides + ThemeProvider + ThemeToggle + SignInButton stub (BONUS-06 + BONUS-05 stub)

**Wave 4** *(blocked on Wave 3)*
- [x] 04-05-PLAN.md — Dashboard PEOPLE tab from claims (not payments) + collapsible items toggle per member + remove slanted card rotations

**Cross-cutting constraints:**
- BONUS-05 (Google OAuth) is explicitly deferred per D-08 — only a SignInButton stub is created
- archiveStale must be internalMutation — never mutation (T-04-03)
- claimantName sanitized with .replace(/[<>"]/g, '') before WhatsApp URL construction (T-04-04)
- next-themes requires human verification checkpoint before install (package audit [ASSUMED])
- --color-stamp (#B91C1C) must NOT appear in dark mode token overrides (red brand constraint)
- suppressHydrationWarning on html tag required when ThemeProvider is added

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Working Bill | 6/6 | Complete   | 2026-05-23 |
| 01.1. Tech Debt | 3/3 | Complete | 2026-05-24 |
| 2. Item Claiming | 4/4 | Complete   | 2026-05-24 |
| 3. TongTong Aesthetic | 4/4 | Complete   | 2026-05-25 |
| 4. Bonus Features | 5/5 | Complete   | 2026-05-29 |

### Phase 5: bonus additions: Departure Mono headings + landing page enhancements (benefits, how-it-works guide)

**Goal:** Apply Departure Mono to all page-level h1 elements, add landing page benefits and how-it-works sections, add receipt upload to create flow, and add QR upload quick action to dashboard
**Requirements:** TBD (bonus additions — no formal requirement IDs)
**Depends on:** Phase 4
**Plans:** 4/4 plans executed

Plans:
- [x] 05-01-PLAN.md — Wave 0: Fix broken landing page tests + create RED stubs for benefits/how-it-works + updateQR boundary tests
- [x] 05-02-PLAN.md — Wave 1: Convex backend — updateQR mutation + createBill receiptStorageId extension
- [x] 05-03-PLAN.md — Wave 1: Landing page benefits + how-it-works sections + member view h1 Departure Mono (parallel with 05-02)
- [x] 05-04-PLAN.md — Wave 2: Create page h1 + receipt upload flow + dashboard h1 + QR upload quick action

**Wave 0**
- [x] 05-01-PLAN.md — Fix broken heading tests in landingPage.test.tsx; add RED stubs for benefits and how-it-works; create updateQR.test.ts with pure predicate boundary tests

**Wave 1** *(05-02 and 05-03 run in parallel — both blocked on Wave 0)*
- [x] 05-02-PLAN.md — convex/bills.ts: updateQR public mutation (mirrors setBillReceipt) + createBill args/insert extended with receiptStorageId
- [x] 05-03-PLAN.md — src/app/page.tsx benefits + how-it-works sections (D-04–D-09) + src/app/c/[billId]/page.tsx h1 style props (D-01, D-02)

**Wave 2** *(blocked on Wave 1)*
- [ ] 05-04-PLAN.md — src/app/create/page.tsx h1 style + receipt upload above items + receiptStorageId state/arg; src/app/dashboard/[billId]/page.tsx h1 style on all 3 h1s + updateQR useMutation + handleQRUpload + UPLOAD QR/REPLACE QR button

**Cross-cutting constraints:**
- Departure Mono MUST use style={{ fontFamily: "var(--font-display)" }} — never a Tailwind class (D-02)
- Red (text-stamp) MUST NOT appear in benefits or how-it-works section copy (color constraint)
- receiptStorageId state in create page MUST be distinct from qrStorageId state — never shared setter (Pitfall 4)
- updateQR must be a public mutation — NOT internalMutation (RESEARCH anti-pattern)
- Benefits .chit and how-it-works .chit MAY have one rotation (UI-09) — never both rotation AND crease
