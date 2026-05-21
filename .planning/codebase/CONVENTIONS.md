# Coding Conventions

**Analysis Date:** 2026-05-22

## TypeScript Usage

**Strict Mode:**
- `strict: true` is enabled in `tsconfig.json` — all strict checks enforced
- `noEmit: true` — TypeScript is used for type-checking only, not compilation
- `isolatedModules: true` — each file must be independently transpilable; avoid `const enum` and namespace-only imports
- Target: `ES2017`, module resolution: `bundler`

**Type Assertions:**
- Non-null assertion (`!`) is used where environment variables are guaranteed at runtime:
  ```ts
  // src/components/ConvexClientProvider.tsx
  const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  ```
- Prefer `Readonly<{}>` for prop types that should not be mutated:
  ```ts
  // src/app/layout.tsx
  export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  ```

**Generics:**
- Use Convex-generated types from `convex/_generated/` for query/mutation type safety — do not hand-roll Convex document types

**Import Types:**
- Use `import type` for type-only imports:
  ```ts
  import type { Metadata } from "next";
  ```

## Component Patterns

**All components are functional.** No class components.

**"use client" directive:**
- Add `"use client"` at the top of any component that uses React hooks, browser APIs, or Convex reactive hooks
- Server components (no directive) are the default for layout and page files
- Example client component: `src/components/ConvexClientProvider.tsx`
- Example server component: `src/app/layout.tsx`, `src/app/page.tsx`

**Props typing:**
- Inline type literals for simple props:
  ```ts
  export function ConvexClientProvider({ children }: { children: React.ReactNode }) {
  ```
- `Readonly<{}>` wrapper when props must not be mutated (used in layout):
  ```ts
  function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  ```

**Module-level singletons:**
- Convex client is instantiated once at module level, not inside the component:
  ```ts
  // src/components/ConvexClientProvider.tsx
  const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  ```

**Exports:**
- Page/layout files use default exports (Next.js requirement)
- Shared components use named exports:
  ```ts
  export function ConvexClientProvider(...) { ... }
  ```

## Import Style

**Path alias:** `@/` maps to `src/` (configured in `tsconfig.json` `paths`).

Use `@/` for all cross-directory imports:
```ts
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
```

Relative imports are only used for same-directory assets (e.g., `"./globals.css"`).

**Import order observed:**
1. External packages / framework (`next`, `convex/react`)
2. Internal aliases (`@/components/...`)
3. Relative assets (`./globals.css`)

## Styling Approach

**Tailwind CSS v4** via `@tailwindcss/postcss`. Configuration lives entirely in `src/app/globals.css` using the `@theme inline` block — there is no `tailwind.config.*` file.

**Theme tokens** (defined in `src/app/globals.css`):
```css
@theme inline {
  --color-paper-chit: #F4EFE6;
  --color-paper-table: #EEEAE2;
  --color-ink: #1F1B17;
  --color-pen: #1E40AF;
  --color-stamp: #B91C1C;
  --font-display: "Departure Mono", monospace;
  --font-body: "JetBrains Mono", monospace;
  --font-handwriting: "Shadows Into Light Two", cursive;
  --font-stamp: "Bungee", sans-serif;
}
```

**Use CSS variables via `var()` in `style` prop** for font families (Tailwind v4 font utilities may not yet resolve custom font vars):
```tsx
style={{ fontFamily: "var(--font-display)" }}
```

**Utility-first:** All layout and spacing uses Tailwind classes. Custom CSS classes are limited to semantic surface concepts:
- `.chit` — receipt paper surface
- `.perforation` — dashed tear line
- `.dot-leader` — dotted leader line
- `.rule-hairline` — thin dividing rule

**Avoid inline style for layout/spacing.** Use `style` only for values that Tailwind cannot express statically (e.g., `transform: rotate(-1deg)` or font family variables).

**Raw hex colors** are used inline when a precise off-palette value is needed (e.g., `bg-[#EEEAE2]`, `text-[#1F1B17]`). Prefer the named CSS custom properties when available.

## Naming Conventions

**Files:**
- React components: PascalCase, `.tsx` extension — `ConvexClientProvider.tsx`
- Next.js reserved files: lowercase — `layout.tsx`, `page.tsx`, `globals.css`
- Config files: camelCase/kebab-case per tool convention — `eslint.config.mjs`, `next.config.ts`, `postcss.config.mjs`

**Components:**
- PascalCase for component functions matching file name: `ConvexClientProvider`, `RootLayout`, `Home`

**Variables and functions:**
- camelCase for regular variables and functions
- Module-level client singleton: camelCase (`convex`)

**Convex schema fields:**
- camelCase for all field names: `billId`, `organizerSecret`, `applySST`, `claimantSession`, `orderIndex`, `archivedAt`
- Table names: plural lowercase — `bills`, `items`, `claims`, `payments`

**Next.js metadata:**
- Export as `const metadata: Metadata` (typed, named export) from page/layout files

## State Management Patterns

**No local client state management library** (no Redux, Zustand, Jotai, etc.).

**Convex reactive queries** are the primary state source. Components subscribe to live data via `useQuery` from `convex/react`.

**Convex mutations** via `useMutation` from `convex/react` for writes.

**React built-in state** (`useState`, `useReducer`) for ephemeral UI state (form inputs, modals, etc.).

**Session identity** is stored in `claimantSession` (a string) on Convex documents. This appears to be a client-generated session token, not a server auth session.

**Provider pattern:** `ConvexClientProvider` (`src/components/ConvexClientProvider.tsx`) wraps the entire app at the root layout level, giving all client components access to the Convex client via context.

## Convex Backend Conventions

**Schema definition:** `convex/schema.ts` — single source of truth for all tables.

**Types:**
- Use `v.id("tableName")` for foreign keys (not raw strings)
- Monetary values stored as integer cents: `price: v.number() // RM cents (integer)`
- Timestamps stored as Unix milliseconds: `v.number()`
- Optional fields use `v.optional(...)` wrapper
- Discriminated unions for status fields: `v.union(v.literal("pending"), v.literal("settled"), v.literal("rejected"))`

**Indexes:** Defined inline on the table via `.index("name", ["field"])`. Always index foreign key fields used in query filters.

**Generated types:** Never hand-edit `convex/_generated/` — these are regenerated by `pnpm dev:convex`.

## ESLint Configuration

Extends `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`. Uses the flat config format (`eslint.config.mjs`). No custom rule overrides beyond ignoring `.next/`, `out/`, `build/`, and `next-env.d.ts`.

---

*Convention analysis: 2026-05-22*
