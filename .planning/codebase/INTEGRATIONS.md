# External Integrations

**Analysis Date:** 2026-05-22

## Backend & Real-time Database

**Convex (Backend-as-a-Service):**
- Purpose: Primary database, real-time subscriptions, mutations, and file storage
- SDK: `convex` ^1.39.1 (installed: 1.39.1)
- Client: `ConvexReactClient` from `convex/react`
- Provider: `src/components/ConvexClientProvider.tsx`
- Schema: `convex/schema.ts`
- Generated API types: `convex/_generated/api.d.ts`, `convex/_generated/dataModel.d.ts`
- Auth: `NEXT_PUBLIC_CONVEX_URL` (public env var — no server secret needed on frontend)
- Docs run: `pnpm dev:convex` (Convex CLI syncs schema and functions to cloud/local)

## Data Storage

**Convex Database:**
- Type: Convex's built-in document store (NoSQL, schematized)
- Tables: `bills`, `items`, `claims`, `payments`
- Connection: via `NEXT_PUBLIC_CONVEX_URL` — no separate DB connection string
- Client: `ConvexReactClient` (React hooks: `useQuery`, `useMutation` from `convex/react`)

**Convex File Storage:**
- Purpose: Stores QR code images (`qrStorageId`) and payment proof screenshots (`proofStorageId`)
- Referenced in schema as `v.id("_storage")` on `bills.qrStorageId` and `payments.proofStorageId`
- Storage IDs are optional fields — file upload UI not yet implemented
- No separate S3 or cloud storage bucket — Convex manages file hosting

**Caching:**
- None — Convex provides reactive real-time queries; no explicit cache layer

## Authentication & Identity

**Auth Provider:**
- None integrated — no Clerk, Auth.js, Supabase Auth, or similar detected
- Identity model: session-based via `claimantSession` string (stored on `claims` and `payments` tables)
- Organizer identity: `organizerSecret` string on `bills` table (shared secret pattern)
- No JWT, OAuth, or user account system in place

## External APIs & Third-party Services

**Google Fonts:**
- Purpose: Load display/body fonts for the receipt UI aesthetic
- Fonts loaded: `JetBrains Mono`, `Shadows Into Light Two`, `Bungee`
- Loaded via CSS `@import` in `src/app/globals.css`
- No API key required; CDN import at `https://fonts.googleapis.com`

**CDN Fonts (cdnfonts.com):**
- Purpose: Load `Departure Mono` font (not available on Google Fonts)
- Loaded via CSS `@import` in `src/app/globals.css` from `https://fonts.cdnfonts.com`
- No API key required

## Monitoring & Observability

**Error Tracking:** Not detected — no Sentry, Datadog, or similar configured

**Logs:** Browser console only — no structured logging library in use

**Analytics:** Not detected

## CI/CD & Deployment

**Hosting:** Not explicitly configured — Next.js defaults suggest Vercel deployment
- Convex backend deployed separately via Convex cloud dashboard / CLI

**CI Pipeline:** Not detected — no `.github/workflows/` or similar

## Environment Configuration

**Required env vars:**

| Variable | Used In | Purpose |
|---|---|---|
| `NEXT_PUBLIC_CONVEX_URL` | `src/components/ConvexClientProvider.tsx` | Convex deployment URL for client connection |

**Env file:** `.env.local` — present (contents not read)

**Notes:**
- `NEXT_PUBLIC_` prefix makes `NEXT_PUBLIC_CONVEX_URL` available in browser bundle
- Convex CLI may also write `CONVEX_DEPLOYMENT` to `.env.local` during `convex dev`
- No server-side-only secrets referenced in current codebase

## Webhooks & Callbacks

**Incoming:** None detected

**Outgoing:** None detected

---

*Integration audit: 2026-05-22*
