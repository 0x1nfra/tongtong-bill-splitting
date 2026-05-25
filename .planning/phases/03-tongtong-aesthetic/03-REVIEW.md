---
phase: 03-tongtong-aesthetic
reviewed: 2026-05-26T00:00:00Z
depth: standard
files_reviewed: 9
files_reviewed_list:
  - src/app/globals.css
  - src/app/layout.tsx
  - src/app/page.tsx
  - src/app/create/page.tsx
  - src/app/dashboard/[billId]/page.tsx
  - src/app/c/[billId]/page.tsx
  - src/components/DemoChit.tsx
  - src/components/SettleStamp.tsx
  - src/components/BillSummaryCard.tsx
findings:
  critical: 1
  warning: 5
  info: 4
  total: 10
status: issues_found
---

# Phase 03: Code Review Report

**Reviewed:** 2026-05-26T00:00:00Z
**Depth:** standard
**Files Reviewed:** 9
**Status:** issues_found

## Summary

Phase 03 was a pure aesthetic pass — fonts, CSS design tokens, chit visual skin applied across all screens. No new business logic was introduced. All TypeScript and structural changes are sound. However, one pre-existing state machine bug is exposed by the new loading-skeleton UI (it turns a previously short-lived bad state into an infinite spinner), five code-quality warnings affect correctness or maintainability, and four informational items round out the review.

---

## Critical Issues

### CR-01: Dashboard shows skeleton-loading forever when opened on a non-owning device

**File:** `src/app/dashboard/[billId]/page.tsx:23-27, 58-69`

**Issue:** The dashboard `useEffect` sets `organizerSecret` to the raw result of `localStorage.getItem(...)` with no fallback. When the key is absent (any device that did not create the bill), `localStorage.getItem` returns `null`, and `setOrganizerSecret(null)` is called. The guard at line 58 checks `organizerSecret === null` and renders the skeleton loading state — but this condition is never escaped because `null` is a permanent state for absent keys. The Convex queries are all skipped while `organizerSecret` is null, so `billData` remains `undefined`, and the second skeleton guard at line 88 also fires. Result: any non-owning device sees an infinite skeleton spinner, not the intended "DASHBOARD NOT ACCESSIBLE" message.

The member view (`c/[billId]/page.tsx:85`) already has the correct fix: `stored ?? ""`. The dashboard is missing the same fallback.

**Fix:**
```ts
// src/app/dashboard/[billId]/page.tsx  line 24-26
useEffect(() => {
  const stored = localStorage.getItem("tongtong_organizer_secret");
  setOrganizerSecret(stored ?? ""); // "" is falsy, triggers the "DASHBOARD NOT ACCESSIBLE" branch
}, []);
```

---

## Warnings

### WR-01: CSS noise texture is effectively invisible — double opacity applied

**File:** `src/app/globals.css:53-54`

**Issue:** The paper-grain effect has two independent opacity values applied multiplicatively. The SVG `<rect>` element inside the `data:image/svg+xml` URL already carries `opacity="0.06"`. The CSS rule then applies `opacity: 0.06` to the entire `body::before` pseudo-element. CSS element opacity multiplies with content opacity, so the effective opacity of the noise is `0.06 × 0.06 = 0.0036` — practically invisible. The grain texture the design requires is not rendering.

**Fix:** Remove one of the two opacity declarations. The CSS `opacity` property on the element is the right place to control it; the SVG attribute should be removed or set to 1:

```css
/* Option A: remove opacity from CSS rule, keep SVG attribute at intended level */
body::before {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
  background-image: url("data:image/svg+xml,...opacity='1'..."); /* remove opacity attr from SVG rect */
  opacity: 0.06;
}
```

---

### WR-02: Interactive items chit rotated — breaks tap-target alignment on mobile

**File:** `src/app/c/[billId]/page.tsx:303`

**Issue:** The entire items chit — including all `<button>` elements for claim/unclaim, the inline name-entry `<input>`, and the CLAIM `<button>` — is wrapped in a container with `style={{ transform: \`rotate(${rotationDeg}deg)\` }}`. `rotationDeg` ranges from 1.0 to 2.9 degrees. CSS `transform` rotates the visual rendering of elements without rotating their layout bounding boxes. On touch devices, tap targets remain axis-aligned rectangles while the visual hit areas appear rotated. This causes missed taps at the edges of buttons, especially for the inline name-entry input. The chit rotation should be applied to decorative containers only, never to containers holding interactive controls.

**Fix:** Move the rotation to a visual wrapper that does not contain interactive elements, or apply rotation only to the chit header/background layer and keep the buttons in a non-rotated child:

```tsx
{/* Decorative rotated shell */}
<div className="chit p-4 mb-4" style={{ transform: `rotate(${rotationDeg}deg)` }}>
  {/* Static label */}
  <p className="...">ITEMS</p>
  <div className="perforation mb-3" />
</div>
{/* Interactive content — NOT rotated */}
<div className="chit px-4 pb-4 mb-4">
  {items.map(...)}
</div>
```

Alternatively, if the design intent requires rotation of the whole chit, apply `touch-action: manipulation` and test tap targets on physical devices.

---

### WR-03: Duplicate function — `handleRemind` and `handleCopyShareLink` are identical

**File:** `src/app/dashboard/[billId]/page.tsx:162-172`

**Issue:** Both functions perform identical operations: `navigator.clipboard.writeText(shareUrl)`. `handleRemind` is passed to `MemberRow.onRemind` for the REMIND button on awaiting-payment rows; `handleCopyShareLink` is called by two COPY SHARE LINK buttons. Having two functions with the same body creates a maintenance hazard — the next developer editing one may miss the other.

**Fix:** Delete `handleRemind` and pass `handleCopyShareLink` to `onRemind`:

```ts
// Delete handleRemind entirely (lines 162-166).
// Line 248: change onRemind={handleRemind} → onRemind={handleCopyShareLink}
```

---

### WR-04: `<p>` element with `onClick` — inaccessible click target

**File:** `src/app/c/[billId]/page.tsx:387-392`

**Issue:** The "CLAIM" prompt rendered for unclaimed items is a `<p>` element with an `onClick` handler. Paragraph elements are not interactive by default: they receive no keyboard focus, are not announced as interactive by screen readers, and have no implicit `role="button"`. Keyboard-only users and assistive technology users cannot activate this affordance. The button at line 334 already covers the same tap target for most users, but the visual `CLAIM` text label below each unclaimed row is only click-accessible via mouse.

**Fix:** Replace the `<p>` with a `<button>` (with `type="button"`) or add `role="button"` and `tabIndex={0}` with a `onKeyDown` Enter/Space handler:

```tsx
<button
  type="button"
  className="text-xs text-stamp uppercase tracking-widest pb-1 pl-0 cursor-pointer bg-transparent border-none p-0"
  onClick={() => handleItemTap(item._id, myClaimOnItem?._id)}
>
  CLAIM
</button>
```

---

### WR-05: `alert()` call in production code path

**File:** `src/app/dashboard/[billId]/page.tsx:302`

**Issue:** The "CLOSE CHIT" confirm button calls `alert("Close chit feature coming soon.")`. `alert()` is a blocking, system-styled dialog that bypasses the app's visual design, cannot be styled, and is unavailable in some non-browser environments (SSR, web workers). This is a placeholder that should not ship in a production build.

**Fix:** Replace with an inline stub message in the existing confirmation panel, or gate the feature with a flag:

```tsx
onClick={() => {
  // TODO: wire to archiveBill mutation when implemented
  setShowCloseConfirm(false);
}}
```

And add a visible "COMING SOON" text inside the confirm panel instead of the alert.

---

## Info

### IN-01: `@font-face` declared before `@import` — CSS spec ordering violation

**File:** `src/app/globals.css:1-9`

**Issue:** The CSS specification requires `@import` rules to precede all other rules except `@charset`. Placing `@font-face` before `@import "tailwindcss"` is technically invalid CSS. PostCSS/Tailwind v4 hoists `@import` at build time so this works in practice today, but it is fragile: a future PostCSS version or a tool change could stop hoisting and cause the `@font-face` to be silently dropped or the Tailwind import to conflict.

**Fix:** Move the `@font-face` block after the `@import` line:

```css
@import "tailwindcss";

@font-face {
  font-family: "Departure Mono";
  src: url("/fonts/DepartureMono-Regular.woff2") format("woff2");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
```

---

### IN-02: `body` font-family hardcodes string instead of using the CSS variable

**File:** `src/app/globals.css:42`

**Issue:** The `body` rule uses `font-family: "JetBrains Mono", monospace` as a literal string rather than `font-family: var(--font-body)`. The `--font-body` custom property is defined in the `@theme inline` block two lines above. The next/font variable is also assigned to `--font-body` in `layout.tsx`. Using the literal string bypasses the CSS variable indirection, meaning if the variable value changes (e.g., font swapped), the `body` rule must also be manually updated.

**Fix:**
```css
body {
  background-color: #EEEAE2;
  color: #1F1B17;
  font-family: var(--font-body);
  -webkit-font-smoothing: antialiased;
}
```

---

### IN-03: Duplicate `id="claimantNameInput"` rendered in a map loop

**File:** `src/app/c/[billId]/page.tsx:407`

**Issue:** The `<input id="claimantNameInput">` and its paired `<label htmlFor="claimantNameInput">` are inside `items.map(...)`. If multiple items have their inline name-entry expansion shown simultaneously (currently prevented by `expandedItemId` being a single string), this would create duplicate DOM ids. Even with the current single-expand constraint, the label-input association is technically only valid for the first matching id in the document. This is a latent bug: if the expansion logic is ever changed to allow multiple open rows, label association will break silently.

**Fix:** Use the item id to make the input id unique:

```tsx
<label htmlFor={`claimantNameInput-${item._id}`} ...>
  YOUR NAME
</label>
<input
  id={`claimantNameInput-${item._id}`}
  ...
/>
```

---

### IN-04: `BillSummaryCard` has `"use client"` directive but no client-side hooks

**File:** `src/components/BillSummaryCard.tsx:1`

**Issue:** The component uses only `calculateTotals` (a pure function) and renders static JSX. There are no React hooks, no `useQuery`, no browser APIs. The `"use client"` directive forces the component to be bundled in the client JavaScript, preventing React Server Component rendering and removing the opportunity for zero-JS rendering of this purely presentational card. Since it is currently consumed from `dashboard/[billId]/page.tsx` (which is already a client component) there is no runtime breakage, but the directive is superfluous and misleading.

**Fix:** Remove `"use client"` from `BillSummaryCard.tsx`. The component will still work correctly when imported by client components.

---

_Reviewed: 2026-05-26T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
