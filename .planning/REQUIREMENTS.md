# Requirements: TongTong

**Defined:** 2026-05-22
**Core Value:** Share a link — friends claim items, see what they owe, confirm payment. Organizer stops chasing.

## v1 Requirements

### Bill Creation

- [ ] **BILL-01**: Organizer can create a bill with title, restaurant/venue name, and date
- [ ] **BILL-02**: Organizer can add line items with name, unit price (RM), and quantity; items display in receipt row format with dot leaders
- [ ] **BILL-03**: Organizer can toggle SST 6% and service charge 10% independently; totals update live
- [ ] **BILL-04**: Organizer can upload a DuitNow QR image (Convex file storage); preview shown inline
- [ ] **BILL-05**: Bill builder shows running subtotal, tax breakdown, and grand total as organizer types
- [ ] **BILL-06**: Organizer cannot generate link if bill has no items (client-side validation)

### Identity & Auth

- [ ] **AUTH-01**: Organizer identity stored as UUID in localStorage (`tongtong_organizer_secret`); generated on first visit
- [ ] **AUTH-02**: Member session stored as UUID in localStorage (`tongtong_session_<billId>`); generated on first visit to a bill link
- [ ] **AUTH-03**: Dashboard access requires presenting correct organizer secret (Convex verifies server-side)

### Sharing

- [ ] **SHARE-01**: Bill generates a shareable URL with short human-readable code (e.g. `#TT-04F2`) on "Generate Link"
- [ ] **SHARE-02**: Share screen shows compressed chit summary + carbon copy section with copyable link
- [ ] **SHARE-03**: "Copy Link" copies URL to clipboard
- [ ] **SHARE-04**: Bill link recipients require no login or account

### Item Claiming

- [ ] **CLAIM-01**: Member can tap any item row to claim it; claimant name input appears inline
- [ ] **CLAIM-02**: Multiple members can claim the same item; cost splits equally among all claimants
- [ ] **CLAIM-03**: Member can unclaim their own items (session-matched only)
- [ ] **CLAIM-04**: Claimant name appears in handwritten blue (Shadows Into Light Two) below item row, with slight random rotation (−2° to +2°)
- [ ] **CLAIM-05**: Unclaimed items display ❋ prefix and inline "CLAIM" prompt (red asterisk only)
- [ ] **CLAIM-06**: Live updates — other members' claims appear in real time (~100–300ms Convex latency)

### Totals & Calculation

- [ ] **CALC-01**: Each member's subtotal = sum of (itemPrice / numberOfClaimants) for all claimed items
- [ ] **CALC-02**: Tax and service charge applied proportionally: person's share of tax = (personSubtotal / billSubtotal) × totalTax
- [ ] **CALC-03**: All prices stored as integer RM cents internally; displayed rounded to 2 decimal places
- [ ] **CALC-04**: "Your Portion" panel sticky at bottom of claim screen, updates live
- [ ] **CALC-05**: Unclaimed items excluded from per-person totals; shown separately with ❋ warning

### Payment Flow

- [ ] **PAY-01**: Member taps "I've Paid" → pending payment record created in Convex
- [ ] **PAY-02**: After tapping "I've Paid", SETTLE stamp appears at ~50% opacity + "Awaiting [organizer name] to confirm" subtext
- [ ] **PAY-03**: DuitNow QR and organizer phone number visible on claim screen
- [ ] **PAY-04**: Organizer confirms payment → stamp transitions to full opacity + "HAVE A GOOD ONE!" copy
- [ ] **PAY-05**: Organizer can reject payment → member's status resets to unpaid

### Organizer Dashboard

- [ ] **DASH-01**: Dashboard shows live progress: TOTAL COLLECTED (RM amount + blue fill bar) vs bill total
- [ ] **DASH-02**: Stats bar shows counts: CONFIRMED / AWAITING / CLAIMED / UNCLAIMED
- [x] **DASH-03**: Per-person rows show name (handwritten blue), items claimed, amount owed, status
- [ ] **DASH-04**: Status values: `N/A` (organizer self), `CONFIRMED`, `AWAITING` (tapped paid, pending confirm), `CLAIMED — UNPAID`, `UNCLAIMED ❋`
- [ ] **DASH-05**: "STAMP SETTLED" button triggers payment confirmation for AWAITING members
- [ ] **DASH-06**: "SEND REMINDER" nudge action available per unpaid member
- [ ] **DASH-07**: Right panel shows chit summary with dot leaders + quick actions (Copy Share Link, Edit Chit, Close Chit Early)

### Aesthetic & UI

- [ ] **UI-01**: Full chit aesthetic: warm paper background (#EEEAE2), chit surface (#F4EFE6), ink (#1F1B17), pen blue (#1E40AF), stamp red (#B91C1C) reserved for SETTLE + unclaimed ❋ only
- [ ] **UI-02**: Typography: Departure Mono (logotype/headers/stamps), JetBrains Mono (item rows/prices/structural), Shadows Into Light Two (claimant names), Bungee/Anton (SETTLE stamp text)
- [ ] **UI-03**: Dot-leader alignment on all item rows (name....price) and totals rows
- [ ] **UI-04**: Hairline rules (0.5px) between item rows at 60–70% opacity
- [ ] **UI-05**: SETTLE stamp: chunky red, rotated, ink-bleed CSS filter, scale-and-settle animation on land
- [ ] **UI-06**: Perforation mark `─ ─ ─ ✂ ─ ─ ─` dividers between chit sections
- [ ] **UI-07**: "GENERATE LINK →" and "SEND TO WHATSAPP" buttons: full-width blue tape/sticker label style
- [ ] **UI-08**: Logotype: "tongtong." lowercase with red dot (Departure Mono)
- [ ] **UI-09**: One imperfection per chit maximum (slight rotation OR faint crease — never stacked)
- [ ] **UI-10**: Mobile-first responsive; dashboard responsive to desktop 2-column layout
- [ ] **UI-11**: Empty state: "NOTHING HERE YET" chit card + "START A CHIT" button
- [ ] **UI-12**: Loading state: skeleton chit card (gray placeholder bars in chit shape)
- [ ] **UI-13**: Expired/error state: EXPIRED stamp + "THIS CHIT HAS BEEN TORN UP" copy

### Landing Page

- [ ] **LAND-01**: Landing page shows "tongtong." logotype, tagline "A CHIT FOR EVERYONE", hero chit with SETTLED stamp as demonstration
- [ ] **LAND-02**: Manglish marketing copy: "SPLIT THE BILL, NOT THE FRIENDSHIP." + "Eh ya, no more 'you transfer ah?' drama lah. One chit. Everyone tandakan. Beres."
- [ ] **LAND-03**: Primary CTA: "START NEW BILL" chop-style button

## v2 Requirements

### Bonus Features (from PRD §3.3, priority order)

- **BONUS-01**: Screenshot upload as payment proof (Convex file storage)
- **BONUS-02**: WhatsApp share button with pre-filled Manglish message
- **BONUS-03**: Bill auto-archive after 30 days
- **BONUS-04**: Reminder nudges to unpaid members (manual trigger, fresh shareable link)
- **BONUS-05**: Login upgrade path for bill history (Google OAuth via Convex auth)
- **BONUS-06**: Dark mode — "carbon copy" theme (blue on dark blue)
- **BONUS-07**: Designed SVG logotype with baked-in ink bleed
- **BONUS-08**: Export as CSV (shown in dashboard mockup)
- **BONUS-09**: PayNet auto-confirmation (low expectation)
- **BONUS-10**: OCR receipt scanning

## Out of Scope

| Feature | Reason |
|---------|--------|
| User accounts / login | localStorage secrets sufficient for MVP; bills resolve in ~24h |
| Weighted item claims | Equal split only; weighted adds UX complexity |
| Real payment gateway | Manual confirmation acceptable for bounty; avoids payment compliance |
| Notifications / email | Out of scope explicitly in PRD |
| Bill history | No persistence beyond current bill; requires auth upgrade |
| Native mobile app | Web only |
| Multi-currency | RM only |
| Dark mode | Light theme only for MVP |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| BILL-01 | Phase 1 — Working Bill | Pending |
| BILL-02 | Phase 1 — Working Bill | Pending |
| BILL-03 | Phase 1 — Working Bill | Pending |
| BILL-04 | Phase 1 — Working Bill | Pending |
| BILL-05 | Phase 1 — Working Bill | Pending |
| BILL-06 | Phase 1 — Working Bill | Pending |
| AUTH-01 | Phase 1 — Working Bill | Pending |
| AUTH-02 | Phase 1 — Working Bill | Pending |
| AUTH-03 | Phase 1 — Working Bill | Pending |
| SHARE-01 | Phase 1 — Working Bill | Pending |
| SHARE-02 | Phase 1 — Working Bill | Pending |
| SHARE-03 | Phase 1 — Working Bill | Pending |
| SHARE-04 | Phase 1 — Working Bill | Pending |
| PAY-01 | Phase 1 — Working Bill | Pending |
| PAY-02 | Phase 1 — Working Bill | Pending |
| PAY-03 | Phase 1 — Working Bill | Pending |
| PAY-04 | Phase 1 — Working Bill | Pending |
| PAY-05 | Phase 1 — Working Bill | Pending |
| DASH-01 | Phase 1 — Working Bill | Pending |
| DASH-02 | Phase 1 — Working Bill | Pending |
| DASH-03 | Phase 1 — Working Bill | Complete |
| DASH-04 | Phase 1 — Working Bill | Pending |
| DASH-05 | Phase 1 — Working Bill | Pending |
| DASH-06 | Phase 1 — Working Bill | Pending |
| DASH-07 | Phase 1 — Working Bill | Pending |
| CLAIM-01 | Phase 2 — Item Claiming | Pending |
| CLAIM-02 | Phase 2 — Item Claiming | Pending |
| CLAIM-03 | Phase 2 — Item Claiming | Pending |
| CLAIM-04 | Phase 2 — Item Claiming | Pending |
| CLAIM-05 | Phase 2 — Item Claiming | Pending |
| CLAIM-06 | Phase 2 — Item Claiming | Pending |
| CALC-01 | Phase 2 — Item Claiming | Pending |
| CALC-02 | Phase 2 — Item Claiming | Pending |
| CALC-03 | Phase 2 — Item Claiming | Pending |
| CALC-04 | Phase 2 — Item Claiming | Pending |
| CALC-05 | Phase 2 — Item Claiming | Pending |
| UI-01 | Phase 3 — TongTong Aesthetic | Pending |
| UI-02 | Phase 3 — TongTong Aesthetic | Pending |
| UI-03 | Phase 3 — TongTong Aesthetic | Pending |
| UI-04 | Phase 3 — TongTong Aesthetic | Pending |
| UI-05 | Phase 3 — TongTong Aesthetic | Pending |
| UI-06 | Phase 3 — TongTong Aesthetic | Pending |
| UI-07 | Phase 3 — TongTong Aesthetic | Pending |
| UI-08 | Phase 3 — TongTong Aesthetic | Pending |
| UI-09 | Phase 3 — TongTong Aesthetic | Pending |
| UI-10 | Phase 3 — TongTong Aesthetic | Pending |
| UI-11 | Phase 3 — TongTong Aesthetic | Pending |
| UI-12 | Phase 3 — TongTong Aesthetic | Pending |
| UI-13 | Phase 3 — TongTong Aesthetic | Pending |
| LAND-01 | Phase 3 — TongTong Aesthetic | Pending |
| LAND-02 | Phase 3 — TongTong Aesthetic | Pending |
| LAND-03 | Phase 3 — TongTong Aesthetic | Pending |

**Coverage:**
- v1 requirements: 52 total (BILL×6, AUTH×3, SHARE×4, CLAIM×6, CALC×5, PAY×5, DASH×7, UI×13, LAND×3)
- Mapped to phases: 52
- Unmapped: 0

---
*Requirements defined: 2026-05-22*
*Last updated: 2026-05-22 — traceability updated after roadmap creation (PAY and DASH moved to Phase 1 per PRD §8 milestone collapse)*
