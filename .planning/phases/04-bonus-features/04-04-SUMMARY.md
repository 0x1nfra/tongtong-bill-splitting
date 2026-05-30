---
phase: 04-bonus-features
plan: 04
subsystem: frontend-dark-mode
tags: [dark-mode, next-themes, theme-toggle, css-tokens, wave-3, bonus-06]
dependency_graph:
  requires: [04-01, 04-03]
  provides: [ThemeProvider, ThemeToggle, SignInButton, dark-mode-css-tokens]
  affects: []
tech_stack:
  added: [next-themes@0.4.6]
  patterns: [use-client-provider-wrapper, mounted-guard-hydration, css-custom-variant, layer-base-token-override]
key_files:
  created:
    - src/components/ThemeProvider.tsx
    - src/components/ThemeToggle.tsx
    - src/components/SignInButton.tsx
  modified:
    - src/app/layout.tsx
    - src/app/globals.css
decisions:
  - "ThemeToggle uses mounted guard (useEffect → setState) to prevent SSR hydration mismatch — renders null until client-side mount"
  - "ThemeToggle placed inside ThemeProvider but before ConvexClientProvider — fixed position means DOM placement is flexible; avoids any z-index conflict with Convex render tree"
  - "SignInButton is a stub only per D-08 deferral — no onClick handler, no OAuth wiring, comment references D-08"
  - "@layer base dark overrides placed after @theme inline block (not modifying @theme) — CSS custom property override is the correct v4 approach"
  - "--color-stamp intentionally absent from dark overrides — red brand color hard constraint preserved"
metrics:
  duration: 137s
  completed: "2026-05-28"
  tasks_completed: 2
  files_created: 3
  files_modified: 2
---

# Phase 4 Plan 04: Dark Mode Carbon Copy Theme Summary

next-themes@0.4.6 integration with ThemeProvider wrapper, ThemeToggle button (LIGHT/DARK/AUTO cycle), Tailwind v4 `@custom-variant dark` selector, and carbon-copy palette token overrides — SignInButton stub turns SignIn.test.tsx GREEN.

## What Was Built

| Component | Description |
|-----------|-------------|
| `src/components/ThemeProvider.tsx` | Client wrapper for `NextThemesProvider` with `attribute="data-theme"`, `defaultTheme="system"`, `enableSystem` — same "use client" wrapper pattern as `ConvexClientProvider.tsx` |
| `src/components/ThemeToggle.tsx` | Fixed top-right button (z-50, min-h-11 min-w-11), cycles LIGHT → DARK → AUTO on click via `useTheme()`, mounted guard prevents SSR hydration mismatch |
| `src/components/SignInButton.tsx` | Stub renders `SIGN IN WITH GOOGLE` button — turns SignIn.test.tsx GREEN; no OAuth wiring per D-08 |
| `src/app/layout.tsx` | Added `suppressHydrationWarning` on html tag; ThemeProvider wraps ConvexClientProvider; ThemeToggle rendered inside ThemeProvider |
| `src/app/globals.css` | `@custom-variant dark` after `@import "tailwindcss"`; `@layer base` block with four dark token overrides (paper-table, paper-chit, ink, pen); stamp red excluded |

## Task Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Install next-themes + create ThemeProvider and SignInButton | 74680b6 | src/components/ThemeProvider.tsx, src/components/SignInButton.tsx, package.json, pnpm-lock.yaml |
| 2 | Create ThemeToggle + wire layout + add dark CSS tokens | 5e032db | src/components/ThemeToggle.tsx, src/app/layout.tsx, src/app/globals.css |

## Deviations from Plan

None — plan executed exactly as written.

## Threat Mitigations Applied

| Threat ID | Status |
|-----------|--------|
| T-04-SC (Tampering — pnpm add next-themes package legitimacy) | Mitigated — blocking human checkpoint completed pre-execution; user verified pacocoursey publisher, ~1M/wk downloads, zero deps, MIT license |
| T-04-W3-01 (Information Disclosure — localStorage theme key) | Accepted — theme preference is aesthetic only; no auth data in theme key |
| T-04-W3-02 (Spoofing — ThemeToggle no auth required) | Accepted — theme toggle has no server-side effect |
| T-04-05 (Spoofing — SignInButton stub) | Accepted — stub with no onClick handler; no auth state change possible |

## Verification Performed

```
pnpm vitest run src/test/SignIn.test.tsx → 2 passed (previously RED) ✓
pnpm test (full suite) → 248 passed, 4 pre-existing landingPage failures unchanged ✓
grep "@custom-variant dark" globals.css → line 11 (after @import, before @theme) ✓
grep "suppressHydrationWarning" layout.tsx → line 44 (html tag) ✓
grep "ThemeProvider" layout.tsx → import line 4 + JSX lines 54, 57 ✓
grep "color-stamp" globals.css → line 19 (@theme value) + line 47 (comment, no override) ✓
```

## Known Stubs

- `src/components/SignInButton.tsx` — intentional stub per D-08; no OAuth wiring; comment references D-08 deferral. Full BONUS-05 Google OAuth integration is deferred to a future plan.

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes. ThemeToggle reads/writes localStorage theme key via next-themes (aesthetic preference only).

## Self-Check: PASSED

- [x] src/components/ThemeProvider.tsx exists with `"use client"`, `attribute="data-theme"`, `defaultTheme="system"`, `enableSystem`
- [x] src/components/ThemeToggle.tsx exists with `"use client"`, `useTheme` import, mounted guard (renders null until mounted), fixed top-right positioning
- [x] ThemeToggle cycles light → dark → system on click
- [x] src/components/SignInButton.tsx exists with `"use client"`, renders button with text "SIGN IN WITH GOOGLE", comment references D-08
- [x] src/app/layout.tsx html tag has `suppressHydrationWarning`
- [x] src/app/layout.tsx wraps ConvexClientProvider with ThemeProvider; ThemeToggle rendered inside ThemeProvider
- [x] src/app/globals.css contains `@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *))` at line 11
- [x] src/app/globals.css `@layer base` block contains `[data-theme="dark"] { --color-paper-table: #0D1B2A` 
- [x] globals.css dark layer block does NOT contain `--color-stamp` override
- [x] next-themes@0.4.6 in package.json dependencies
- [x] SignIn.test.tsx: 2 tests pass GREEN (was RED)
- [x] Full test suite: 248 passed, same 4 pre-existing failures (landingPage.test.tsx) unchanged
- [x] Commits 74680b6 and 5e032db verified in git log
