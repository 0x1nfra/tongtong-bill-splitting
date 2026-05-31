---
name: TongTong
description: Bill-splitting chit for Malaysian group dining — claim items, pay, beres.
colors:
  paper-table: "#EEEAE2"
  paper-chit: "#F4EFE6"
  ink: "#1F1B17"
  pen: "#1E40AF"
  stamp: "#B91C1C"
  warning: "#B45309"
  ink-muted: "#7A6F65"
  dark-paper-table: "#1C1510"
  dark-paper-chit: "#2A1E15"
  dark-ink: "#D4C9B8"
  dark-pen: "#7BA7D9"
  dark-warning: "#D97706"
  dark-ink-muted: "#9E9188"
typography:
  display:
    fontFamily: "Departure Mono, monospace"
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: "0.05em"
  body:
    fontFamily: "JetBrains Mono, monospace"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "JetBrains Mono, monospace"
    fontWeight: 700
    letterSpacing: "0.1em"
  handwriting:
    fontFamily: "Shadows Into Light Two, cursive"
    fontWeight: 400
    lineHeight: 1.4
  stamp:
    fontFamily: "Bungee, sans-serif"
    fontWeight: 400
    letterSpacing: "0.1em"
rounded:
  none: "0px"
  sm: "4px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.pen}"
    textColor: "#FFFFFF"
    rounded: "{rounded.none}"
    padding: "12px 24px"
  button-primary-hover:
    backgroundColor: "#1A35A0"
    textColor: "#FFFFFF"
    rounded: "{rounded.none}"
    padding: "12px 24px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.pen}"
    rounded: "{rounded.none}"
    padding: "12px 24px"
  button-ghost-hover:
    backgroundColor: "{colors.pen}"
    textColor: "#FFFFFF"
    rounded: "{rounded.none}"
    padding: "12px 24px"
  input-default:
    backgroundColor: "{colors.paper-chit}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "4px 8px"
---

# Design System: TongTong

## 1. Overview

**Creative North Star: "The Mamak Chit"**

TongTong's design system is modelled on a single physical object: the hand-torn till receipt from a Malaysian mamak stall, passed across a sticky laminate table for everyone to see what they owe. Every design decision flows from that object — its material (warm thermal paper), its marks (ballpoint blue for writing, rubber stamp red for settlement), its texture (faint paper grain), and its structure (items, dot-leaders, a perforation, the grand total).

This is not a fintech app with warm colors. It is a piece of paper rendered on a phone. The typography is monospace because receipts are monospace. The buttons are sharp-cornered because receipts have no border-radius. The SETTLE stamp rotates six degrees because real stamps never land perfectly straight. Every affordance should survive the test: could this element appear on a printed thermal receipt without looking out of place?

The system rejects the anti-references by material logic, not by stylistic preference: Splitwise's white card grid fails because cards are not receipts; WhatsApp's chat bubbles fail because chits are not messages; Grab's promotional density fails because a chit is a document, not an advertisement; Notion's spare beige fails because a mamak chit is not an editorial artifact.

**Key Characteristics:**
- Warm thermal paper backgrounds (never cold white, never cream-for-its-own-sake)
- Monospace type throughout — display and body both fixed-width
- Sharp corners on all containers and buttons; small radius (4px) on form inputs only
- Color is semantic, not decorative: each hue has exactly one job
- One elevation level: the chit lifts off the table; everything else is flat
- The SETTLE stamp is the only moving element on the page

## 2. Colors: The Receipt Palette

Five functional roles, no decorative colors. Each hue has a job; mixing the roles is a defect, not a design choice.

### Primary
- **Pressing Blue** (`#1E40AF` / dark mode `#7BA7D9`): The ink of a ballpoint pen marking a claim. Used exclusively for primary action buttons, interactive links, step-number accents, and focus rings. On any given screen, pressing blue should appear at most twice: one CTA, one supporting interactive element. Its rarity is the point.

### Neutral
- **Warm Counter** (`#EEEAE2` / dark mode `#1C1510`): The laminate table surface. Page background. Never used as a container background.
- **Fresh Paper** (`#F4EFE6` / dark mode `#2A1E15`): The chit itself, lifted off the counter. Used for the `.chit` surface and all form inputs (they sit on the chit, not the table).
- **Deep Ballpoint** (`#1F1B17` / dark mode `#D4C9B8`): Body ink. All primary text, borders on inputs and containers. The darkest value on the surface.
- **Faded Print** (`#7A6F65` / dark mode `#9E9188`): Supporting ink — slightly worn, slightly receded. Bill codes, secondary labels, placeholder guidance. Never use `text-ink opacity-60`; always use this token directly.

### Semantic
- **Rubber Red** (`#B91C1C`): The SETTLE stamp. Used only for: the SETTLE stamp text and border, the logo period, and unclaimed-item warning icons (`❋`). Never used for warnings, errors, or decorative accents. In dark mode, this value is intentionally not overridden — the stamp color must stay saturated regardless of theme.
- **Marker Amber** (`#B45309` / dark mode `#D97706`): The orange felt-tip mark that means "this needs attention." Used only for unclaimed-item warnings and the `UNCLAIMED ❋` status badge. Distinct from Rubber Red: amber means "do something," red means "done."

### Named Rules
**The One Job Rule.** Each color does exactly one job. Pressing Blue = action. Rubber Red = SETTLE/settled. Marker Amber = attention needed. A color appearing in a second context is a defect, not a design decision.

**The Opacity Ban.** Never achieve muted text with `opacity-60` or similar on ink-colored text. Always use the Faded Print token (`#7A6F65`). Opacity hacks produce inconsistent contrast against different backgrounds and break dark-mode overrides.

## 3. Typography: Four Roles, No Substitutions

**Display Font:** Departure Mono (monospace, weight 400)
**Body Font:** JetBrains Mono (monospace, weight 400/700)
**Handwriting Font:** Shadows Into Light Two (cursive, weight 400)
**Stamp Font:** Bungee (sans-serif, weight 400)

**Character:** All four fonts serve the receipt metaphor. Display and Body are both monospace because receipts are printed by thermal printers with fixed-width heads. Shadows Into Light Two mimics the handwriting of a person filling in their name on a paper form. Bungee replicates the compressed letterforms of rubber stamp sets. These are not aesthetic choices — they are material choices. Substituting a humanist sans for any of these roles breaks the metaphor.

### Hierarchy
- **Display** (Departure Mono, 400, varies by context, lh 1.1, ls 0.05em): Bill titles, page headings, step-number accents (01. / 02. / 03.), the tongtong wordmark. Not used in buttons, labels, or data.
- **Label** (JetBrains Mono, 700, 0.625–0.75rem, ls 0.1em, uppercase): Section headers, bill codes (`#TT-XXXX`), status text, column headers. Always uppercase when used as a label; never uppercase for prose.
- **Body** (JetBrains Mono, 400, 0.875rem, lh 1.5): Item names, supporting descriptions, helper text. Max 65ch for prose blocks.
- **Handwriting** (Shadows Into Light Two, 400): Claimant names only — the "written in pen on the receipt" role. Never used for UI chrome.
- **Stamp** (Bungee, 400, 1.875rem+, ls 0.1em, uppercase): SETTLE text and AWAITING CONFIRMATION text in the stamp component only. Never used elsewhere.

### Named Rules
**The Substitution Ban.** Each font role maps to exactly one semantic context. Departure Mono in a button, Bungee in a heading, or Shadows Into Light Two in a label are defects. The four fonts are not a palette to mix freely.

**The Uppercase Ceiling.** Uppercase is reserved for short labels (≤4 words), bill codes, stamp text, and step numbers. Body copy, item names, and descriptions are sentence case or title case — never all-caps.

## 4. Elevation

TongTong uses a single-elevation model: the chit surface is the only lifted element in the entire interface. Everything else is flat against the table.

**The metaphor is literal:** a physical receipt rests on a table. The table is flat. The receipt lifts slightly. Nothing else levitates.

The chit elevation is rendered as a warm directional shadow that matches the paper color family:

### Shadow Vocabulary
- **Chit lift** (`box-shadow: 2px 4px 16px rgba(31, 27, 23, 0.12), 0 1px 3px rgba(31, 27, 23, 0.08)`): Applied exclusively via the `.chit` CSS class. The only shadow value in the system. Dark mode increases ambient opacity to 0.5 / 0.3 to compensate for the darker table surface.

### Named Rules
**The One-Level Rule.** If you are reaching for a second shadow value (a "deeper" card, a "floating" modal), the correct answer is almost certainly a full-screen overlay or a sheet-over pattern, not a new shadow token. The `.chit` class is the ceiling, not the floor.

## 5. Components

### Buttons
Thermal printer output: sharp, tight, functional. No curves. No icons inside buttons unless structurally necessary.

- **Shape:** Square corners (0px radius). No exceptions for any button variant.
- **Primary** (bg Pressing Blue `#1E40AF`, text white): Used for the single most important action on the screen. Never more than one primary button per view.
  - Padding: 12px 24px; min-height: 48px (touch target)
  - Typography: JetBrains Mono 700, 0.75rem, uppercase, ls 0.1em
  - Hover: background darkens to `#1A35A0`
  - Focus: 2px solid Pressing Blue outline, 2px offset
- **Ghost** (transparent bg, 1px solid Pressing Blue border, Pressing Blue text): Secondary action on the same screen as a primary button.
  - Hover: fills to Pressing Blue bg, white text (mirrors primary)
  - Same size and type rules as primary
- **Delete / tertiary** (text-ink, no border, no background): Used for destructive inline actions (delete item row). Must never use Rubber Red. Hover reduces opacity to 60%.

### Inputs / Fields
Inputs sit on the chit surface (Fresh Paper background), not the table. They inherit the chit's paper color.

- **Style:** 1px solid Deep Ballpoint border; 4px radius (the only rounding in the system); Fresh Paper background; Deep Ballpoint text; JetBrains Mono 400, 0.875rem.
- **Focus:** 2px solid Pressing Blue outline, 2px offset (from `:focus-visible` global rule). No border-color change.
- **Placeholder:** `color: Faded Print (#7A6F65)`. Never default browser grey.
- **Min height:** 44px on mobile (touch target minimum).

### Chit Container
The signature surface pattern. All content cards, bill summaries, and receipt displays use this class.

- **Background:** Fresh Paper (`#F4EFE6`)
- **Shadow:** Chit lift (the single shadow token)
- **Corners:** Square (0px radius)
- **Border:** None — shadow provides the separation
- **Internal padding:** 16px (compact) or 24px (standard)
- **Max width:** 320px on mobile (receipt width metaphor); no max on desktop

Nested `.chit` elements are prohibited. One level of elevation.

### Perforation
The `.perforation` utility renders the torn-edge divider between receipt sections: a dashed horizontal rule (3×5px dash rhythm, ink-colored). Used to separate the item list from the totals block, or to divide major sections within a chit. Never used as a generic `<hr>` replacement.

### Dot Leader
The `.dot-leader` utility renders a receipt row with name on the left, value on the right, and a dotted fill between them (1px dots, 7px pitch). Used for every item row and total row in bill displays. Do not use flexbox `justify-between` as a substitute; the dot-leader dot pitch is semantic to the receipt metaphor.

### Status Badge (StatusBadge)
Inline text label, uppercase, JetBrains Mono. No background, no border — status is conveyed by color and text alone, never by shape.

- `UNCLAIMED ❋` → Marker Amber (`#B45309`)
- `N/A` → Faded Print (`#7A6F65`)
- All other states → Deep Ballpoint (`#1F1B17`)

The `❋` glyph in UNCLAIMED status is part of the text label, not a separate icon.

### SETTLE Stamp (signature component)
The most distinctive element in the system. A 2px solid Rubber Red border, Bungee text at 1.875rem, rotated −6deg, with an SVG ink-bleed filter applied (`filter: url(#ink-bleed)`) for a rubber-stamp texture.

- Text: SETTLE (settled state) or AWAITING CONFIRMATION (pending state)
- Color: Rubber Red (`#B91C1C`) for text and border — never any other hue
- Rotation: −6deg — always; this is not a hover state, it is the default
- Animation (`stamp-land`): fires only on the `pending → settled` transition, not on page load with an existing settled status. `300ms ease-out`, reduced-motion fallback: instant opacity crossfade.
- "HAVE A GOOD ONE!" success copy below the stamp: Pressing Blue (`#1E40AF`), not Rubber Red

## 6. Do's and Don'ts

### Do:
- **Do** use the `.chit` class for all receipt-surface containers. Apply it to the element that represents the physical receipt, not a wrapper div.
- **Do** use `.dot-leader` for every item-price row in bill displays. The dot pattern is semantic — it communicates "these two values belong together across white space."
- **Do** use Faded Print (`#7A6F65`) for supporting text. Never achieve this by reducing opacity on Deep Ballpoint ink.
- **Do** reserve Pressing Blue for primary actions and interactive elements only. Decorative use of pen-blue (dividers, icons, accents) is prohibited.
- **Do** set a min-height of 48px on all button elements and 44px on all inputs for touch accessibility.
- **Do** use `text-wrap: balance` on bill titles and h1–h3 elements to prevent orphan words on narrow mobile screens.
- **Do** respect `prefers-reduced-motion`: replace the `stamp-land` animation with an instant opacity transition (0ms crossfade).
- **Do** prefix all SETTLE-stamp-related styles and interactions with color Rubber Red (`#B91C1C`) exactly as defined. No tints, no opacity variants.

### Don't:
- **Don't** use Rubber Red for anything except the SETTLE stamp border/text, the logo period, and the `❋` unclaimed glyph. Not for error messages, not for delete buttons, not for alerts, not for decorative accents.
- **Don't** use `border-left` or `border-right` as a colored stripe on cards or list items. This is an absolute ban. Rewrite with a background tint or a leading number/icon.
- **Don't** use `background-clip: text` with a gradient for any text element. All text uses a single solid color token.
- **Don't** add border-radius to buttons or the `.chit` container. The 4px radius exists only on form inputs and the stamp border. Everywhere else: 0.
- **Don't** nest `.chit` elements inside another `.chit`. One elevation level; nested cards break the single-receipt metaphor.
- **Don't** use glassmorphism (backdrop-filter blur on decorative cards). Not in the vocabulary of thermal paper.
- **Don't** make the interface look like Splitwise's white card grid, WhatsApp's chat bubbles, Grab's promotional banner density, or Notion's ultra-spare beige. These are the named anti-references; they each fail by not being a receipt.
- **Don't** use Shadows Into Light Two (handwriting font) for any UI chrome, labels, or navigation. Its role is claimant names only — human handwriting on a machine-printed document.
- **Don't** use display fonts (Departure Mono) in buttons, form labels, or status text. Departure Mono is for headings and bill codes; JetBrains Mono carries all UI chrome.
- **Don't** animate the SETTLE stamp on initial page load when the status is already settled. The `stamp-land` animation fires only on the state transition, not on mount.
- **Don't** add a second shadow token to create nested depth. The chit lift is the only shadow in the system.
