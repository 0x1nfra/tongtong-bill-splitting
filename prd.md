# TongTong — Product Requirements Document

**Version:** 1.0 (MVP)
**Last updated:** 21 May 2026
**Status:** Pre-development, scope locked

---

## 1. Product Definition

### 1.1 What it is

TongTong is a web-based bill-splitting app for groups settling a shared payment — restaurant bills, trip costs, house bills, event collections. The organizer creates a bill, gets a shareable link, and tracks who has paid. Friends open the link in WhatsApp, claim what they ordered, see what they owe, send payment, and tap to confirm. The organizer manually verifies each payment.

### 1.2 Why it exists

Splitting a bill among friends is a solved problem socially but an unsolved problem operationally. Receipts get lost. One person ends up doing spreadsheet math. People forget who paid. The organizer chases. Existing tools either over-engineer (Splitwise-style debt graphs nobody asked for) or under-design (a Google Sheet shared in WhatsApp). TongTong sits between: just enough structure to remove the chase, just enough warmth to feel like a friend's chit, not a fintech ledger.

### 1.3 What "TongTong" means

"Tong-tong" is Malaysian shorthand for everyone chipping in to settle together — "tong-tong je lah" being the typical phrase when a group decides to split a bill. The name is the experience, not the function.

### 1.4 The bounty context

This product is being built to satisfy a specific bounty for a "Split Bill + Payment Tracker App." Submission requirements include bill creation, shareable bill page, member payment confirmation, organizer dashboard, payment progress display, mobile-friendly design, distinct creative theme, and a GitHub repo. Real payment gateway integration is explicitly _not_ required — manual confirmation is acceptable. Timeline is tight; scope discipline is therefore the primary risk to manage.

---

## 2. Brand & Design Direction

### 2.1 The metaphor

Every bill is a **chit** — a paper restaurant order pad. The app is the table the chit sits on. Users are friends marking the chit together.

This metaphor governs every screen, every interaction, and every visual decision. When in doubt during build, ask: _does a real chit do this?_ If yes, lean in. If no, reconsider.

### 2.2 Visual aesthetic

Receipts, guest checks, library checkout cards, and ledger pages — the visual language of _structured paper marked by hand_. Inspired by physical receipts (the Checkpoint NY receipt, vintage guest checks, Analia Saban's receipt tapestries), where machine-printed structure carries human marks in ink.

### 2.3 Color system

Three earned colors, plus one reserved color:

| Role             | Color            | Hex       | Usage                                                     |
| ---------------- | ---------------- | --------- | --------------------------------------------------------- |
| Paper (chit)     | Warm off-white   | `#F4EFE6` | The chit surface                                          |
| Paper (table)    | Cooler off-white | `#EEEAE2` | The background behind the chit                            |
| Ink              | Deep charcoal    | `#1F1B17` | All printed structure: rules, headers, item names, prices |
| Pen              | Saturated blue   | `#1E40AF` | Human acts on the chit: claimant names, written notes     |
| Stamp (reserved) | Stamp red        | `#B91C1C` | SETTLE stamp and unclaimed warnings only                  |

Red is **reserved**. It only appears in two contexts: the SETTLE stamp on confirmed payments, and the small `❋` next to unclaimed items on the organizer dashboard. Every red mark in the app means something. If a designer or developer is tempted to use red anywhere else, the answer is no.

### 2.4 Typography

| Role                      | Font                                   | Usage                                          |
| ------------------------- | -------------------------------------- | ---------------------------------------------- |
| Display (machine voice)   | Departure Mono                         | Bill title, totals, TONGTONG logotype, stamps  |
| Body (machine voice)      | JetBrains Mono                         | Item rows, prices, fine print, structural text |
| Handwriting (human voice) | Shadows Into Light Two                 | Claimant names on items, "paid" notes          |
| Stamp (treatment)         | Bungee or Anton + CSS ink-bleed filter | SETTLE stamp, action chops                     |

All fonts are free and available on Google Fonts or open source.

### 2.5 Voice & language

- **In-app language: English.** Clean, terse, no Malaysian-isms in UI labels. Buttons say "Generate Link," "I've Paid," "Confirm." The product works for anyone, not just Malaysians.
- **Landing page language: Manglish.** Marketing voice flexes the cultural roots — "Eh, kongsi bill tak susah lah," "No more _eh you transfer ah?_ drama." The landing converts on warmth, the app delivers on clarity.

### 2.6 Aesthetic discipline

The aesthetic lives or dies in restraint. A few non-negotiables:

- **One imperfection per chit.** A slight rotation OR a faint crease OR an off-register mark — never all three. The eye notices one as charm; multiple as costume.
- **Dot-leader alignment everywhere.** Item names and prices are connected by `....` dot leaders, monospace-aligned. This single typographic detail does more for the aesthetic than any animation.
- **Hairline rules.** Real `0.5px` column rules at 60-70% opacity in ink color. Not Tailwind defaults.
- **Subtle textures only.** Paper grain at 5-7% opacity, ink-bleed filter on stamps only, soft warm shadows under chits. Loud textures kill the aesthetic.
- **One primary action per screen.** One chop-style button. Secondary actions stay as text links or ghost buttons.

### 2.7 The four signature moments

The interactions that make TongTong memorable:

1. **The SETTLE stamp lands** when a payment is confirmed — chunky red, rotated, ink-bled, with a quick scale-and-settle animation.
2. **Names appear in live pen** as members claim items — handwritten, blue, in real time, at slight random rotations.
3. **The chit tears** when a share link is generated — perforated rip, carbon-copy slides out with the link.
4. **The dashboard tally fills in** as payments are confirmed — a thin blue line extends across the "TOTAL COLLECTED" row as money comes in.

---

## 3. Scope — What Ships in MVP

### 3.1 Must-ship features (locked)

1. **Bill creation (organizer):** Title, items (name + price + quantity), participants by name, SST 6% toggle, service charge 10% toggle, DuitNow QR image upload.
2. **Shareable link:** Auto-generated on bill creation. No authentication required for link recipients.
3. **Item claiming (member):** Members open the link, see all items, tap to claim. Multi-claim supported (multiple people can claim the same item; cost splits equally among claimants).
4. **Live calculation:** Each member's total updates in real time as items are claimed, with proportional tax and service charge applied.
5. **Payment confirmation flow:** Member sees QR, taps "I've Paid." Organizer sees a pending claim, manually confirms or rejects.
6. **Organizer dashboard:** Live progress bar, per-person status (unclaimed / claimed-unpaid / paid-pending / settled), confirm/reject controls.
7. **Organizer identity via localStorage:** A random secret is generated on first bill creation and stored locally; it ties bills to the organizer's browser. No login screen.
8. **Mobile-first responsive design:** All screens designed for WhatsApp-link visitors on phones first.
9. **TongTong chit aesthetic:** Full visual theme applied consistently across all screens.

### 3.2 Explicit non-goals for MVP

- No user accounts, login screens, or password recovery.
- No item-level claim conflicts UI (multi-claim splits equally; no "I had 60% of this dish" weighting).
- No real payment gateway integration; manual confirmation only.
- No notifications, reminders, or emails.
- No bill history or past-bills view.
- No native mobile app.
- No multi-currency support; RM only.
- No dark mode (light theme only).

### 3.3 Bonus features (priority order)

If MVP ships ahead of schedule, attempt in this order:

1. Screenshot upload as payment proof (Convex file storage).
2. WhatsApp share button with pre-filled Manglish message.
3. Bill auto-archive after 30 days (keeps Convex free tier safe long-term).
4. Reminder nudges to unpaid members (manual trigger by organizer, generates a fresh shareable link).
5. Login upgrade path for bill history (Google OAuth via Convex auth).
6. Dark mode — "carbon copy" theme (blue on dark blue).
7. Designed SVG logotype with baked-in ink bleed (replaces filtered version).
8. PayNet auto-confirmation, _if_ an accessible API exists (low expectation).
9. OCR receipt scanning.

---

## 4. User Flows

### 4.1 Organizer flow

```
Landing page
  └─> Tap "Start New Bill"
        └─> Bill Builder
              ├─> Enter title, items, participants, toggle tax/service
              ├─> Upload DuitNow QR
              └─> Tap "Generate Link"
                    └─> Share screen (chit + carbon copy with link)
                          ├─> Tap "Copy Link" → share via WhatsApp manually
                          └─> Tap "View Dashboard"
                                └─> Dashboard (live updates)
                                      └─> Confirm/reject payment claims as they arrive
```

### 4.2 Member flow

```
Receives WhatsApp link
  └─> Opens link in browser
        └─> Bill / Claim screen
              ├─> Sees all items, who has claimed what
              ├─> Taps items to claim (multi-claim allowed)
              ├─> Types their name (becomes handwritten "ink" on the chit)
              ├─> Sees their live total
              ├─> Views DuitNow QR
              ├─> Sends payment via their own banking app
              └─> Taps "I've Paid"
                    └─> SETTLE stamp lands in "draft" state
                          └─> Waits for organizer confirmation
                                └─> Stamp transitions to "confirmed" state (full opacity)
```

---

## 5. Screen Specifications

### 5.1 Landing page

**Purpose:** Convert a WhatsApp visitor into a bill creator in under 15 seconds.

**Composition:**

- Full-bleed warm paper background with subtle grain
- One chit floating center-screen, tilted `-1deg`, with warm soft shadow
- Chit header: `TONGTONG` logotype in Departure Mono with CSS ink-bleed filter
- Tagline below logotype: `BILL SPLITTER — KONGSI TAK SUSAH`
- Brief Manglish body copy (3-4 lines) explaining the product
- Primary action: chop-style **"START NEW BILL"** button styled as a rubber stamp at the chit's bottom
- Decorative perforation along the bottom edge: `tear here ✂ ─ ─ ─ ─`

**Voice:** Manglish — this is the only screen where the marketing voice plays.

### 5.2 Bill Builder (Organizer)

**Purpose:** Build a bill quickly without the form feeling like a form.

**Composition:**

- The chit grows downward as items are added
- Sections, top to bottom:
  - **Header band:** `BILL TITLE: [____]` — inline editable text field styled as a labeled chit cell
  - **Item rows:** Each row is a chit line in the format `[qty] [item name......] [price]`. Dot leaders auto-fill the space between name and price live as the user types. New row appears when user taps `+ ADD ITEM` (styled as a marginal handwritten note).
  - **Tax/Service band:** Two checkbox-style cells: `[ ] SST 6%` `[ ] SERVICE 10%`. When checked, they appear in the totals breakdown.
  - **Totals breakdown:** Subtotal, tax (if enabled), service (if enabled), grand total — each on its own ruled row, computed live.
  - **QR upload band:** Dashed drop zone labeled `ATTACH DUITNOW QR ↓`. Tap to upload; image previews inline at small size.
  - **Primary action:** Chop-style **"GENERATE LINK"** stamp at the bottom of the chit.

**Critical UX detail:** Item entry must _feel_ like writing on a chit. Tapping an item row reveals input fields inline within the row — no modal, no separate form view. Price fields are right-aligned monospace.

**Technical risk:** Mobile keyboard handling. The chit must scroll smoothly when iOS keyboard appears; dot-leader generation must not lag on each keystroke. Plan to use uncontrolled inputs with debounced state updates if needed.

### 5.3 Share Screen

**Purpose:** The moment after "Generate Link" is tapped. Give the organizer a frictionless way to copy/send.

**Composition:**

- The chit from Bill Builder, now visible at the top in compressed form (items collapsed into "X items" summary, totals visible)
- A **second smaller chit** slides in below — styled as a carbon-copy duplicate (lighter ink, slight horizontal offset) — containing the share link in dotted-underline mono text
- Three action chops below: **"COPY LINK"**, **"WHATSAPP"** (gated as bonus), **"VIEW DASHBOARD"**

**Signature interaction:** The carbon-copy slide-out animation reinforces the metaphor — the user has just torn off a duplicate of their chit to give to friends.

### 5.4 Bill / Claim Screen (Member)

**Purpose:** The single most important screen in the app. Every member sees this; organizers may never see their own bill from this side. It must be self-explanatory in under 5 seconds.

**Composition (top to bottom):**

- The chit, full-bleed, same visual treatment as the organizer's view (it's the same chit)
- Header band: bill title + organizer name (e.g., `KONGSI BY ALYA`)
- **Items list:** Each row tappable. Tapping reveals a name input ("What's your name?"); after submitting, the user's name appears in handwritten blue pen next to the item. Multi-claim adds additional names to the same row.
- **Floating "your total" cell:** Sticky to the bottom of the screen above the QR. Updates live as items are claimed/unclaimed.
- **DuitNow QR panel:** Framed area styled like a stamp/sticker affixed to the chit. Shows the organizer-uploaded QR.
- **Primary action:** Chop-style **"I'VE PAID"** button at the very bottom.
- **Post-tap state:** SETTLE stamp appears across the user's claimed rows in "draft" state (50% opacity), with subtext: `Pending organizer confirmation`.

**Signature interaction:** Live handwritten names appearing as others claim items in real time. Each name gets a random rotation between `-2deg` and `+2deg` and a quick fade-and-settle animation as it appears.

### 5.5 Organizer Dashboard

**Purpose:** Watch live as the bill settles. Confirm or reject payments.

**Composition:**

- The chit, with a visible tally column on the right showing per-person totals
- **Progress band at top:** A chit-style `TOTAL COLLECTED ...... RM XX.XX / RM YY.YY` row with dot-leaders, plus a thin horizontal pen-blue fill underneath that extends as percentage of total collected
- **Items section:** Same as elsewhere, but unclaimed items get a red `❋` prefix
- **People section:** One row per person who has interacted with the bill, in the format `[NAME].......[AMOUNT].......[STATUS]`. Statuses:
  - `UNCLAIMED ❋` — items nobody has claimed yet (red asterisk)
  - `CLAIMED — UNPAID` — has claimed items, hasn't tapped "I've Paid"
  - `PAID PENDING ✓` — tapped "I've Paid"; awaiting organizer confirmation (paired with small confirm/reject chops)
  - `SETTLED ✓` — confirmed; full red SETTLE stamp on row

**Live updates:** Every state change on the member side appears on the dashboard within the latency of a Convex query (~100-300ms). No manual refresh needed.

---

## 6. Calculation Methodology

### 6.1 Multi-claim item splitting

When an item is claimed by N people, each claimant pays `itemPrice / N` for that item. No weighted claims in MVP — equal split among claimants only.

### 6.2 Proportional tax and service charge

Tax and service charge are applied proportionally to each person's share of the subtotal, _not_ per-item. This prevents rounding drift and matches how restaurants actually present a bill.

**Formula:**

```
For each item i:
  perClaimantCost[i] = itemPrice[i] / numberOfClaimants[i]

For each person p:
  subtotal[p] = sum of perClaimantCost[i] across all items p claimed
  taxShare[p] = (subtotal[p] / billSubtotal) × totalTax
  serviceShare[p] = (subtotal[p] / billSubtotal) × totalServiceCharge
  total[p] = subtotal[p] + taxShare[p] + serviceShare[p]

Where:
  billSubtotal = sum of all itemPrice[i] across the bill
  totalTax = billSubtotal × 0.06 (if SST enabled)
  totalServiceCharge = billSubtotal × 0.10 (if service charge enabled)
```

### 6.3 Rounding

All currency values displayed to 2 decimal places (RM standard). Internal calculations carried at full precision; rounding only at display time.

### 6.4 Edge cases

- **Unclaimed items:** Excluded from per-person totals; tracked separately on dashboard with red `❋` warning.
- **Item with zero claimants:** Treated as unclaimed (warning, not error).
- **Bill with no items:** Cannot generate link (Bill Builder validation).
- **Single claimant on shared item:** Same as standard claim; equal-split formula reduces to full price.

---

## 7. Technical Architecture

### 7.1 Stack

| Layer                   | Technology                 |
| ----------------------- | -------------------------- |
| Frontend framework      | Next.js 14+ (App Router)   |
| Styling                 | Tailwind CSS               |
| Backend / DB / Realtime | Convex                     |
| Hosting                 | Vercel                     |
| Fonts                   | Google Fonts + open-source |

### 7.2 Why this stack

- **Next.js App Router:** Server components keep mobile bundle small; fast first paint on WhatsApp-opened links.
- **Tailwind:** Fastest path to the bespoke chit aesthetic without fighting a component library.
- **Convex:** TypeScript-native (matches user's recent learning), realtime queries built in (live dashboard updates for free), file storage for QR uploads, generous free tier (1M function calls/month).
- **Vercel:** Free, instant deploy, native Next.js support, shareable URLs work immediately.

### 7.3 Data model (Convex schema)

```typescript
// bills
{
  _id: Id<"bills">,
  _creationTime: number,
  organizerSecret: string,        // UUID stored in organizer's localStorage
  title: string,
  applySST: boolean,
  applyServiceCharge: boolean,
  qrStorageId: Id<"_storage">,    // Convex file storage ID for DuitNow QR
  archivedAt?: number,            // For 30-day auto-archive (bonus)
}

// items
{
  _id: Id<"items">,
  billId: Id<"bills">,
  name: string,
  price: number,                  // In RM cents (integer) to avoid float issues
  quantity: number,
  orderIndex: number,             // For preserving display order
}

// claims
{
  _id: Id<"claims">,
  billId: Id<"bills">,
  itemId: Id<"items">,
  claimantName: string,
  claimantSession: string,        // localStorage-stored session ID for this member
  createdAt: number,
}

// payments
{
  _id: Id<"payments">,
  billId: Id<"bills">,
  claimantSession: string,
  status: "pending" | "settled" | "rejected",
  paidAt: number,
  confirmedAt?: number,
  proofStorageId?: Id<"_storage">, // For bonus screenshot feature
}
```

### 7.4 Convex functions (high-level)

**Mutations:**

- `createBill(title, items, applySST, applyServiceCharge, qrStorageId)` → returns `billId, organizerSecret`
- `claimItem(billId, itemId, claimantName, claimantSession)` → adds a claim
- `unclaimItem(claimId, claimantSession)` → removes claim (only the original claimant can unclaim)
- `markPaid(billId, claimantSession)` → creates payment record with status: "pending"
- `confirmPayment(paymentId, organizerSecret)` → status → "settled"; verifies organizerSecret matches bill
- `rejectPayment(paymentId, organizerSecret)` → status → "rejected"

**Queries:**

- `getBillForOrganizer(billId, organizerSecret)` → full bill with all claims, payments; verifies secret
- `getBillForMember(billId)` → public bill view; returns everything except organizerSecret
- `getMyClaims(billId, claimantSession)` → current member's claims and payment status

### 7.5 Authentication model

**No login screen for MVP.**

- **Organizer:** On first visit to the landing page, generate a UUID and store in `localStorage` as `tongtong_organizer_secret`. When creating a bill, pass this secret; Convex stores it on the bill. Dashboard access requires presenting the secret. Lose localStorage = lose dashboard access (acceptable risk for MVP since most bills resolve within 24 hours).
- **Member:** On first visit to a bill link, generate a UUID and store in `localStorage` as `tongtong_session_<billId>`. Used to associate claims and payments with the same person across reloads.

**Security implications:** Bill IDs are unguessable Convex IDs, so casual enumeration is not viable. The organizer secret prevents unauthorized confirmation/rejection. Members can claim or unclaim only their own items (via session match). This is sufficient for MVP; not designed against motivated attackers.

### 7.6 Deployment

- **Vercel project** linked to GitHub repo
- **Convex deployment** for production; separate dev deployment for local testing
- **Custom domain:** Optional for MVP (the default `*.vercel.app` URL is fine for bounty submission)
- **Environment variables:** `NEXT_PUBLIC_CONVEX_URL` only

---

## 8. Build Sequence

The order in which the MVP is built. Each milestone should be working end-to-end before moving to the next, to ensure something submittable always exists.

### Milestone 1 — Skeleton (highest priority)

Goal: A bill can be created and shared, and members can see it. No styling yet.

- [ ] Next.js + Tailwind + Convex project scaffolded, deployed to Vercel
- [ ] Convex schema in place
- [ ] Bill creation form (unstyled): title, items, participants, tax/service toggles
- [ ] Generate shareable link with bill ID in URL
- [ ] Member view of bill (unstyled): see items, see totals
- [ ] localStorage-based organizer secret + member session

### Milestone 2 — Equal-split flow end-to-end

Goal: Organizer creates → members see bill → equal-split totals shown → "I've paid" works → organizer confirms.

- [ ] Each member's total displayed using equal-split (not item-claim yet — every participant gets equal share including tax)
- [ ] DuitNow QR upload (Convex file storage)
- [ ] Member "I've Paid" creates pending payment
- [ ] Organizer dashboard shows per-person status
- [ ] Confirm/reject controls work and update member view in real time

**Checkpoint: This is the minimum submittable product.** If we stop here, we have something that satisfies bounty requirements 1-7. Item claiming becomes a stretch goal.

### Milestone 3 — Item claiming

Goal: The KongsiCheck differentiator. Members claim their own items; multi-claim works; totals update accordingly.

- [ ] Tappable items on member view
- [ ] Multi-claim support (equal split among claimants)
- [ ] Proportional tax/service calculation per the formula
- [ ] Unclaimed-items warning on dashboard
- [ ] Live updates when others claim

### Milestone 4 — TongTong aesthetic

Goal: Apply the full visual theme. This is what wins the bounty's branding criterion.

- [ ] Color system + CSS variables
- [ ] Typography: Departure Mono, JetBrains Mono, Shadows Into Light Two, Bungee
- [ ] Paper grain background, warm shadows under chits
- [ ] Hairline column rules, dot-leader alignment
- [ ] SETTLE stamp with ink-bleed filter and landing animation
- [ ] Handwritten claimant names with random rotation
- [ ] Perforation between items and totals
- [ ] Chop-style primary buttons
- [ ] Mobile responsive polish

### Milestone 5 — Bonus features (in priority order from §3.3)

Only after Milestone 4 ships. Stop at any point — each bonus is independent.

### 8.1 Time-boxing recommendation

Without knowing the bounty deadline, my recommendation is to time-box ruthlessly:

- Milestones 1-2 should ship in the first ~40% of available time. If they slip, drop Milestone 3 entirely and use the freed time for Milestone 4 — a beautifully designed equal-split tool is more competitive than an ugly item-claim tool.
- Milestone 4 should get at least 25% of available time. The aesthetic is a primary judging criterion.
- Milestone 3 sits in the middle and is the first thing to cut if behind schedule.

---

## 9. Risks & Open Questions

### 9.1 Technical risks

- **Mobile keyboard + chit scroll behavior.** The Bill Builder's inline-edit chit rows must work smoothly with iOS keyboard. If it proves janky, fallback is a more conventional form view for Bill Builder while keeping the chit aesthetic for read-only views.
- **Dot-leader rendering performance.** Computing dot leaders on every keystroke could lag on long bills. Mitigation: pure CSS approach using `flex: 1` with a `repeating-linear-gradient` background of dots, no JS recalculation.
- **CSS ink-bleed filter performance on mobile Safari.** SVG `feTurbulence` + `feDisplacementMap` can be slow on older iPhones. Mitigation: apply only to stamps (occasional, not on every text run), and provide a fallback solid-color version if rendering frame rate drops.
- **Convex free tier exhaustion.** Unlikely at bounty-demo scale. Belt-and-suspenders: bill auto-archive after 30 days (bonus feature) caps cumulative database growth.

### 9.2 UX risks

- **Members get confused about who they are.** If a member opens the same bill link on two different devices, they appear as two different sessions. Mitigation: in the post-tap state, prompt "Is this you? [Yes / No, I'm someone else]" the first time. Defer to v2 if needed.
- **The "draft stamp" pending state is unclear.** Members may think tapping "I've Paid" is final. Mitigation: explicit subtext under the draft stamp: `Waiting for [organizer name] to confirm.`
- **Organizer abandons bill.** Members can claim and "pay" indefinitely with no confirmation. Acceptable for MVP — this is a social-trust product, not a fraud-prevention product.

### 9.3 Brand risks

- **The aesthetic slips into kitsch.** Loud textures, too many imperfections, decorative-but-meaningless red marks would all break the discipline outlined in §2.6. Mitigation: strict adherence to "one imperfection per chit" and "red means SETTLE or unclaimed, nothing else."
- **The Manglish voice on the landing page reads as inauthentic.** Mitigation: copy review pass before deployment; ideally read aloud by an actual Malaysian to test.

### 9.4 Open questions to resolve during build

- **Domain name:** Use Vercel default for MVP submission, or register `tongtong.app` / similar?
- **Favicon and OG image:** Need a small chit-style favicon and a beautiful OG preview image for WhatsApp link previews — the OG image is the _first_ impression for every recipient.
- **Privacy / data retention:** Should we display a small notice on the landing page about what's stored and for how long? Probably worth adding.

---

## 10. Out-of-Scope Reference (post-bounty roadmap)

Things explicitly _not_ in MVP that may become future work, captured here so they're not lost:

- Native iOS app (the original KongsiCheck Swift plan)
- Weighted item claims ("I had 60% of this dish")
- Bill history and search (requires upgrading from anonymous auth)
- Multi-currency
- Recurring bills (rent, utilities, subscriptions)
- OCR receipt scanning
- Push notifications and email reminders
- Real payment gateway integration (Stripe, FPX, etc.)
- Group / friend management (saved contacts)
- Bill templates ("makan kaki" group, "trip squad")
- Analytics for organizers (how often do they split, who pays slowest)

---

## Appendix A: Glossary

| Term                      | Meaning                                                                                |
| ------------------------- | -------------------------------------------------------------------------------------- |
| Chit                      | Paper restaurant order pad; the core visual metaphor of the app                        |
| Chop                      | Rubber stamp; styled as primary action buttons in TongTong                             |
| Kongsi                    | Bahasa Malaysia for "share"                                                            |
| Tong-tong                 | Colloquial Malaysian for splitting a bill equally                                      |
| Lunas                     | Bahasa Malaysia for "paid / settled" — _not_ used in TongTong UI; replaced by SETTLE   |
| Settle                    | The act of confirming payment; the red stamp word on confirmed payments                |
| SST                       | Sales and Service Tax — 6% in Malaysia                                                 |
| DuitNow QR                | Malaysian instant-payment QR code standard, supported by all major banks and e-wallets |
| Pen / Ink / Paper / Stamp | The four color roles in TongTong's visual system                                       |
