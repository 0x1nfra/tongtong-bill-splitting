"use client";

/**
 * ArchivedStamp — ARCHIVED stamp overlay for bills that have been auto-archived.
 *
 * Visual contract (04-UI-SPEC.md "ARCHIVED Stamp"):
 *   Text:     ARCHIVED — Bungee font, UPPERCASE, text-stamp (#B91C1C)
 *   Border:   border-stamp (#B91C1C)
 *   Transform: rotate(-6deg) — same orientation as SETTLE stamp
 *   Filter:   filter: url(#ink-bleed) — same ink-bleed SVG filter
 *   Opacity:  100% — no opacity-50 (archived = confirmed final state)
 *   Sub-copy: "THIS CHIT IS ARCHIVED" — JetBrains Mono 12px UPPERCASE text-stamp tracking-widest
 *   Detail:   "This chit was automatically archived after 30 days of inactivity." — 12px body, text-ink-muted
 *   No animation — archival is a permanent state; no thwack
 */
export function ArchivedStamp() {
  return (
    <div className="text-center my-6">
      <div
        className="inline-block border-2 border-stamp px-4 py-2"
        style={{ transform: "rotate(-6deg)", filter: "url(#ink-bleed)" }}
      >
        <span
          className="text-3xl font-bold text-stamp uppercase tracking-widest font-[family-name:var(--font-stamp)]"
        >
          ARCHIVED
        </span>
      </div>
      <p className="text-xs text-stamp uppercase tracking-widest mt-5">
        THIS BILL IS ARCHIVED
      </p>
      <p className="text-xs text-ink-muted mt-2">
        This bill was automatically archived after 30 days of inactivity.
      </p>
    </div>
  );
}
