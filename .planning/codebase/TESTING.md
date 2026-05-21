# Testing Patterns

**Analysis Date:** 2026-05-22

## Test Framework

**Runner:** None installed.

No test framework is present in `package.json` (neither `jest`, `vitest`, `@playwright/test`, `cypress`, nor any other testing library appears in `dependencies` or `devDependencies`).

**Assertion Library:** None.

**Run Commands:**
```bash
# No test scripts exist in package.json
# Available scripts:
pnpm dev          # Start Next.js dev server
pnpm dev:convex   # Start Convex local backend
pnpm build        # Production build
pnpm start        # Serve production build
pnpm lint         # Run ESLint
```

## Test File Organization

No test files exist anywhere in the project source tree.

- `src/` contains zero `.test.ts`, `.test.tsx`, `.spec.ts`, or `.spec.tsx` files
- No `__tests__/` directories under `src/` or `convex/`
- The `convex/` directory contains only `schema.ts` and the generated `_generated/` folder

The only `.test.*` files in the repository are type declaration files inside `node_modules/.pnpm/convex@1.39.1_react@19.2.4/` (part of the Convex SDK's own distributed types) — not project tests.

## Test Coverage

**Overall coverage: 0%**

Nothing in this codebase is tested:

| Area | Tested |
|------|--------|
| Next.js pages (`src/app/`) | No |
| React components (`src/components/`) | No |
| Convex schema (`convex/schema.ts`) | No |
| Convex query/mutation functions | No |
| Business logic (bill splitting math) | No |

## E2E vs Unit vs Integration Breakdown

| Type | Status |
|------|--------|
| Unit tests | Not present |
| Integration tests | Not present |
| E2E tests | Not present |
| Component tests | Not present |
| Visual regression tests | Not present |

## What to Add When Testing Is Introduced

**Recommended stack (compatible with Next.js 16 + React 19):**

- **Unit / component tests:** Vitest + `@testing-library/react`
- **E2E tests:** Playwright (`@playwright/test`)
- **Convex backend tests:** Convex provides `convex-test` for testing queries and mutations against a local backend

**Suggested file placement:**
- Co-locate unit/component tests next to source files: `src/components/ConvexClientProvider.test.tsx`
- Place E2E tests in a top-level `e2e/` directory: `e2e/bill-flow.spec.ts`
- Place Convex function tests alongside functions: `convex/bills.test.ts`

**Suggested `package.json` scripts to add:**
```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage",
"test:e2e": "playwright test"
```

## Priority Test Gaps

Given the bill-splitting domain, the highest-risk untested areas are:

1. **Bill splitting math** — any utility that computes per-person totals, SST (6%), service charge (10%), and rounding must be unit tested before shipping
2. **Convex mutations** — `claims`, `payments` writes are financial operations; test with `convex-test` to verify invariants (e.g., duplicate claim prevention, payment status transitions)
3. **Session isolation** — `claimantSession` scoping ensures one user cannot see or mutate another's data; integration tests should verify this boundary
4. **QR/proof upload flows** — file storage operations via Convex `_storage` are easy to break silently

---

*Testing analysis: 2026-05-22*
