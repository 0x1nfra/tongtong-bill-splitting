---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
current_phase: 08
status: executing
stopped_at: Phase 08 Plan 01 complete — auth foundation + providers wired
last_updated: "2026-06-06T14:00:00.000Z"
progress:
  total_phases: 10
  completed_phases: 8
  total_plans: 39
  completed_plans: 37
  percent: 81
---

# TongTong — Project State

**Initialized:** 2026-05-22
**Current Phase:** 08
**Status:** Executing Phase 08

## Project Reference

See: .planning/PROJECT.md

**Core value:** Share a link — friends claim items, see what they owe, confirm payment. Organizer stops chasing.
**Current focus:** Phase 08 — google-auth

## Roadmap Summary

- **Phase 1: Working Bill** — Organizer creates a bill, shares a link, members view it, payment flow and dashboard work end-to-end (functional, unstyled)
- **Phase 2: Item Claiming** — Members tap to claim individual items; multi-claim splits cost; live proportional totals per person
- **Phase 3: TongTong Aesthetic** — Full chit visual theme and landing page applied across every screen

## Current Position

Phase: 08 (google-auth) — EXECUTING
Plan: 2 of 3 (Plan 01 complete)
**Phase:** 2 — Item Claiming
**Plans:** 0/? plans complete
**Progress:** [██████████] 100%

## Performance Metrics

- Phases completed: 2 / 4 (Phase 1 + Phase 01.1 tech debt)
- Requirements delivered: 25 / 52 (BILL, AUTH, SHARE, PAY, DASH series — Phase 01.1 was tech debt with no formal req IDs)

## Accumulated Context

### Roadmap Evolution

- Phase 01.1 inserted after Phase 1: Tech debt: DASH-04 label fix + calculateTotals extraction (URGENT)
- Phase 4 added: Bonus Features (BONUS-03 auto-archive, BONUS-04 reminder nudges, BONUS-05 Google OAuth, BONUS-06 dark mode)
- Phase 4 plan 05 added (2026-05-29): dashboard PEOPLE tab from claims + collapsible items toggle + remove slanted card rotations
- Phase 5 added: bonus additions — Departure Mono headings + landing page enhancements (benefits, how-it-works guide)
- Phase 6 added: Math & Precision Fixes — fix calculation bugs, rounding adjustment option
- Phase 7 added: Claiming & Payment UX — banking info fields, claim items by quantity per member
- Phase 8 added: Google Auth — Google sign-in for organizer bill access persistence
- Phase 9 added: Bill editing — organizer can edit items, prices, and tax toggles after bill creation

### Decisions

- Coarse granularity applied: PRD milestones 1+2 collapsed into Phase 1, milestone 3 into Phase 2, milestone 4 into Phase 3
- Phase 3 deferred all aesthetic requirements to avoid horizontal layering; functional vertical slices ship first
- Phase 4 scoped to feasible bonus reqs: BONUS-03, BONUS-04, BONUS-05, BONUS-06 (BONUS-01/02/07/08 already shipped on feat/bonus branch)
- Phase 08-01: @auth/core pinned to exactly 0.37.0 (not ^0.37.0) — required by @convex-dev/auth peer range
- Phase 08-01: No proxy.ts or middleware.ts — auth is optional per D-01; Next.js 16 proxy compatibility issue (#271)
- Phase 08-01: OAuth redirect URI points to Convex .site URL — auth callback must reach Convex HTTP actions, not Next.js app

### Key Constraints

- Red (#B91C1C) reserved strictly for SETTLE stamp and unclaimed ❋ — no exceptions
- Prices stored as integer RM cents internally
- Next.js App Router only (no Pages Router)
- pnpm package manager
- Minimum submittable product = Phase 1 complete (satisfies bounty requirements 1-7)

### Todos

(none yet)

### Blockers

(none)

## Phase History

- **Phase 01 (working-bill):** COMPLETE — 2026-05-24. 6/6 plans, 5 waves. 25 requirements delivered. Score: 21/24 must-haves verified. 5 critical bugs in REVIEW.md (CR-01–05) need fixing before Phase 2 can build on dashboard stats reliably. 6 items need browser/live testing.
- **Phase 01.1 (tech-debt):** COMPLETE — 2026-05-24. 3/3 plans, 2 waves. calculateTotals extracted to src/lib/calculateTotals.ts; 3 inline duplicates removed; DASH-04 label fix confirmed; Nyquist tests added (13 new, 75 total).

## Session Continuity

Last session: 2026-06-06T14:00:00.000Z
Stopped at: Phase 08 Plan 01 complete — convex-auth foundation, providers, and credentials wired
Resume file: .planning/phases/08-google-auth/08-02-PLAN.md
