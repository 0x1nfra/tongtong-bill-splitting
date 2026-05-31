"use client";

import { useState, useEffect, useRef } from "react";

export type SettleStampStatus = "pending" | "settled" | "rejected" | null;

/**
 * SettleStamp — SETTLE stamp overlay for the member view payment state machine.
 *
 * Status-to-render mapping:
 *   null     → no output (member hasn't tapped I'VE PAID yet)
 *   pending  → stamp at opacity-50 with "AWAITING CONFIRMATION" (PAY-02)
 *   settled  → stamp at opacity-100 with "HAVE A GOOD ONE!" (PAY-04)
 *   rejected → no output (member can re-tap I'VE PAID)
 *
 * Color rules (CLAUDE.md / UI-SPEC hard constraints):
 *   SETTLE text and border: text-stamp / border-stamp (#B91C1C)
 *   "HAVE A GOOD ONE!" text: text-pen (#1E40AF) — pen copy, not stamp
 *
 * Animation:
 *   Thwack (stamp-land keyframe) fires ONLY on pending→settled transition.
 *   Mount with status="settled" renders stamp at full opacity without animation (D-05).
 */
export function SettleStamp({
  status,
}: Readonly<{ status: SettleStampStatus }>) {
  const prevStatusRef = useRef<SettleStampStatus>(status);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = status;
    if (status === "settled" && prev !== "settled") {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 350);
      return () => clearTimeout(timer);
    }
  }, [status]);

  if (status === null || status === "rejected") {
    return null;
  }

  if (status === "pending") {
    return (
      <div className="text-center py-2">
        <p className="text-sm font-bold text-stamp uppercase tracking-widest">
          AWAITING CONFIRMATION
        </p>
        <p className="text-xs text-ink-muted uppercase tracking-widest mt-1">
          <span lang="ms">Tunggu kejap — organizer tengah semak</span>
        </p>
      </div>
    );
  }

  // status === "settled"
  const stampBase = "inline-block border-2 border-stamp rounded px-4 py-2";
  const animClass = isAnimating ? " animate-stamp-land" : "";
  const stampClassName = stampBase + animClass;
  return (
    <div className="text-center">
      <div
        className={stampClassName}
        style={{ transform: "rotate(-6deg)", filter: "url(#ink-bleed)" }}
      >
        <span
          className="text-3xl font-bold text-stamp uppercase tracking-widest font-[family-name:var(--font-stamp)]"
        >
          SETTLE
        </span>
      </div>
      <p className="text-sm font-bold text-pen uppercase tracking-widest mt-4">
        HAVE A GOOD ONE!
      </p>
    </div>
  );
}
