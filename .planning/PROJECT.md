# TongTong

## What This Is

TongTong is a web-based bill-splitting app for group dining and shared expenses. Organizers create a bill, generate a shareable WhatsApp link, and track payments as friends claim items and confirm via DuitNow QR. The visual identity is a receipt/chit metaphor — warm paper, handwritten pen marks, rubber stamp actions — built for Malaysian social context.

## Core Value

A friend who has already paid can share a link that lets everyone else claim what they ordered, see exactly what they owe, and confirm payment — without the organizer chasing anyone.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Organizer can create a bill with title, line items (name + price + quantity), SST 6% toggle, service charge 10% toggle, and DuitNow QR upload
- [ ] Organizer identity tied to localStorage UUID (no login screen)
- [ ] Shareable link auto-generated on bill creation; recipients require no auth
- [ ] Members can claim items (tappable rows); multi-claim splits item cost equally among claimants
- [ ] Each member's total updates live as items are claimed, with proportional tax/service charge
- [ ] Member can tap "I've Paid" → creates pending payment visible on organizer dashboard
- [ ] Organizer dashboard shows live per-person status with confirm/reject controls
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
- Codebase map: `.planning/codebase/` — existing Next.js + Convex scaffold in place (initial commit)
- Stack: Next.js 15 App Router, Convex (realtime DB + file storage), Tailwind CSS, TypeScript, Vercel hosting
- Auth model: organizer identified by `tongtong_organizer_secret` (UUID in localStorage); members by `tongtong_session_<billId>`; both unguessable, sufficient for MVP trust model
- Payment: DuitNow QR uploaded to Convex file storage; organizer manually confirms/rejects each "I've Paid" claim
- Aesthetic: chit metaphor governs every screen — receipt paper colors (#F4EFE6 paper, #1F1B17 ink, #1E40AF pen, #B91C1C stamp reserved for SETTLE only), hairline rules, dot leaders, one imperfection per chit

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
| Price stored as integer (RM cents) | Avoids float precision issues in financial calculations | — Pending |
| Proportional tax per person | Prevents rounding drift; matches how restaurants present bills | — Pending |

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
*Last updated: 2026-05-22 after initialization*
