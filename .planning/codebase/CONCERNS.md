# Codebase Concerns

**Analysis Date:** 2026-05-22

---

## Summary

The project is in very early scaffolding state — the schema is defined but zero Convex backend functions exist, and the frontend is a single placeholder page. The gap between PRD intent and current implementation is near-total: Milestones 1-4 of 5 are unstarted. All concerns below are therefore primarily about missing implementation rather than flawed implementation.

---

## Missing Implementation (PRD vs. Reality Gap)

**Severity: HIGH — Nothing beyond scaffold exists.**

The PRD defines four locked MVP milestones. Current implementation covers none of them:

| PRD Milestone | Status | What's Missing |
|---|---|---|
| Milestone 1 — Skeleton | Not started | Bill creation form, shareable URL route, member view, localStorage session logic, Convex mutations/queries |
| Milestone 2 — Equal-split flow | Not started | Equal-split calc, QR upload, "I've Paid" mutation, organizer dashboard route, confirm/reject mutations |
| Milestone 3 — Item claiming | Not started | Tappable items, multi-claim, proportional tax calc, unclaimed-item warning |
| Milestone 4 — TongTong aesthetic | Partially started | Color system, fonts, paper grain, perforation CSS exist in `src/app/globals.css` — all visual components (SETTLE stamp, chit-tear animation, handwritten name overlay, live tally bar) are absent |

**Specific missing files:**
- No `src/app/bill/[billId]/page.tsx` — member claim screen (the single most-visited screen)
- No `src/app/dashboard/[billId]/page.tsx` — organizer dashboard
- No `src/app/new/page.tsx` or equivalent — bill builder form
- No `src/app/share/[billId]/page.tsx` — share screen / carbon-copy animation
- No `convex/bills.ts` — `createBill`, `getBillForOrganizer`, `getBillForMember` functions
- No `convex/claims.ts` — `claimItem`, `unclaimItem` functions
- No `convex/payments.ts` — `markPaid`, `confirmPayment`, `rejectPayment` functions
- No `src/lib/` or `src/utils/` — calculation logic (proportional tax formula from PRD §6.2)

---

## Security Concerns

**Severity: HIGH — Convex environment variable uses non-null assertion without fallback.**

- **File:** `src/components/ConvexClientProvider.tsx:5`
- **Issue:** `process.env.NEXT_PUBLIC_CONVEX_URL!` — the non-null assertion suppresses a TypeScript error but does not prevent a runtime crash if the variable is absent. In a Vercel deploy where the env var is misconfigured, every page load will throw and the app is completely unusable.
- **Fix:** Add a guard: `if (!process.env.NEXT_PUBLIC_CONVEX_URL) throw new Error("NEXT_PUBLIC_CONVEX_URL is required")` at module load, or validate in `next.config.ts`.

**Severity: HIGH — organizerSecret is a weak identity control.**

- **File:** `convex/schema.ts:6` (field definition) — no implementation yet
- **Issue:** PRD §7.5 documents that organizer identity is a UUID stored in localStorage. This secret is passed as a plain string in Convex mutation arguments and stored in the `bills` table as cleartext. Any client who guesses or obtains a `billId` and `organizerSecret` pair can confirm/reject payments. The secret is never hashed. If Convex data is ever inspected via Convex dashboard by another team member or attacker, all organizer secrets are visible in plaintext.
- **Impact:** Unauthorized payment confirmation or rejection on any bill.
- **Fix:** Hash the secret before storing (e.g., SHA-256); verify against the hash in Convex mutations. Alternatively accept this risk explicitly in the PRD's stated security model (which partially does — "not designed against motivated attackers").

**Severity: HIGH — No input validation on Convex mutations (not yet written).**

- **Issue:** The schema uses `v.string()` for fields like `claimantName`, `title`, and `organizerSecret` with no length limits. When mutations are written, there is no schema-enforced max length. A malicious user could submit 1MB strings as a claimant name, inflating database size toward Convex free tier limits.
- **Fix:** Use `v.string()` with length constraints in schema validators, or add explicit length checks at the top of each mutation function.

**Severity: HIGH — No QR image validation path exists yet.**

- **Issue:** PRD §3.1 requires DuitNow QR image upload via Convex file storage. When implemented, there is currently no plan in place to validate MIME type server-side before storing. Convex file storage accepts arbitrary blobs; a user could upload non-image content. The PRD does not specify validation requirements.
- **Fix:** Validate MIME type and file size in a Convex action wrapping the storage upload before storing `qrStorageId` on the bill.

**Severity: MEDIUM — claimantSession is a self-reported UUID with no verification.**

- **File:** `convex/schema.ts:23` (field definition)
- **Issue:** `claimantSession` is generated client-side and passed to Convex. Any member could forge another member's session ID and unclaim their items or hijack their payment record. PRD §7.5 acknowledges this is acceptable for MVP social-trust context, but it is a real vulnerability for any adversarial use.
- **Impact:** Item claim spoofing, payment record manipulation.
- **Fix:** Acknowledged in PRD as acceptable. Document explicitly when implementing `unclaimItem` to match session from query context, not just parameter.

**Severity: MEDIUM — No Content Security Policy headers.**

- **File:** `next.config.ts` — currently empty (`{}`)
- **Issue:** No CSP, X-Frame-Options, or other security headers are configured. The app embeds Google Fonts and a CDN font (`fonts.cdnfonts.com` for Departure Mono) — `src/app/globals.css:1-2`. Without a CSP, XSS attacks have full DOM access.
- **Fix:** Add `headers()` in `next.config.ts` with a CSP that whitelists Google Fonts, `fonts.cdnfonts.com`, and the Convex URL.

---

## Performance Risks

**Severity: MEDIUM — Convex generated types are unresolved (schema not pushed).**

- **File:** `convex/_generated/dataModel.d.ts:17-33`
- **Issue:** The generated `dataModel.d.ts` contains the message "No `schema.ts` file found!" and defines `Doc = any`. This means `convex/schema.ts` has been written but never pushed to the Convex dev deployment (`npx convex dev` not run or not completing). All Convex queries/mutations written against `api.*` will have no type safety until this is resolved.
- **Fix:** Run `pnpm dev:convex` and confirm generated types reflect the actual schema tables (`bills`, `items`, `claims`, `payments`).

**Severity: MEDIUM — Font loading from two external CDNs, no fallback strategy.**

- **File:** `src/app/globals.css:1-2`
- **Issue:** Google Fonts loads JetBrains Mono, Shadows Into Light Two, and Bungee. A separate CDN (`fonts.cdnfonts.com`) loads Departure Mono. Two CDN dependencies means two round trips before fonts render. `fonts.cdnfonts.com` is not a major CDN — availability and latency on mobile connections in Malaysia are not guaranteed. The app's entire visual identity depends on Departure Mono loading correctly.
- **Impact:** FOUT (Flash of Unstyled Text) on the logotype and all display text. The chit aesthetic degrades visibly on slow connections.
- **Fix:** Self-host Departure Mono as a `@font-face` in `public/fonts/` (it is listed as open-source in PRD §2.4). Use `next/font` for Google Fonts with `display: swap` and proper preloading.

**Severity: MEDIUM — Paper grain SVG filter is applied globally via `body::before`.**

- **File:** `src/app/globals.css:31-40`
- **Issue:** The noise texture uses an inline SVG `feTurbulence` filter on a `position: fixed; inset: 0` pseudo-element with `z-index: 9999`. This covers the entire viewport on every page repaint. On mobile Safari (the primary target — PRD §7.2), fixed-position elements with SVG filters cause full compositing layer promotion and increased memory pressure during scroll.
- **Impact:** Scroll jank on the member bill/claim screen (the highest-traffic screen) on older iPhones.
- **Fix:** Replace with a static pre-rendered noise PNG at `public/noise.png` (generated once offline), used as a CSS background-image. Lower z-index to avoid compositing on interactive elements.

**Severity: LOW — `price` field stored as `v.number()` but PRD specifies integer cents.**

- **File:** `convex/schema.ts:17`
- **Issue:** `v.number()` in Convex allows floating-point values. The PRD (§7.3) explicitly states prices should be stored as RM cents (integer) to avoid float issues. Without a validator enforcing integer values, a UI bug (or direct API call) could store `12.99` as `1299.0` or `12.990000000001` depending on the source.
- **Impact:** Calculation drift in the proportional tax formula (PRD §6.2), display rounding errors.
- **Fix:** Use `v.int64()` if Convex supports it, or add an explicit integer check in the `createBill` mutation before inserting. Document the "price is in cents" contract clearly in code comments.

---

## Technical Debt

**Severity: HIGH — Convex API module is completely empty.**

- **File:** `convex/_generated/api.d.ts:17` — `fullApi: ApiFromModules<{}>` (empty)
- **Issue:** No Convex functions have been written. The `api` object exported from `convex/_generated/api.js` exposes nothing. Any frontend code calling `api.bills.createBill` etc. will fail at runtime with no TypeScript warning because the generated types have `Doc = any` and `TableNames = string`.

**Severity: MEDIUM — `next.config.ts` is a completely empty config object.**

- **File:** `next.config.ts:3-5`
- **Issue:** No `images.remotePatterns` for Convex storage URLs (needed for `<Image>` components rendering QR codes), no security headers, no redirects for the organizer secret deep-link flow. This will block implementation of the QR display feature.
- **Fix:** When implementing QR display, add `images.remotePatterns` to permit the Convex storage domain.

**Severity: MEDIUM — OG image is incomplete.**

- **File:** `src/app/layout.tsx:8-11`
- **Issue:** The `openGraph` metadata block has `title` and `description` but no `images` field. PRD §9.4 identifies the OG image as "the first impression for every recipient" (WhatsApp link previews). WhatsApp generates preview cards from OG metadata — without an `og:image`, link shares in WhatsApp show a blank preview, directly harming conversion.
- **Fix:** Create an OG image (static PNG or Next.js `opengraph-image.tsx`) and add it to the metadata before deployment.

---

## Type Safety Gaps

**Severity: HIGH — Convex generated types are `any` throughout.**

- **Files:** `convex/_generated/dataModel.d.ts:33`, `convex/_generated/api.d.ts:29,42`
- **Issue:** `Doc = any`, `FunctionReference<any, "public">` — all Convex type-checking is bypassed until `npx convex dev` is run against a live deployment with `schema.ts` in place. Any code written against `api.*` before this is resolved will have silent type errors.

**Severity: MEDIUM — TypeScript `strict: true` is set, but no source files exercise it yet.**

- **File:** `tsconfig.json:8`
- **Issue:** `strict: true` is correctly enabled, which is good. However with only 113 lines of application source code and no Convex function files, the strictness has not been tested against any real logic. When the calculation functions (proportional tax, multi-claim split) are implemented, the strict null checks will surface opportunities for runtime errors that need careful handling (e.g., division by zero when `numberOfClaimants === 0` for an unclaimed item, referenced in PRD §6.4).

---

## Error Handling Gaps

**Severity: HIGH — No error boundaries anywhere in the component tree.**

- **Files:** `src/app/layout.tsx`, `src/app/page.tsx`
- **Issue:** `ConvexClientProvider` wraps the entire app but has no error boundary. If Convex is unreachable (network failure, deployment mismatch), React will throw an unhandled error and the app will show a blank screen. This is a real scenario for WhatsApp link recipients on mobile data.
- **Fix:** Add a React error boundary in `src/components/ConvexClientProvider.tsx` or a Next.js `error.tsx` at the app level that renders a graceful fallback.

**Severity: HIGH — No handling for missing/invalid `NEXT_PUBLIC_CONVEX_URL`.**

- **File:** `src/components/ConvexClientProvider.tsx:5`
- **Issue:** `new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!)` — if this env var is undefined at build time (e.g., Vercel preview deployment without env configured), the `!` suppresses TypeScript warnings but `ConvexReactClient("")` or `ConvexReactClient(undefined)` will throw at module evaluation, crashing the entire app before React mounts.

**Severity: MEDIUM — Division-by-zero in proportional tax formula is unguarded (not yet implemented).**

- **Issue:** PRD §6.2 formula includes `(subtotal[p] / billSubtotal) × totalTax`. If `billSubtotal === 0` (all items are free/zero price), this division produces `NaN`. PRD §6.4 says "bill with no items cannot generate link" — but a bill with items all priced at 0 cents is not addressed.
- **Fix:** Guard calculation functions with `if (billSubtotal === 0) return 0` before the division.

---

## Dependency Risks

**Severity: LOW — Next.js version is `16.2.6`, which post-dates training data.**

- **File:** `package.json:16`
- **Issue:** Next.js 16 is newer than widely-documented Next.js 15. The `AGENTS.md` explicitly warns: "This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code." App Router patterns, server component behavior, and metadata APIs may differ from Next.js 13-15 documentation.
- **Impact:** Risk of using deprecated or wrong APIs when implementing routes and server components.
- **Mitigation:** Follow the AGENTS.md directive: consult `node_modules/next/dist/docs/` before implementing each route.

**Severity: LOW — TypeScript version `^5.9.3` is beyond stable 5.x releases (as of analysis date).**

- **File:** `package.json:29`
- **Issue:** TypeScript 5.9.x may be a beta or RC. Behavior differences in strict mode or module resolution could surface unexpectedly.
- **Fix:** Pin to a stable release if issues arise; otherwise low risk.

**Severity: LOW — Departure Mono loaded from `fonts.cdnfonts.com` (third-party, non-Google CDN).**

- **File:** `src/app/globals.css:2`
- **Issue:** `fonts.cdnfonts.com` is a third-party CDN with no documented SLA or uptime guarantee. The entire display identity (logotype, bill totals, TONGTONG header) depends on this font loading. If the CDN is down or blocks the Vercel domain, all display text falls back to generic monospace.
- **Fix:** Self-host Departure Mono from `public/fonts/` using `@font-face`.

---

## Scalability Concerns

**Severity: LOW — No bill auto-archive (PRD §3.3 Bonus #3 not implemented).**

- **Issue:** PRD §9.1 identifies Convex free tier exhaustion as a risk. The 30-day auto-archive feature that caps database growth is listed as a bonus, not MVP. The `archivedAt` field exists in the schema (`convex/schema.ts:11`) but no Convex scheduled function to set it has been written. At bounty-demo scale this is acceptable; in production use it becomes a cost risk.

**Severity: LOW — No database index on `bills` table.**

- **File:** `convex/schema.ts:5-12`
- **Issue:** The `bills` table has no indexes. `items`, `claims`, and `payments` each have `by_bill` indexes for efficient bill-scoped lookups. However, if `getBillForOrganizer` queries need to look up bills by `organizerSecret` (e.g., "find all my bills"), there is no index for this — a full table scan would be needed. For single-bill lookups by `_id` this is fine (Convex IDs are the primary key), but any "my bills" feature would be slow at scale.

---

## Test Coverage Gaps

**Severity: HIGH — Zero tests exist.**

- **Issue:** No test files exist anywhere in the project. No `jest.config.*`, `vitest.config.*`, or `*.test.*` / `*.spec.*` files were found. The proportional tax formula (PRD §6.2) and multi-claim calculation logic are non-trivial math that will be implemented in Convex functions or frontend utilities — both are high-value unit test targets. A bug in the split calculation directly impacts user trust.
- **Risk:** Any regression in calculation logic ships silently.
- **Priority:** HIGH — add unit tests for calculation utilities before Milestone 3 (item claiming) ships.

---

## Additional Notes

- `.env.local` is present and correctly gitignored. No secrets are committed.
- The `convex/_generated/` directory shows the schema has not been synced to the Convex backend yet. Running `pnpm dev:convex` is the first required step before any backend work.
- `src/app/globals.css` is the most complete production-ready piece of code: the color system, typography CSS variables, paper grain, perforation, dot-leader, hairline rule, and chit shadow are all implemented correctly and match the PRD design spec.

---

*Concerns audit: 2026-05-22*
