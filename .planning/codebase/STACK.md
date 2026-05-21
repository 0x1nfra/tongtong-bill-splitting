# Technology Stack

**Analysis Date:** 2026-05-22

## Languages

**Primary:**
- TypeScript 5.9.3 - All application code (`src/`, `convex/`)
- CSS - Global styles via Tailwind v4 (`src/app/globals.css`)

**Secondary:**
- JavaScript - Config files (`eslint.config.mjs`, `postcss.config.mjs`)

## Runtime

**Environment:**
- Node.js v24.10.0 (active via nvm; no `.nvmrc` or `.node-version` pinning present)

**Package Manager:**
- pnpm 10.33.0
- Lockfile: `pnpm-lock.yaml` (lockfileVersion 9.0) — present and committed

## Frameworks

**Core:**
- Next.js 16.2.6 — App Router, React Server Components, full-stack framework
  - Config: `next.config.ts` (minimal, no custom options set yet)
  - Type plugin: `next` TypeScript plugin active via `tsconfig.json`
- React 19.2.4 — UI rendering
- React DOM 19.2.4 — DOM bindings

**Backend / Real-time:**
- Convex 1.39.1 — Backend-as-a-service providing database, real-time queries, mutations, and file storage
  - Schema: `convex/schema.ts`
  - Generated types: `convex/_generated/`
  - Client provider: `src/components/ConvexClientProvider.tsx`

**Styling:**
- Tailwind CSS 4.3.0 — Utility-first CSS (v4 CSS-first config via `@import "tailwindcss"` in globals.css)
- `@tailwindcss/postcss` 4.3.0 — PostCSS integration for Tailwind v4
- PostCSS — CSS processing pipeline (`postcss.config.mjs`)

**Build/Dev:**
- Next.js CLI — `next dev`, `next build`, `next start` (via pnpm scripts)
- Convex CLI — `convex dev` for local Convex backend dev server (run separately as `pnpm dev:convex`)
- esbuild — Bundled internally by Next.js/Convex (listed in `pnpm.onlyBuiltDependencies`)
- sharp — Image optimization for Next.js (listed in `pnpm.onlyBuiltDependencies`)

## Dev Tools

**Linting:**
- ESLint 9.39.4
- `eslint-config-next` 16.2.6 (bundles `core-web-vitals` + TypeScript rules)
- Config: `eslint.config.mjs` (flat config format)
- Run: `pnpm lint`

**Type Checking:**
- TypeScript 5.9.3 in strict mode (`"strict": true`)
- `noEmit: true` — TS is type-check only; Next.js handles transpilation
- Target: `ES2017`; module resolution: `bundler`
- Config: `tsconfig.json`

**Formatting:**
- No Prettier or Biome config detected — formatting not enforced by tooling

## TypeScript Configuration

- Strict mode enabled
- Path alias: `@/*` → `./src/*`
- `isolatedModules: true` (required for Next.js fast refresh)
- `jsx: react-jsx`
- `moduleResolution: bundler`

## Scripts

```bash
pnpm dev          # Next.js dev server (frontend + API routes)
pnpm dev:convex   # Convex local dev backend (run in parallel with dev)
pnpm build        # Production build
pnpm start        # Production server
pnpm lint         # ESLint check
```

## Platform Requirements

**Development:**
- Run `pnpm dev` and `pnpm dev:convex` concurrently in separate terminals
- Requires `NEXT_PUBLIC_CONVEX_URL` set in `.env.local`
- Node.js v24 (current active version; no engine constraint enforced)

**Production:**
- Deployment target not explicitly configured — compatible with Vercel (default Next.js target)
- Convex cloud handles backend hosting separately

---

*Stack analysis: 2026-05-22*
