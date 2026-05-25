# TongTong

## What This Is

TongTong is a web-based bill-splitting app for group dining and shared expenses. Organizers create a bill, generate a shareable WhatsApp link, and track payments as friends claim items and confirm via DuitNow QR. The visual identity is a receipt/chit metaphor — warm paper, handwritten pen marks, rubber stamp actions — built for Malaysian social context.

## Core Value

A friend who has already paid can share a link that lets everyone else claim what they ordered, see exactly what they owe, and confirm payment — without the organizer chasing anyone.

## Requirements

### Validated

- ✓ Organizer can create a bill with title, line items (name + price + quantity), SST 6% toggle, service charge 10% toggle, and DuitNow QR upload — Phase 1
- ✓ Organizer identity tied to localStorage UUID (no login screen) — Phase 1
- ✓ Shareable link auto-generated on bill creation; recipients require no auth — Phase 1
- ✓ Member can tap "I've Paid" → creates pending payment visible on organizer dashboard — Phase 1
- ✓ Organizer dashboard shows live per-person status with confirm/reject controls — Phase 1

### Active

- [ ] Members can claim items (tappable rows); multi-claim splits item cost equally among claimants
- [ ] Each member's total updates live as items are claimed, with proportional tax/service charge
- [ ] Full TongTong chit aesthetic: paper colors, Departure Mono / JetBrains Mono / Shadows Into Light Two fonts, dot-leader alignment, SETTLE stamp, handwritten claimant names with random rotation
- [ ] Mobile-first responsive design for WhatsApp link recipients

### Out of Scope

- User accounts / login / password recovery — localStorage secrets are sufficient for MVP (bills resolve in ~24h)
- Weighted item claims — equal split only in MVP
- Real payment gateway integration — manual organizer confirmation only
- Notifications, reminders, emails — out of scope
- Bill history / past-bills view — no persistence beyond current bill
- Native mobile app — web only
- Multi-currency — RM only
- Dark mode — light theme only

## Context

- Source of truth: `prd.md` — complete product definition, brand guide, data model, build sequence
- Design mockups: `TongTong — Chit Design · Print.pdf` — 8 hi-fi screens (landing, bill builder, share, claim, pending, settled, dashboard, UI states)
- Codebase map: `.planning/codebase/` — existing Next.js + Convex scaffold in place (initial commit)
- Stack: Next.js 15 App Router, Convex (realtime DB + file storage), Tailwind CSS, TypeScript, Vercel hosting
- Auth model: organizer identified by `tongtong_organizer_secret` (UUID in localStorage); members by `tongtong_session_<billId>`; both unguessable, sufficient for MVP trust model
- Payment: DuitNow QR uploaded to Convex file storage; organizer manually confirms/rejects each "I've Paid" claim
- Aesthetic: chit metaphor governs every screen — receipt paper colors (#F4EFE6 paper, #1F1B17 ink, #1E40AF pen, #B91C1C stamp reserved for SETTLE only), hairline rules, dot leaders, one imperfection per chit

### Design Mock Key Details (from PDF)

- **Bill ID format**: `#TT-04F2` short code; URL slug: `tongtong.my/c/04F2-pakmat` (restaurant name appended)
- **Bill expiry**: 7 days ("stays open 7 days" shown in builder footer)
- **Organizer name** appears as handwritten blue on chit header: `ORGANIZER · Alya`
- **Unclaimed items**: ❋ prefix + red inline "CLAIM" button + "who ordered this?" copy
- **Dot rows under items**: `......` separator between item price row and claimant names row
- **"I've Paid" pending state**: SETTLE stamp at ~50% opacity + "AWAITING CONFIRM" secondary text overlaid
- **Settled state**: full red SETTLE stamp + "HAVE A GOOD ONE!" in blue pen below
- **Dashboard layout**: desktop = 2 columns (left: people list + progress, right: chit summary + quick actions)
- **Dashboard actions**: "STAMP SETTLED" blue button (confirm), "SEND REMINDER" (nudge), "CLOSE CHIT EARLY" in red
- **Dashboard stats bar**: CONFIRMED / AWAITING / CLAIMED / UNCLAIMED counts at a glance
- **"GENERATE LINK →"** and **"SEND TO WHATSAPP"** buttons: full-width blue tape/sticker label style (not rubber chop)
- **Empty state**: "NO CHITS / NOTHING HERE YET" + "Your kopitiam life starts when somebody pulls out a receipt." + "START A CHIT" button
- **Loading state**: skeleton chit card (gray placeholder bars)
- **Expired state**: red EXPIRED stamp + "THIS CHIT HAS BEEN TORN UP"
- **Carbon copy share section**: handwritten blue "Eh tonight's chit! Tandakan ya 🧾" with mini receipt icon

## Constraints

- **Scope**: Bounty submission with tight timeline — Milestones 1-2 are minimum submittable; Milestone 3 (item claiming) is first cut if behind schedule
- **Design**: Red (#B91C1C) used only for SETTLE stamp and unclaimed-item warnings — no exceptions
- **Budget**: Convex free tier (1M function calls/month) — sufficient for demo scale
- **Tech**: Next.js App Router only (no Pages Router); Convex TypeScript-native functions; pnpm package manager

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| No auth for MVP | Bills resolve within 24h; localStorage secrets prevent unauthorized confirm/reject | — Pending |
| Convex for backend | TypeScript-native, realtime queries built in, free tier generous, file storage for QR | — Pending |
| Equal-split multi-claim only | Weighted claims add UX complexity not needed for MVP differentiator | — Pending |
| Price stored as integer (RM cents) | Avoids float precision issues in financial calculations | Validated — Phase 1 |
| Proportional tax per person | Prevents rounding drift; matches how restaurants present bills | — Pending (Phase 2) |
| calculateTotals extracted to src/lib/calculateTotals.ts | Eliminates 3 inline duplicates; integer-cent inputs; Math.round on % calcs; service charge before SST (Malaysian convention) | Shipped — Phase 01.1 |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-24 after Phase 01.1 (calculateTotals extraction + DASH-04 confirmation)*
