"use client";

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
 */
export function SettleStamp({
  status,
}: Readonly<{ status: SettleStampStatus }>) {
  if (status === null || status === "rejected") {
    return null;
  }

  if (status === "pending") {
    return (
      <div className="text-center opacity-50">
        <div
          className="inline-block border-2 border-stamp rounded px-4 py-2"
          style={{ transform: "rotate(-6deg)" }}
        >
          <span className="text-3xl font-bold text-stamp uppercase tracking-widest">
            SETTLE
          </span>
        </div>
        <p className="text-xs text-stamp uppercase tracking-widest mt-1">
          AWAITING CONFIRMATION
        </p>
      </div>
    );
  }

  // status === "settled"
  return (
    <div className="text-center">
      <div
        className="inline-block border-2 border-stamp rounded px-4 py-2"
        style={{ transform: "rotate(-6deg)" }}
      >
        <span className="text-3xl font-bold text-stamp uppercase tracking-widest">
          SETTLE
        </span>
      </div>
      <p className="text-xs text-pen uppercase tracking-widest mt-1">
        HAVE A GOOD ONE!
      </p>
    </div>
  );
}
