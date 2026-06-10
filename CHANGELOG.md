# Changelog

All notable changes to TongTong will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.1] - 2026-06-07

### Added

- **Inline item editor** — organizer can edit item name, price, and quantity directly in the dashboard item table
- **Total column** — item editor exposes a Total field alongside Price; editing either recalculates the other (bidirectional sync)

### Fixed

- Total field preserves exact entered value instead of recalculating from price × qty (floating-point drift)
- `organizerSecret` null coerced to `undefined` on `setBillReceipt` and `updateQR` to satisfy Convex validator

## [1.2.0] - 2026-06-07

### Added

- **Google OAuth** — organizers can sign in with Google via `convex-auth`; dashboard shows sign-in banner for unauthenticated sessions
- **Dual-auth guard** — all organizer mutations accept either `organizerSecret` (legacy) or a verified Google session; both paths enforced on `bills.ts` and `payments.ts`
- **Sign-out button** — dashboard header exposes sign-out action for Google-auth sessions
- **Banking info at creation** — bank name, account number, account holder, and reference fields available in the create flow
- **Rounding adjustment** — organizer can add a rounding adjustment cent amount; propagated through `calculateTotals` and shown as a dedicated row in bill totals
- **Member view transfer-to section** — banking info surfaced in the payment zone so members see where to transfer

### Fixed

- Item total price display in UAT verification
- Transfer-to section visibility
- Rounding adjustment colour and QR upload placement
- Banking input stale-closure and trim sanitisation
- `getMyPayment` uses `collect` + priority reduce to avoid returning stale rejected records
- Banking fields clearable via null patch
- `setIsSubmitting(false)` moved to `finally` block in `handleGenerate`
- `pendingItems` guard and `finally` block added to `handleNameSubmit`
- `key` prop on rounding adjustment inputs forces remount on external update
- Server-side title validation added to `createBill`
- Banking info `onBlur` moved to container level to prevent concurrent mutation races
- OAuth proxy route added at `/api/auth` for Google OAuth sign-in

## [1.1.0] - 2026-06-01

### Added

- **Auto-archive** — bills inactive for 30 days are automatically archived via a daily Convex cron job; all six write mutations reject frozen bills
- **ARCHIVED stamp** — member view and dashboard both surface the archived state with a rubber-stamp overlay
- **Organizer nudge** — per-member WhatsApp reminder link scoped to unpaid members on the dashboard
- **Dark mode** — carbon-copy theme (dark blue background, blue text); `ThemeToggle` in dashboard header; wired via `next-themes` across all screens
- **Dashboard PEOPLE tab** — derived from actual claims; collapsible per-member item list via `getClaimantsForBill` query
- **Receipt upload in create flow** — separate `receiptStorageId` field; receipt photo attached at bill creation
- **QR quick action on dashboard** — UPLOAD QR / REPLACE QR button wired to new `updateQR` mutation
- **Receipt lightbox** — full-screen receipt preview on member view with keyboard navigation
- **Landing page enhancements** — benefits section, how-it-works guide, SVG logotype, Manglish copy, tagline, and footer
- **Departure Mono headings** — global `h1/h2/h3` rule applied across all screens; self-hosted via `next/font/google`
- **CSV export** — organizer can download bill data as CSV from dashboard
- **Full tax breakdown on share page** — subtotal, service charge, SST, and grand total broken out line-by-line
- **`BillSummaryCard` item list** — dot-leader rows showing item name and price

### Changed

- Create page redesigned as a single receipt surface (chit metaphor end-to-end)
- Share page redesigned as a single receipt surface with reorganised layout
- Demo chit on landing page upgraded to a full interactive receipt
- Bill identity (venue name, bill title) promoted consistently across all pages
- Dashboard card layout flattened — slanted card rotations removed; rubber stamps retained
- Terminology: user-facing "chit" renamed to "bill" throughout
- Claim guide copy shortened from 23 words to 11 words
- `BillSummaryCard` wired into both share page and dashboard

### Fixed

- Per-member amount calculation now correctly handles multi-quantity item splits
- Multi-qty item claiming — claiming one unit of a shared item no longer locks out other claimants
- Dark mode dotted lines, chit card contrast, and banner column width
- Dark mode CSS regression — `@theme inline` was preventing runtime token overrides
- `.chit` background uses CSS variable so dark mode token applies correctly
- Archived banner border style and stamp spacing
- Accessibility audit pass — contrast ratios, ARIA labels, focus management, reduced-motion support
- Image optimisation — replaced unoptimised `<img>` tags with `next/image` where applicable
- Cursor consistency — `cursor-pointer` applied uniformly to all interactive elements
- Clipboard copy shows error feedback on failure

## [1.0.0] - 2026-05-26

Initial submission-ready release.

- Bill creation with items, SST/service charge toggles, and DuitNow QR upload
- Shareable WhatsApp link (`/c/[billId]`) for group item claiming
- Member view with interactive claim rows, Your Portion panel, and payment confirmation flow
- Organizer dashboard with payment status, stats bar, and confirm/reject actions
- Chit aesthetic — receipt paper, dot-leaders, perforation dividers, rubber stamps, Departure Mono + Bungee fonts
- `calculateTotals` shared library with per-member split calculation
- Convex backend — real-time queries, typed mutations, file storage for QR codes
- Session-based identity via `localStorage` (no auth required)

[Unreleased]: https://github.com/0x1nfra/tongtong-bill-splitting/compare/v1.2.1...HEAD
[1.2.1]: https://github.com/0x1nfra/tongtong-bill-splitting/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/0x1nfra/tongtong-bill-splitting/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/0x1nfra/tongtong-bill-splitting/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/0x1nfra/tongtong-bill-splitting/releases/tag/v1.0.0
