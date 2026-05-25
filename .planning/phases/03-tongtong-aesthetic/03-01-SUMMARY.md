---
phase: 03-tongtong-aesthetic
plan: "01"
subsystem: frontend/css
tags: [fonts, css, animation, tailwind, next-font]
dependency_graph:
  requires: []
  provides:
    - public/fonts/DepartureMono-Regular.woff2
    - animate-stamp-land Tailwind utility class
    - SVG ink-bleed filter in DOM
    - --font-body and --font-stamp CSS variables on <html>
  affects:
    - All screens (font variables used everywhere)
    - SettleStamp component (animate-stamp-land + ink-bleed)
    - Landing page (--font-display via Departure Mono)
tech_stack:
  added: []
  patterns:
    - next/font/google with CSS variable injection pattern (extended to JetBrains Mono + Bungee)
    - Self-hosted WOFF2 via @font-face (Departure Mono)
    - @keyframes inside @theme inline (Tailwind v4 custom animation token)
    - SVG <defs> filter in layout.tsx body for global CSS filter: url(#ink-bleed) access
key_files:
  created:
    - public/fonts/DepartureMono-Regular.woff2
  modified:
    - src/app/globals.css
    - src/app/layout.tsx
decisions:
  - "Self-host Departure Mono WOFF2 from github.com/rektdeckard/departure-mono v1.500 (SIL OFL license verified)"
  - "JetBrains_Mono loaded with weight: variable (covers 400/500/700 in one file) via next/font/google"
  - "Bungee loaded with weight: 400 via next/font/google — single weight needed for stamp"
  - "@keyframes stamp-land placed inside @theme inline block (Tailwind v4 convention for animation tokens)"
  - "SVG filters element uses no display:none — hidden via svg#filters CSS rule (position:absolute; width:0; height:0) to preserve Firefox filter reference resolution"
metrics:
  duration: "168s"
  completed_date: "2026-05-25T18:25:45Z"
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 1
---

# Phase 3 Plan 01: Font Migration and Animation Foundation Summary

**One-liner:** Self-hosted Departure Mono via @font-face, JetBrains Mono + Bungee migrated to next/font/google, stamp-land animation token added to @theme inline, SVG ink-bleed filter injected in layout body.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Download Departure Mono WOFF2, update globals.css font delivery | e06b41a | public/fonts/DepartureMono-Regular.woff2, src/app/globals.css |
| 2 | Migrate JetBrains Mono + Bungee to next/font/google, add SVG ink-bleed filter | 05904d3 | src/app/layout.tsx |

## What Was Built

### Task 1: globals.css font delivery overhaul

- Removed two CDN @import lines (fonts.googleapis.com and fonts.cdnfonts.com)
- Added @font-face block for self-hosted Departure Mono WOFF2, placed before @import "tailwindcss" (required ordering)
- Downloaded DepartureMono-Regular.woff2 (22,496 bytes) from github.com/rektdeckard/departure-mono v1.500 release ZIP
- Appended `--animate-stamp-land: stamp-land 300ms ease-out forwards` and `@keyframes stamp-land` inside the existing @theme inline block
- All four font CSS variables (--font-display, --font-body, --font-handwriting, --font-stamp) unchanged — names were already correct

### Task 2: layout.tsx font + SVG filter

- Added JetBrains_Mono (variable weight) and Bungee (400) imports from next/font/google
- Both injected into `<html>` className alongside existing shadowsIntoLightTwo
- SVG element with `id="filters"` and `<filter id="ink-bleed">` (feTurbulence + feDisplacementMap) added as first child of `<body>`, before ConvexClientProvider
- No "use client" directive added — layout.tsx remains a Server Component (next/font/google requires Server Component context)

## Verification Results

| Check | Result |
|-------|--------|
| pnpm exec tsc --noEmit | PASS (exit 0) |
| No fonts.googleapis.com in globals.css | PASS (0 occurrences) |
| No fonts.cdnfonts.com in globals.css | PASS (0 occurrences) |
| @font-face in globals.css | PASS (1 occurrence) |
| animate-stamp-land in globals.css | PASS (1 occurrence) |
| DepartureMono-Regular.woff2 exists | PASS (22,496 bytes) |
| ink-bleed filter in layout.tsx | PASS (filter id present) |
| No use client in layout.tsx | PASS |

## Deviations from Plan

### Clarification on ink-bleed grep count

The acceptance criteria stated `grep -c "ink-bleed" src/app/layout.tsx returns 2` with the comment "(filter id + feTurbulence/feDisplacementMap block)". The string "ink-bleed" appears only once in layout.tsx (as `id="ink-bleed"` on the `<filter>` element). The feTurbulence and feDisplacementMap elements are children of that filter but do not contain the string "ink-bleed". The plan's comment was describing the intent (SVG filter structure present), not a literal two-occurrence grep count. The SVG filter structure is complete and correct per the must_haves truth: "SVG ink-bleed filter (id=ink-bleed) is present in the DOM via layout.tsx body" — PASS.

No functional deviations. Plan executed exactly as specified.

## Known Stubs

None. This plan is infrastructure (fonts + animation CSS) with no UI rendering.

## Threat Flags

None. CDN removal is a privacy improvement (T-03-02). Font was downloaded from the official GitHub release (T-03-01 mitigated).

## Self-Check: PASSED

- public/fonts/DepartureMono-Regular.woff2: EXISTS (22,496 bytes)
- src/app/globals.css: EXISTS, CDN imports removed, @font-face present, @keyframes stamp-land present
- src/app/layout.tsx: EXISTS, JetBrains_Mono + Bungee imported, SVG filter present, no use client
- Commit e06b41a: EXISTS (Task 1)
- Commit 05904d3: EXISTS (Task 2)
