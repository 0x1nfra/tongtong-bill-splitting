"use client";

import { useState } from "react";
import { StatusBadge } from "./StatusBadge";
import type { StatusValue } from "./StatusBadge";

type MemberRowProps = Readonly<{
  name: string;
  status: StatusValue;
  amountOwed: number; // integer cents
  claimedItems?: ReadonlyArray<{ name: string; price: number; quantity: number }>;
  onConfirm?: () => void;
  onReject?: () => void;
  onRemind?: () => void;
}>;

export function MemberRow({
  name,
  status,
  amountOwed,
  claimedItems,
  onConfirm,
  onReject,
  onRemind,
}: MemberRowProps) {
  const [expanded, setExpanded] = useState(false);
  const showConfirmReject = status === "AWAITING";
  const showRemind =
    status === "CLAIMED — UNPAID" || status === "UNCLAIMED ❋";

  return (
    <div className="border-b border-ink/20 py-3">
      {/* Row 1: name + amount + status badge */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-ink uppercase flex-1 min-w-0 truncate">
          {name}
        </span>
        <span className="text-sm text-ink shrink-0">
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
            className="bg-pen text-white text-xs h-8 px-3 uppercase tracking-widest cursor-pointer"
          >
            STAMP SETTLED
          </button>
          {/* REJECT — neutral border style, no blue/red */}
          <button
            type="button"
            onClick={onReject}
            className="border border-ink text-ink text-xs h-8 px-3 uppercase tracking-widest cursor-pointer"
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
            className="border border-ink text-ink text-xs h-8 px-3 uppercase tracking-widest cursor-pointer"
          >
            SEND REMINDER
          </button>
        </div>
      )}

      {/* Row 3: collapsible claimed items toggle */}
      {claimedItems && claimedItems.length > 0 && (
        <div>
          <button
            type="button"
            className="bg-transparent border-none text-xs text-ink-muted uppercase tracking-widest cursor-pointer p-0 mt-2"
            onClick={() => setExpanded((prev) => !prev)}
          >
            ITEMS ({claimedItems.length}) {expanded ? "▴" : "▾"}
          </button>
          {expanded && (
            <div className="mt-1 pl-1">
              {claimedItems.map((item, i) => (
                <p key={i} className="text-xs text-ink py-0.5">
                  {item.name} × {item.quantity} — RM{((item.price * item.quantity) / 100).toFixed(2)}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
