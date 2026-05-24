"use client";

import { StatusBadge } from "./StatusBadge";
import type { StatusValue } from "./StatusBadge";

type MemberRowProps = Readonly<{
  name: string;
  status: StatusValue;
  amountOwed: number; // integer cents
  onConfirm?: () => void;
  onReject?: () => void;
  onRemind?: () => void;
}>;

export function MemberRow({
  name,
  status,
  amountOwed,
  onConfirm,
  onReject,
  onRemind,
}: MemberRowProps) {
  const showConfirmReject = status === "AWAITING";
  const showRemind =
    status === "CLAIMED — UNPAID" || status === "UNCLAIMED ❋";

  return (
    <div className="border-b border-[--color-ink] border-opacity-20 py-3">
      {/* Row 1: name + amount + status badge */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-[--color-ink] uppercase flex-1 min-w-0 truncate">
          {name}
        </span>
        <span className="text-sm text-[--color-ink] shrink-0">
          RM{(amountOwed / 100).toFixed(2)}
        </span>
        <span className="shrink-0 ml-2">
          <StatusBadge status={status} />
        </span>
      </div>

      {/* Row 2: action buttons */}
      {showConfirmReject && (
        <div className="flex gap-2 mt-2">
          {/* STAMP SETTLED — blue primary CTA per DASH-05 */}
          <button
            type="button"
            onClick={onConfirm}
            className="bg-[--color-pen] text-white text-xs h-8 px-3 uppercase tracking-widest cursor-pointer"
          >
            STAMP SETTLED
          </button>
          {/* REJECT — neutral border style, no blue/red */}
          <button
            type="button"
            onClick={onReject}
            className="border border-[--color-ink] text-[--color-ink] text-xs h-8 px-3 uppercase tracking-widest cursor-pointer"
          >
            REJECT
          </button>
        </div>
      )}

      {showRemind && (
        <div className="flex gap-2 mt-2">
          {/* SEND REMINDER — neutral border style, no blue/red */}
          <button
            type="button"
            onClick={onRemind}
            className="border border-[--color-ink] text-[--color-ink] text-xs h-8 px-3 uppercase tracking-widest cursor-pointer"
          >
            SEND REMINDER
          </button>
        </div>
      )}
    </div>
  );
}
