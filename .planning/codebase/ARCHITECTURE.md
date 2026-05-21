# Architecture

**Analysis Date:** 2026-05-22

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                    Next.js 16 App Router                     │
│               `src/app/` (React Server Components)           │
├──────────────────────────────────────────────────────────────┤
│              Client Component Layer                          │
│         `src/components/` (ConvexClientProvider)             │
│     Convex React hooks: useQuery / useMutation / useAction   │
└────────────────────────┬─────────────────────────────────────┘
                         │ HTTPS / WebSocket (realtime)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Convex Backend                             │
│   queries · mutations · actions · file storage              │
│              `convex/` (deployed separately)                 │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Convex Managed Database + Storage               │
│   tables: bills · items · claims · payments · _storage      │
└─────────────────────────────────────────────────────────────┘
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

**Overall:** Client-heavy React + serverless backend (BaaS)

**Key Characteristics:**
- Next.js App Router with React Server Components at the layout level; interactive pages are Client Components using `"use client"`
- Convex replaces a traditional REST/GraphQL API layer: the frontend calls typed function references (`api.module.fn`) directly; no API routes in `src/app/api/`
- Realtime is built-in: `useQuery` hooks subscribe to live data via Convex WebSocket — no polling, no manual refetch
- No user authentication system; identity is managed via `localStorage` UUIDs (organizer secret, member session)
- All state is derived from Convex queries; there is no global client-side state store (no Redux, no Zustand, no Context beyond the Convex provider)

## Layers

**Next.js App Layer:**
- Purpose: Routing, RSC rendering, metadata, font loading
- Location: `src/app/`
- Contains: `layout.tsx` (root shell), `page.tsx` (landing), future route segments (bill builder, member view, dashboard)
- Depends on: `src/components/ConvexClientProvider`, Convex generated API
- Used by: Browser

**Client Component Layer:**
- Purpose: Interactive UI, Convex hook wiring, localStorage access
- Location: `src/components/`
- Contains: `ConvexClientProvider.tsx` (context provider); future components for bill builder, claim screen, dashboard
- Depends on: `convex/react` hooks, `convex/_generated/api`
- Used by: App layer pages

**Convex Backend Layer:**
- Purpose: All data access, business logic (split calculation), file storage, realtime subscriptions
- Location: `convex/`
- Contains: `schema.ts`; future `mutations.ts`, `queries.ts`, `actions.ts` modules
- Depends on: Convex platform
- Used by: Client components via typed function references

## Data Flow

### Primary Request Path (Realtime Query)

1. Page/component mounts with `useQuery(api.queries.getBillForMember, { billId })` (`src/app/[billId]/page.tsx` — planned)
2. Convex client opens WebSocket subscription to backend query function
3. Convex query function reads `bills`, `items`, `claims` tables
4. Result streams to client; component re-renders reactively on any table mutation
5. UI renders chit with live claim state

### Write Path (Mutation)

1. User action (e.g., tap item to claim) triggers `useMutation(api.mutations.claimItem)`
2. Client calls `claimItem({ billId, itemId, claimantName, claimantSession })` over HTTPS
3. Convex mutation writes to `claims` table
4. All active `useQuery` subscribers on that bill receive the update within ~100-300ms
5. Both member view and organizer dashboard update without any coordination code

### File Storage Path (QR Upload)

1. Organizer selects DuitNow QR image
2. Client requests an upload URL via Convex `generateUploadUrl` action
3. Image is PUT directly to Convex storage from the browser
4. Returned `storageId` is passed to `createBill` mutation, stored as `qrStorageId` on the bill document
5. Member view fetches a temporary URL from Convex to render the QR inline

## Auth / Session Architecture

**No login screen.** All identity is localStorage-based.

**Organizer identity:**
- On landing page load: generate UUID, store as `tongtong_organizer_secret` in `localStorage`
- On `createBill`: pass the secret; Convex stores it as `bills.organizerSecret`
- Dashboard operations (`confirmPayment`, `rejectPayment`) pass the secret; Convex verifies it matches the bill
- Losing localStorage = losing dashboard access (acceptable for MVP)

**Member identity:**
- On first visit to a bill link: generate UUID, store as `tongtong_session_<billId>` in `localStorage`
- All `claimItem`, `unclaimItem`, `markPaid` calls include `claimantSession`
- Convex enforces that only the originating session can unclaim an item

**Security model:** Convex document IDs are unguessable (not sequential). The organizer secret prevents unauthorized payment confirmation. This is social-trust security, not cryptographic — intentional for MVP scope.

## Convex Schema

Defined in `convex/schema.ts`. Four tables:

**`bills`** — One document per created bill
- `organizerSecret: string` — UUID for organizer auth
- `title: string`
- `applySST: boolean`, `applyServiceCharge: boolean`
- `qrStorageId?: Id<"_storage">` — Convex file storage reference
- `archivedAt?: number` — epoch ms; for 30-day auto-archive (bonus feature)

**`items`** — Line items belonging to a bill
- `billId: Id<"bills">`, `name`, `price` (RM cents integer), `quantity`, `orderIndex`
- Index: `by_bill` on `["billId"]`

**`claims`** — Each person's claim on an item (multi-claim supported)
- `billId`, `itemId`, `claimantName`, `claimantSession`, `createdAt`
- Indexes: `by_bill`, `by_item`, `by_session` (composite `[billId, claimantSession]`)

**`payments`** — Payment submission and confirmation state
- `billId`, `claimantSession`, `claimantName`
- `status: "pending" | "settled" | "rejected"`
- `paidAt`, `confirmedAt?`, `proofStorageId?`
- Indexes: `by_bill`, `by_session` (composite `[billId, claimantSession]`)

**Price encoding:** All prices stored as RM cents (integers) to avoid floating-point drift. Display conversion happens in the UI.

## Planned Convex Functions

These are specified in the PRD (`prd.md §7.4`) but not yet implemented — no `convex/mutations.ts` or `convex/queries.ts` files exist yet.

**Mutations:**
- `createBill` → returns `{ billId, organizerSecret }`
- `claimItem(billId, itemId, claimantName, claimantSession)`
- `unclaimItem(claimId, claimantSession)` — session-gated
- `markPaid(billId, claimantSession)` → creates `payments` record with `status: "pending"`
- `confirmPayment(paymentId, organizerSecret)` → `status: "settled"`
- `rejectPayment(paymentId, organizerSecret)` → `status: "rejected"`

**Queries:**
- `getBillForOrganizer(billId, organizerSecret)` — verifies secret, returns full state
- `getBillForMember(billId)` — public; excludes `organizerSecret`
- `getMyClaims(billId, claimantSession)` — current session's claims and payment status

## Bill Split Calculation

Calculation runs client-side from query results (no Convex action needed for read-only math).

```
perClaimantCost[item] = item.price / numberOfClaimants[item]

For each person:
  subtotal[p]     = sum of perClaimantCost[i] for all claimed items
  taxShare[p]     = (subtotal[p] / billSubtotal) × (billSubtotal × 0.06)  // if SST
  serviceShare[p] = (subtotal[p] / billSubtotal) × (billSubtotal × 0.10)  // if service charge
  total[p]        = subtotal[p] + taxShare[p] + serviceShare[p]
```

Rounding at display time only; intermediate values carry full precision.

## Error Handling

**Strategy:** Not yet implemented (project is pre-development scaffolding only).

**Planned patterns (from PRD):**
- Bill with no items cannot generate link — client-side validation
- Unguessable bill IDs handle enumeration at the platform level
- Convex mutations validate `organizerSecret` / `claimantSession` matches before writes

## Cross-Cutting Concerns

**Logging:** Not configured — no logging library present.
**Validation:** Convex schema validators (`v.string()`, `v.id()`, etc.) enforce field types at write time. Client-side form validation planned but not implemented.
**Realtime:** Handled transparently by Convex `useQuery` subscriptions — no WebSocket management code in the app.
**Styling:** Tailwind CSS v4 with custom `@theme` design tokens defined in `src/app/globals.css`. CSS utility classes (`chit`, `dot-leader`, `rule-hairline`, `perforation`) are global.

---

*Architecture analysis: 2026-05-22*
