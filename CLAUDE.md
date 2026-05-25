@AGENTS.md

<!-- GSD:project-start source:PROJECT.md -->
## Project

**TongTong**

TongTong is a web-based bill-splitting app for group dining and shared expenses. Organizers create a bill, generate a shareable WhatsApp link, and track payments as friends claim items and confirm via DuitNow QR. The visual identity is a receipt/chit metaphor — warm paper, handwritten pen marks, rubber stamp actions — built for Malaysian social context.

**Core Value:** A friend who has already paid can share a link that lets everyone else claim what they ordered, see exactly what they owe, and confirm payment — without the organizer chasing anyone.

### Constraints

- **Scope**: Bounty submission with tight timeline — Milestones 1-2 are minimum submittable; Milestone 3 (item claiming) is first cut if behind schedule
- **Design**: Red (#B91C1C) used only for SETTLE stamp and unclaimed-item warnings — no exceptions
- **Budget**: Convex free tier (1M function calls/month) — sufficient for demo scale
- **Tech**: Next.js App Router only (no Pages Router); Convex TypeScript-native functions; pnpm package manager
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- TypeScript 5.9.3 - All application code (`src/`, `convex/`)
- CSS - Global styles via Tailwind v4 (`src/app/globals.css`)
- JavaScript - Config files (`eslint.config.mjs`, `postcss.config.mjs`)
## Runtime
- Node.js v24.10.0 (active via nvm; no `.nvmrc` or `.node-version` pinning present)
- pnpm 10.33.0
- Lockfile: `pnpm-lock.yaml` (lockfileVersion 9.0) — present and committed
## Frameworks
- Next.js 16.2.6 — App Router, React Server Components, full-stack framework
- React 19.2.4 — UI rendering
- React DOM 19.2.4 — DOM bindings
- Convex 1.39.1 — Backend-as-a-service providing database, real-time queries, mutations, and file storage
- Tailwind CSS 4.3.0 — Utility-first CSS (v4 CSS-first config via `@import "tailwindcss"` in globals.css)
- `@tailwindcss/postcss` 4.3.0 — PostCSS integration for Tailwind v4
- PostCSS — CSS processing pipeline (`postcss.config.mjs`)
- Next.js CLI — `next dev`, `next build`, `next start` (via pnpm scripts)
- Convex CLI — `convex dev` for local Convex backend dev server (run separately as `pnpm dev:convex`)
- esbuild — Bundled internally by Next.js/Convex (listed in `pnpm.onlyBuiltDependencies`)
- sharp — Image optimization for Next.js (listed in `pnpm.onlyBuiltDependencies`)
## Dev Tools
- ESLint 9.39.4
- `eslint-config-next` 16.2.6 (bundles `core-web-vitals` + TypeScript rules)
- Config: `eslint.config.mjs` (flat config format)
- Run: `pnpm lint`
- TypeScript 5.9.3 in strict mode (`"strict": true`)
- `noEmit: true` — TS is type-check only; Next.js handles transpilation
- Target: `ES2017`; module resolution: `bundler`
- Config: `tsconfig.json`
- No Prettier or Biome config detected — formatting not enforced by tooling
## TypeScript Configuration
- Strict mode enabled
- Path alias: `@/*` → `./src/*`
- `isolatedModules: true` (required for Next.js fast refresh)
- `jsx: react-jsx`
- `moduleResolution: bundler`
## Scripts
## Platform Requirements
- Run `pnpm dev` and `pnpm dev:convex` concurrently in separate terminals
- Requires `NEXT_PUBLIC_CONVEX_URL` set in `.env.local`
- Node.js v24 (current active version; no engine constraint enforced)
- Deployment target not explicitly configured — compatible with Vercel (default Next.js target)
- Convex cloud handles backend hosting separately
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## TypeScript Usage
- `strict: true` is enabled in `tsconfig.json` — all strict checks enforced
- `noEmit: true` — TypeScript is used for type-checking only, not compilation
- `isolatedModules: true` — each file must be independently transpilable; avoid `const enum` and namespace-only imports
- Target: `ES2017`, module resolution: `bundler`
- Non-null assertion (`!`) is used where environment variables are guaranteed at runtime:
- Prefer `Readonly<{}>` for prop types that should not be mutated:
- Use Convex-generated types from `convex/_generated/` for query/mutation type safety — do not hand-roll Convex document types
- Use `import type` for type-only imports:
## Component Patterns
- Add `"use client"` at the top of any component that uses React hooks, browser APIs, or Convex reactive hooks
- Server components (no directive) are the default for layout and page files
- Example client component: `src/components/ConvexClientProvider.tsx`
- Example server component: `src/app/layout.tsx`, `src/app/page.tsx`
- Inline type literals for simple props:
- `Readonly<{}>` wrapper when props must not be mutated (used in layout):
- Convex client is instantiated once at module level, not inside the component:
- Page/layout files use default exports (Next.js requirement)
- Shared components use named exports:
## Import Style
## Styling Approach
- `.chit` — receipt paper surface
- `.perforation` — dashed tear line
- `.dot-leader` — dotted leader line
- `.rule-hairline` — thin dividing rule
## Naming Conventions
- React components: PascalCase, `.tsx` extension — `ConvexClientProvider.tsx`
- Next.js reserved files: lowercase — `layout.tsx`, `page.tsx`, `globals.css`
- Config files: camelCase/kebab-case per tool convention — `eslint.config.mjs`, `next.config.ts`, `postcss.config.mjs`
- PascalCase for component functions matching file name: `ConvexClientProvider`, `RootLayout`, `Home`
- camelCase for regular variables and functions
- Module-level client singleton: camelCase (`convex`)
- camelCase for all field names: `billId`, `organizerSecret`, `applySST`, `claimantSession`, `orderIndex`, `archivedAt`
- Table names: plural lowercase — `bills`, `items`, `claims`, `payments`
- Export as `const metadata: Metadata` (typed, named export) from page/layout files
## State Management Patterns
## Convex Backend Conventions
- Use `v.id("tableName")` for foreign keys (not raw strings)
- Monetary values stored as integer cents: `price: v.number() // RM cents (integer)`
- Timestamps stored as Unix milliseconds: `v.number()`
- Optional fields use `v.optional(...)` wrapper
- Discriminated unions for status fields: `v.union(v.literal("pending"), v.literal("settled"), v.literal("rejected"))`
## ESLint Configuration
## Git Commit Convention
- Format: `feat([PHASE]): [CHANGES]`
- Example: `feat(milestone-1): add bill creation form`
- `[PHASE]` = current milestone or phase name (e.g. `milestone-1`, `milestone-2`)
- `[CHANGES]` = short description of what changed, all lowercase
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## System Overview
```text
```
## Component Responsibilities
| Component | Responsibility | File |
|-----------|----------------|------|
| RootLayout | HTML shell, metadata, wraps tree in ConvexClientProvider | `src/app/layout.tsx` |
| ConvexClientProvider | Instantiates ConvexReactClient, provides context to all children | `src/components/ConvexClientProvider.tsx` |
| Home (page) | Landing page — chit placeholder, entry point | `src/app/page.tsx` |
| Convex schema | Defines all tables, fields, indexes | `convex/schema.ts` |
| Convex _generated | Auto-generated API types, data model types | `convex/_generated/` |
## Pattern Overview
- Next.js App Router with React Server Components at the layout level; interactive pages are Client Components using `"use client"`
- Convex replaces a traditional REST/GraphQL API layer: the frontend calls typed function references (`api.module.fn`) directly; no API routes in `src/app/api/`
- Realtime is built-in: `useQuery` hooks subscribe to live data via Convex WebSocket — no polling, no manual refetch
- No user authentication system; identity is managed via `localStorage` UUIDs (organizer secret, member session)
- All state is derived from Convex queries; there is no global client-side state store (no Redux, no Zustand, no Context beyond the Convex provider)
## Layers
- Purpose: Routing, RSC rendering, metadata, font loading
- Location: `src/app/`
- Contains: `layout.tsx` (root shell), `page.tsx` (landing), future route segments (bill builder, member view, dashboard)
- Depends on: `src/components/ConvexClientProvider`, Convex generated API
- Used by: Browser
- Purpose: Interactive UI, Convex hook wiring, localStorage access
- Location: `src/components/`
- Contains: `ConvexClientProvider.tsx` (context provider); future components for bill builder, claim screen, dashboard
- Depends on: `convex/react` hooks, `convex/_generated/api`
- Used by: App layer pages
- Purpose: All data access, business logic (split calculation), file storage, realtime subscriptions
- Location: `convex/`
- Contains: `schema.ts`; future `mutations.ts`, `queries.ts`, `actions.ts` modules
- Depends on: Convex platform
- Used by: Client components via typed function references
## Data Flow
### Primary Request Path (Realtime Query)
### Write Path (Mutation)
### File Storage Path (QR Upload)
## Auth / Session Architecture
- On landing page load: generate UUID, store as `tongtong_organizer_secret` in `localStorage`
- On `createBill`: pass the secret; Convex stores it as `bills.organizerSecret`
- Dashboard operations (`confirmPayment`, `rejectPayment`) pass the secret; Convex verifies it matches the bill
- Losing localStorage = losing dashboard access (acceptable for MVP)
- On first visit to a bill link: generate UUID, store as `tongtong_session_<billId>` in `localStorage`
- All `claimItem`, `unclaimItem`, `markPaid` calls include `claimantSession`
- Convex enforces that only the originating session can unclaim an item
## Convex Schema
- `organizerSecret: string` — UUID for organizer auth
- `title: string`
- `applySST: boolean`, `applyServiceCharge: boolean`
- `qrStorageId?: Id<"_storage">` — Convex file storage reference
- `archivedAt?: number` — epoch ms; for 30-day auto-archive (bonus feature)
- `billId: Id<"bills">`, `name`, `price` (RM cents integer), `quantity`, `orderIndex`
- Index: `by_bill` on `["billId"]`
- `billId`, `itemId`, `claimantName`, `claimantSession`, `createdAt`
- Indexes: `by_bill`, `by_item`, `by_session` (composite `[billId, claimantSession]`)
- `billId`, `claimantSession`, `claimantName`
- `status: "pending" | "settled" | "rejected"`
- `paidAt`, `confirmedAt?`, `proofStorageId?`
- Indexes: `by_bill`, `by_session` (composite `[billId, claimantSession]`)
## Planned Convex Functions
- `createBill` → returns `{ billId, organizerSecret }`
- `claimItem(billId, itemId, claimantName, claimantSession)`
- `unclaimItem(claimId, claimantSession)` — session-gated
- `markPaid(billId, claimantSession)` → creates `payments` record with `status: "pending"`
- `confirmPayment(paymentId, organizerSecret)` → `status: "settled"`
- `rejectPayment(paymentId, organizerSecret)` → `status: "rejected"`
- `getBillForOrganizer(billId, organizerSecret)` — verifies secret, returns full state
- `getBillForMember(billId)` — public; excludes `organizerSecret`
- `getMyClaims(billId, claimantSession)` — current session's claims and payment status
## Bill Split Calculation
```
```
## Error Handling
- Bill with no items cannot generate link — client-side validation
- Unguessable bill IDs handle enumeration at the platform level
- Convex mutations validate `organizerSecret` / `claimantSession` matches before writes
## Cross-Cutting Concerns
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
