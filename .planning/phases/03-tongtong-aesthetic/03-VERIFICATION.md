---
phase: 03-tongtong-aesthetic
verified: 2026-05-26T00:00:00Z
status: human_needed
score: 17/17
overrides_applied: 0
re_verification: false
gaps: []
human_verification:
  - test: "Open landing page and confirm 'tongtong.' logotype renders in Departure Mono (not JetBrains Mono or system font), tagline is above the demo chit, flavor copy is below it, and the START NEW BILL button has no border radius"
    expected: "Departure Mono logotype with red period, layout order: logo → A CHIT FOR EVERYONE → SPLIT THE BILL tagline → DemoChit → Manglish copy → chop-style CTA button"
    why_human: "Font rendering and visual layout order requires browser inspection — grep confirms the JSX structure but cannot confirm Departure Mono @font-face is actually served correctly by Next.js static file serving"
  - test: "Open a bill claim URL and tap I'VE PAID; then have the organizer confirm the payment on the dashboard. Verify the SETTLE stamp appears with the thwack scale-and-settle animation and the ink-bleed edge distortion effect"
    expected: "Stamp lands with a squash-then-settle animation (300ms, stamp-land keyframe). Ink-bleed SVG displacement filter visible on stamp edges. Animation fires only on pending→settled, not on page load"
    why_human: "CSS animation and SVG filter visual behavior requires live browser testing — grep confirms the code is wired (animate-stamp-land class, filter url(#ink-bleed), prevStatusRef guard) but cannot verify the actual animation plays correctly"
  - test: "Open the member claim view for a bill, check item rows render with visible dot leader (dotted line between name and price), hairline rules between rows, and the chit card has a slight rotation"
    expected: "dot-leader .after pseudo-element fills with dots between item name and price; 0.5px hairline hr between items; outer items panel rotated 1-2 degrees based on billId"
    why_human: "CSS pseudo-element dot-leaders and sub-pixel hairline rules require visual inspection — grep confirms classes are applied but rendering depends on browser CSS engine"
  - test: "Open the dashboard and verify the desktop 2-column layout: left column shows progress bar, stats, PEOPLE section; right column shows bill summary card and quick actions; BillSummaryCard grand total row has dot-leader dots"
    expected: "md:grid-cols-[60%_40%] grid active at 768px+; BillSummaryCard uses .chit paper surface with shadow; dot-leader dots visible between TOTAL label and RM amount"
    why_human: "Responsive layout and CSS grid behavior requires browser viewport testing at desktop width"
---

# Phase 3: TongTong Aesthetic Verification Report

**Phase Goal:** Full chit visual theme and landing page applied across every screen.
**Verified:** 2026-05-26
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #   | Truth                                                                                          | Status     | Evidence                                                                                                                                                                                          |
| --- | ---------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Departure Mono loads from /public/fonts/ — no CDN request                                     | VERIFIED   | `public/fonts/DepartureMono-Regular.woff2` exists (22,496 bytes); `globals.css` has `@font-face { src: url("/fonts/DepartureMono-Regular.woff2") }` before `@import "tailwindcss"`; zero CDN @imports remain |
| 2   | JetBrains Mono and Bungee load via next/font/google                                           | VERIFIED   | `layout.tsx` imports `JetBrains_Mono, Bungee` from `next/font/google`; both assigned CSS variables `--font-body` / `--font-stamp`; both `.variable` tokens in `<html>` className; no `use client` directive |
| 3   | animate-stamp-land Tailwind utility class available                                           | VERIFIED   | `globals.css` contains `--animate-stamp-land: stamp-land 300ms ease-out forwards` and `@keyframes stamp-land` inside `@theme inline {}` block                                                   |
| 4   | SVG ink-bleed filter (id=ink-bleed) in DOM via layout.tsx                                    | VERIFIED   | `layout.tsx` line 44–51: `<svg id="filters" aria-hidden="true"><defs><filter id="ink-bleed">…</filter></defs></svg>` as first child of body; no `display:none` applied                          |
| 5   | Landing page shows "tongtong." logotype in Departure Mono with red period                     | VERIFIED   | `page.tsx`: `<h1 style={{ fontFamily: "var(--font-display)" }}>tongtong<span className="text-stamp">.</span></h1>`                                                                               |
| 6   | Landing page tagline ABOVE demo chit, flavor copy BELOW (D-02 layout)                        | VERIFIED   | `page.tsx` JSX order: `<h1>` logotype → `<p>` A CHIT FOR EVERYONE → `<p>` SPLIT THE BILL → `<DemoChit />` → `<p>` Manglish copy → `<Link>` CTA                                                |
| 7   | DemoChit renders kopitiam items with dot-leader alignment and SETTLED stamp                   | VERIFIED   | `DemoChit.tsx`: 4 kopitiam items (Mee Goreng Mamak, Teh Tarik, Roti Canai, Nasi Lemak Biasa) with `className="dot-leader py-1"`; SETTLE stamp with `style={{ filter: "url(#ink-bleed)" }}`; `font-stamp` applied; no `use client` |
| 8   | START NEW BILL button is full-width, blue bg, no border-radius, min 48px                     | VERIFIED   | `page.tsx` Link: `className="mt-6 block w-full max-w-[320px] bg-pen text-white uppercase font-bold text-xs tracking-widest min-h-[48px] flex items-center justify-center"` — no `rounded` class |
| 9   | SettleStamp animates only on pending→settled transition, not on mount                        | VERIFIED   | `SettleStamp.tsx`: `prevStatusRef = useRef<SettleStampStatus>(status)` (initialized to current status, not null); `useEffect` checks `status === "settled" && prev !== "settled"` before setting `isAnimating` |
| 10  | Member view items section uses .chit wrapper with .perforation dividers                       | VERIFIED   | `c/[billId]/page.tsx` line 303: `<div className="chit p-4 mb-4" style={{ transform: ... }}>` with `<div className="perforation mb-3">` after header and `<div className="perforation mt-3">` after items |
| 11  | Each item row uses .dot-leader and .rule-hairline hr appears between rows                     | VERIFIED   | `c/[billId]/page.tsx` line 336: button has `className="dot-leader w-full min-h-[48px]…"`; line 426: `{index < items.length - 1 ? <hr className="rule-hairline" /> : null}`                     |
| 12  | YOUR PORTION panel uses .chit class; all rows use .dot-leader                                | VERIFIED   | Line 438: `className="chit border-t-2 border-pen border-l-4 border-l-pen p-4 mb-4"`; lines 444, 453, 465, 475 all have `className="dot-leader flex justify-between…"`                           |
| 13  | Loading state renders skeleton chit card (animated gray bars)                                | VERIFIED   | `c/[billId]/page.tsx` lines 213–222: `<div className="chit max-w-[480px] w-full mx-4 p-4 animate-pulse">` with 5 gray placeholder bars; "LOADING..." text gone (count=0)                       |
| 14  | Expired/null state renders EXPIRED stamp in .chit with THIS CHIT HAS BEEN TORN UP            | VERIFIED   | Lines 228–248: `.chit` wrapper, EXPIRED stamp with `border-stamp` + `text-stamp` + `var(--font-stamp)`, "THIS CHIT HAS BEEN TORN UP" heading; no ink-bleed on EXPIRED stamp (outside plan scope) |
| 15  | Chit outer container has deterministic 1–2° rotation from billId (UI-09)                     | VERIFIED   | Line 289: `const rotationDeg = (billId.charCodeAt(0) % 20) / 10 + 1`; line 303: `style={{ transform: \`rotate(${rotationDeg}deg)\` }}` on items `.chit` only (one-imperfection rule)           |
| 16  | Bill builder form wrapped in .chit panels with .perforation dividers; GENERATE LINK no rounded | VERIFIED | `create/page.tsx`: two `.chit p-4 mb-4` panels (lines 141, 188); two `<div className="perforation my-4" />` (lines 185, 220); GENERATE LINK button (line 269) has no `rounded` class; `grep -c "rounded" create/page.tsx = 0` |
| 17  | Dashboard: skeleton loading, NOTHING HERE YET empty state, .chit panels, 2-col layout        | VERIFIED   | Dashboard has `animate-pulse=2`, `NOTHING HERE YET=1`, `LOADING...=0`, `perforation=2`, `md:grid-cols-[60%_40%]=1`; BillSummaryCard uses `className="chit p-4"` with `dot-leader items-center` on total row |

**Score:** 17/17 truths verified

### Deferred Items

None.

### Required Artifacts

| Artifact                                  | Expected                                     | Status     | Details                                                      |
| ----------------------------------------- | -------------------------------------------- | ---------- | ------------------------------------------------------------ |
| `public/fonts/DepartureMono-Regular.woff2` | Self-hosted Departure Mono WOFF2            | VERIFIED   | Exists, 22,496 bytes                                         |
| `src/app/globals.css`                     | @font-face, stamp animation, no CDN @imports | VERIFIED   | @font-face present, --animate-stamp-land + @keyframes in @theme inline, 0 CDN imports |
| `src/app/layout.tsx`                      | JetBrains_Mono + Bungee next/font; SVG filter | VERIFIED  | All 3 fonts imported, variables on html, SVG filter in body, no use client |
| `src/components/DemoChit.tsx`             | Server component with kopitiam order + stamp | VERIFIED   | No use client, 4 items, dot-leader, SETTLE stamp, ink-bleed filter |
| `src/app/page.tsx`                        | Full landing page per D-02 layout            | VERIFIED   | Logotype, A CHIT FOR EVERYONE, SPLIT THE BILL, DemoChit, flavor copy, chop CTA, no rounded |
| `src/components/SettleStamp.tsx`          | Animation guard + ink-bleed on both states  | VERIFIED   | prevStatusRef x3, isAnimating x3, animate-stamp-land x1, ink-bleed x2 |
| `src/app/c/[billId]/page.tsx`             | Fully styled member view                     | VERIFIED   | .chit wrapper, .dot-leader x5, .rule-hairline x1, .perforation x2, skeleton loading, EXPIRED stamp, rotation |
| `src/app/create/page.tsx`                 | .chit form panels, no rounded buttons        | VERIFIED   | 2 .chit panels, 2 perforations, 0 rounded classes            |
| `src/app/dashboard/[billId]/page.tsx`     | Skeleton loading, NOTHING HERE YET, .chit panels | VERIFIED | 2 animate-pulse, 1 NOTHING HERE YET, 2 perforations, 2-col layout intact |
| `src/components/BillSummaryCard.tsx`      | .chit class, dot-leader total row            | VERIFIED   | `chit p-4` container, `dot-leader items-center` on total row, no bg-paper-chit rounded |

### Key Link Verification

| From                               | To                                           | Via                                           | Status   | Details                                                                 |
| ---------------------------------- | -------------------------------------------- | --------------------------------------------- | -------- | ----------------------------------------------------------------------- |
| globals.css @font-face             | public/fonts/DepartureMono-Regular.woff2     | `url("/fonts/DepartureMono-Regular.woff2")`   | WIRED    | Exact path present in @font-face src; file confirmed to exist           |
| layout.tsx                         | globals.css --font-body --font-stamp         | `jetBrainsMono.variable bungee.variable` on html | WIRED | Both .variable tokens in html className alongside shadowsIntoLightTwo.variable |
| globals.css @theme inline          | animate-stamp-land Tailwind utility          | `--animate-stamp-land: stamp-land 300ms`      | WIRED    | Token in @theme inline; @keyframes stamp-land inside same block         |
| SettleStamp.tsx stamp container    | globals.css animate-stamp-land               | `className{...animate-stamp-land...}`         | WIRED    | stampClassName conditionally appends ` animate-stamp-land` when isAnimating |
| SettleStamp.tsx stamp container    | layout.tsx #ink-bleed filter                 | `style={{ filter: "url(#ink-bleed)" }}`       | WIRED    | Both pending and settled branches apply ink-bleed style                 |
| page.tsx                           | DemoChit.tsx                                 | `import { DemoChit } from "@/components/DemoChit"` | WIRED | Import present, `<DemoChit />` used in JSX                              |
| c/[billId]/page.tsx items section  | globals.css .dot-leader                      | `className="dot-leader w-full…"` on button    | WIRED    | dot-leader class on tappable item button                                |
| c/[billId]/page.tsx outer container| UI-09 one-imperfection rule                  | `const rotationDeg = (billId.charCodeAt(0) % 20) / 10 + 1` | WIRED | Variable declared, applied via style to items .chit only |
| dashboard page                     | BillSummaryCard                              | `import { BillSummaryCard }` + JSX usage      | WIRED    | BillSummaryCard imported and used in right column                       |

### Data-Flow Trace (Level 4)

Not applicable for this phase. All changed components are either:
- Pure display/Server Components with hardcoded data (DemoChit, page.tsx landing)
- CSS/font infrastructure (globals.css, layout.tsx)
- Aesthetic class changes to existing Convex-wired components (no data flow changes in this phase)

The data connections from Phase 1 and Phase 2 are unchanged and were verified in those phases.

### Behavioral Spot-Checks

| Behavior                        | Command                                              | Result   | Status |
| ------------------------------- | ---------------------------------------------------- | -------- | ------ |
| TypeScript compiles cleanly     | `pnpm exec tsc --noEmit`                             | exit 0   | PASS   |
| Departure Mono font file exists  | `ls public/fonts/DepartureMono-Regular.woff2`        | 22,496 B | PASS   |
| No CDN font imports in globals.css | `grep -c "googleapis.com\|cdnfonts.com" globals.css` | 0       | PASS   |
| No use client in layout.tsx     | `grep -c "use client" layout.tsx`                    | 0        | PASS   |
| No rounded in create/page.tsx   | `grep -c "rounded" create/page.tsx`                  | 0        | PASS   |
| 2 skeleton loaders in dashboard | `grep -c "animate-pulse" dashboard/[billId]/page.tsx` | 2       | PASS   |
| LOADING... removed from dashboard | `grep -c "LOADING\.\.\." dashboard/[billId]/page.tsx` | 0      | PASS   |
| NOTHING HERE YET empty state    | `grep -c "NOTHING HERE YET" dashboard/[billId]/page.tsx` | 1   | PASS   |
| 2-column layout preserved       | `grep -c "md:grid-cols-\[60%_40%\]" dashboard/[billId]/page.tsx` | 1 | PASS |
| BillSummaryCard uses .chit not rounded | `grep -c "bg-paper-chit rounded" BillSummaryCard.tsx` | 0  | PASS   |

### Probe Execution

No probes declared for this phase. Phase modifies CSS classes and visual presentation only — no runnable probes apply.

Step 7b: All runnable spot-checks completed above (TypeScript, file existence, grep counts). No server startup required.

### Requirements Coverage

| Requirement | Source Plan | Description                                                   | Status          | Evidence                                                                              |
| ----------- | ----------- | ------------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------- |
| UI-01       | 03-01, 03-04 | Full chit aesthetic: warm paper, chit surface, ink, pen, stamp red reserved | SATISFIED | bg-paper-table, bg-paper-chit, text-ink, text-pen, text-stamp used correctly; red verified only on allowed elements |
| UI-02       | 03-01       | Typography: Departure Mono, JetBrains Mono, Shadows Into Light Two, Bungee | SATISFIED | All 4 fonts loaded via correct delivery method; CSS variables wired in html className |
| UI-03       | 03-03, 03-04 | Dot-leader alignment on all item rows and totals             | SATISFIED       | dot-leader on DemoChit, member view item buttons, YOUR PORTION rows, BillSummaryCard total |
| UI-04       | 03-03       | Hairline rules (0.5px) between item rows                     | SATISFIED       | `<hr className="rule-hairline" />` rendered between items (index < length - 1)       |
| UI-05       | 03-02       | SETTLE stamp: chunky red, rotated, ink-bleed, scale-and-settle animation | SATISFIED | SettleStamp has animate-stamp-land (conditional), ink-bleed on both states, prevStatusRef guard |
| UI-06       | 03-03, 03-04 | Perforation dividers between chit sections                   | SATISFIED       | .perforation dividers in member view (2), create page (2), dashboard (2)             |
| UI-07       | 03-02, 03-04 | Primary buttons: full-width, no border-radius                | SATISFIED       | START NEW BILL, GENERATE LINK, I'VE PAID, ADD ITEM — all no rounded class            |
| UI-08       | 03-02       | Logotype: "tongtong." lowercase with red dot (Departure Mono) | SATISFIED      | page.tsx h1 with font-display var, red period via text-stamp span                    |
| UI-09       | 03-03       | One imperfection per chit maximum (rotation OR crease)       | SATISFIED       | rotationDeg applied to items .chit only in member view; DemoChit has fixed 1.5deg; one per panel |
| UI-10       | 03-04       | Mobile-first; dashboard responsive to 2-column desktop       | SATISFIED       | md:grid-cols-[60%_40%] preserved; hidden md:block on right column                   |
| UI-11       | 03-04       | Empty state: NOTHING HERE YET chit card + action button      | SATISFIED       | NOTHING HERE YET in .chit panel with COPY SHARE LINK bg-pen button                  |
| UI-12       | 03-03, 03-04 | Loading state: skeleton chit card                            | SATISFIED       | animate-pulse skeleton in member view (1), dashboard (2); LOADING... gone from all  |
| UI-13       | 03-03       | Expired state: EXPIRED stamp + THIS CHIT HAS BEEN TORN UP   | SATISFIED       | .chit wrapper with Bungee EXPIRED stamp + correct heading copy                       |
| LAND-01     | 03-02       | Landing: logotype, A CHIT FOR EVERYONE, hero chit with SETTLED | SATISFIED     | h1 logotype, p A CHIT FOR EVERYONE, DemoChit with pre-landed SETTLE stamp            |
| LAND-02     | 03-02       | Manglish copy: SPLIT THE BILL + Manglish flavor text         | SATISFIED       | Both copy strings present in page.tsx with correct font (font-handwriting on flavor) |
| LAND-03     | 03-02       | Primary CTA: START NEW BILL chop-style button                | SATISFIED       | Link to /create, blue bg-pen, no rounded, min-h-[48px]                               |

All 17 requirements from the phase (UI-01 through UI-13, LAND-01 through LAND-03) are SATISFIED.

### Anti-Patterns Found

| File                               | Line | Pattern                                    | Severity | Impact                                                                                 |
| ---------------------------------- | ---- | ------------------------------------------ | -------- | -------------------------------------------------------------------------------------- |
| dashboard/[billId]/page.tsx        | 140  | `// Display code per UI-SPEC: "#TT-XXXX"` | Info     | XXXX appears in a code comment describing the display format, not an unresolved marker |
| dashboard/[billId]/page.tsx        | 302  | `alert("Close chit feature coming soon.")` | Info     | Pre-existing stub for CLOSE CHIT EARLY — not in Phase 3 scope; no formal issue reference but feature is cosmetic, not blocking |
| c/[billId]/page.tsx (line 485)     | 485  | `className="bg-paper-chit p-4 mb-6"`       | Info     | BILL TOTAL section still uses bg-paper-chit instead of .chit class. This panel was not in Plan 03's scope (plans addressed items section and YOUR PORTION only). Not a blocker — the .chit class merely adds box-shadow; bg-paper-chit provides the same background color. |

**Debt marker assessment:** The `XXXX` at dashboard line 140 is in a comment string `"#TT-XXXX"` documenting the display format (literal placeholder representation), not a TBD/FIXME marker. Does not trigger the debt marker gate.

The `alert("Close chit feature coming soon.")` is a pre-existing stub from Phase 1/2 work, not introduced by Phase 3. The CLOSE CHIT EARLY feature was not declared in Phase 3 requirements. This is informational only.

### Human Verification Required

#### 1. Font Rendering — Departure Mono Delivery

**Test:** Open the landing page (`/`) in a browser. Open DevTools → Network tab. Filter by "font". Load the page. Verify a request to `/fonts/DepartureMono-Regular.woff2` appears and status is 200. Confirm the logotype "tongtong." renders in a monospace font visually distinct from JetBrains Mono (wider, more retro-terminal style).
**Expected:** Single font request to `/fonts/DepartureMono-Regular.woff2`; zero requests to fonts.googleapis.com or fonts.cdnfonts.com; logotype visually renders in Departure Mono
**Why human:** @font-face loading and actual font rendering cannot be verified by file inspection alone

#### 2. SETTLE Stamp Animation and Ink-Bleed

**Test:** Create a bill, share the link, tap "I'VE PAID" on the member view. Then confirm the payment on the organizer dashboard. Watch the SETTLE stamp appearance on the member view.
**Expected:** Stamp appears with a scale-and-land thwack animation (scale from 1.3 → 0.95 → 1.0 over 300ms). Stamp edges show subtle ink-bleed distortion from the SVG displacement filter. A second page load with the payment already confirmed shows the stamp without animation (mount-time animation suppressed by prevStatusRef guard).
**Why human:** CSS keyframe animation and SVG filter visual rendering requires live browser observation

#### 3. Member View Item Row Dot-Leaders and Rotation

**Test:** Open a bill claim URL in a browser. View the items section. Verify (a) dotted leaders fill the space between each item name and its price, (b) thin hairline rules appear between item rows, (c) the chit card has a very slight rotation (1–2 degrees).
**Expected:** Visible dotted lines between name and price; hairlines between rows; chit card tilted slightly; YOUR PORTION panel shows dot-leaders on all rows (Subtotal, SC, SST, YOUR TOTAL)
**Why human:** CSS pseudo-elements (.dot-leader::after) and sub-pixel borders require browser rendering to verify

#### 4. Dashboard Desktop 2-Column Layout and BillSummaryCard

**Test:** Open the dashboard at viewport width >= 768px. Verify the page renders in 2 columns: left (progress bar, stats, PEOPLE list) and right (bill summary chit card, quick actions). In the BillSummaryCard, confirm dot-leaders appear between "TOTAL" and the RM amount.
**Expected:** 2-column grid at md breakpoint; BillSummaryCard has .chit paper surface with shadow; dot-leaders visible in total row
**Why human:** Responsive CSS grid behavior and visual rendering of paper shadow (box-shadow from .chit) require browser viewport testing

---

## Summary

All 17 observable truths verified from code. All 17 requirements (UI-01 through UI-13, LAND-01 through LAND-03) satisfied. All artifacts exist and are substantive. All key links are wired. TypeScript compiles cleanly. Departure Mono WOFF2 exists at the correct path. No CDN font imports remain. No blocking anti-patterns found.

The phase goal "Full chit visual theme and landing page applied across every screen" is code-complete. Four human UAT checks are required to confirm visual rendering in a browser — these cover font delivery confirmation, stamp animation behavior, CSS pseudo-element rendering, and responsive layout — none of which are verifiable by static analysis.

**One minor observation (not a blocker):** The BILL TOTAL section in `c/[billId]/page.tsx` (line 485) still uses `className="bg-paper-chit p-4 mb-6"` instead of `.chit p-4`. This section was outside Plan 03's declared scope. The visual difference is only box-shadow (which .chit adds over bg-paper-chit); background color is identical. This does not affect the phase goal.

---

_Verified: 2026-05-26_
_Verifier: Claude (gsd-verifier)_
