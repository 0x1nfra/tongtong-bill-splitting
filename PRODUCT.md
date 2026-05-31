# Product

## Register

product

## Users

Malaysian group diners splitting restaurant bills. Two roles:

- **Organizer**: at the table, creates the bill, shares a WhatsApp link, monitors payment status on the dashboard
- **Members**: receive the link on mobile, claim items they ordered, see their share, pay via DuitNow QR

Context: mamak stall, casual dining, social pressure to settle fast without awkwardness. Always on phones, often in a noisy social setting. Job: claim items → see amount → pay → done.

## Product Purpose

TongTong removes the awkwardness of splitting restaurant bills in Malaysian group dining. The organizer generates a shareable link; friends tap to claim what they ordered and pay via DuitNow QR. No app install, no chasing, no mental arithmetic.

Success: everyone settles before the organizer gets up from the table.

## Brand Personality

Warm, familiar, Malaysian. Three words: **chit, tandakan, beres.**

The interface should feel like a physical receipt passed around a table — not a SaaS tool. The SETTLE stamp is celebratory. The paper is warm. The copy is Manglish-friendly.

## Anti-references

What TongTong should NOT feel like:

- **Splitwise / fintech apps** — white cards, navy blue, corporate financial polish; too sterile and transactional
- **WhatsApp / chat UI** — message bubbles, teal, timestamp-heavy; social, not functional
- **Grab / super-apps** — loud gradients, green-heavy, promotion-banner density; too promotional, too urban-corporate
- **Notion-style minimal** — ultra-sparse, serif, beige-white; too quiet for group dining energy
- **Glassmorphism** — blur cards used decoratively; wrong material for a receipt metaphor
- **Gradient text** — decorative, never meaningful in a chit context
- **Neon accents** — wrong temperature entirely

## Design Principles

1. **Receipt before UI** — every element should feel like it belongs on a physical receipt or chit; if it couldn't appear on printed paper, question it
2. **Sequence = receipt flow** — items first, then your portion, then payment; never surface payment before claiming is done
3. **Color communicates, not decorates** — red = SETTLE/settled/danger only, blue = primary action only, amber = needs attention; no decorative color use
4. **Opacity hacks are banned** — use `text-ink-muted` (#7A6F65) instead of `text-ink opacity-60`; warm muted brown, not transparent ink
5. **Mobile-first, nothing critical desktop-only** — Malaysian users are on phones in social settings; all core flows must work one-handed on a 375px screen

## Accessibility & Inclusion

- **Target**: WCAG 2.1 AA
- Body text: ≥4.5:1 contrast against paper backgrounds
- Large text / bold labels: ≥3:1
- All interactive elements keyboard-navigable and focus-visible (pen-blue outline)
- Stamp animations respect `prefers-reduced-motion`: crossfade or instant state change
- No color-only information encoding (status badges must have text labels, not color alone)
