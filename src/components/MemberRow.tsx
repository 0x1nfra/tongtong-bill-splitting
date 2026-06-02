"use client";

import { useState } from "react";
import { StatusBadge } from "./StatusBadge";
import type { StatusValue } from "./StatusBadge";

type MemberRowProps = Readonly<{
  name: string;
  status: StatusValue;
  amountOwed: number; // integer cents
  claimedItems?: ReadonlyArray<{ name: string; price: number; claimedQty: number }>;
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
        <span className="text-sm font-bold text-ink uppercase flex-1 min-w-0 truncate" title={name}>
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
          <button
            type="button"
            onClick={onConfirm}
            className="bg-pen text-white text-xs min-h-[44px] px-3 uppercase tracking-widest cursor-pointer"
          >
            STAMP SETTLED
          </button>
          <button
            type="button"
            onClick={onReject}
            className="border border-ink text-ink text-xs min-h-[44px] px-3 uppercase tracking-widest cursor-pointer"
          >
            REJECT
          </button>
        </div>
      )}

      {showRemind && (
        <div className="flex gap-2 mt-2">
          <button
            type="button"
            onClick={onRemind}
            className="border border-ink text-ink text-xs min-h-[44px] px-3 uppercase tracking-widest cursor-pointer"
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
            aria-expanded={expanded}
            className="bg-transparent border-none text-xs text-ink-muted uppercase tracking-widest cursor-pointer p-0 mt-2"
            onClick={() => setExpanded((prev) => !prev)}
          >
            ITEMS ({claimedItems.length}) <span aria-hidden="true">{expanded ? "▴" : "▾"}</span>
          </button>
          {expanded && (
            <div className="mt-1 pl-1">
              {claimedItems.map((item, i) => (
                <p key={i} className="text-xs text-ink py-0.5">
                  {item.name} × {item.claimedQty} — RM{((item.price * item.claimedQty) / 100).toFixed(2)}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
