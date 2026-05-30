"use client";

import { calculateTotals } from "@/lib/calculateTotals";

type BillSummaryCardProps = Readonly<{
  title: string;
  items: Array<{ name: string; price: number; quantity: number }>; // price in cents
  applySST: boolean;
  applyServiceCharge: boolean;
  displayCode: string; // e.g. "#TT-K97C"
}>;

export function BillSummaryCard({
  title,
  items,
  applySST,
  applyServiceCharge,
  displayCode,
}: BillSummaryCardProps) {
  const { grandTotalCents } = calculateTotals(
    items,
    applySST,
    applyServiceCharge,
  );

  return (
    <div className="chit p-4">
      {/* Display code — short human-readable bill code */}
      <p className="uppercase text-xs text-ink opacity-60 mb-1">
        {displayCode}
      </p>

      {/* Bill title */}
      <p className="text-base font-bold text-ink uppercase tracking-wide mb-1">
        {title || "UNTITLED CHIT"}
      </p>

      {/* Item count */}
      <p className="text-xs text-ink opacity-60 mb-2">
        {items.length} {items.length === 1 ? "ITEM" : "ITEMS"}
      </p>

      {/* Item list */}
      <div className="mb-3">
        {items.map((item, i) => (
          <div key={i} className="dot-leader items-center mb-1">
            <span className="text-xs text-ink">
              {item.name}{item.quantity > 1 ? ` ×${item.quantity}` : ""}
            </span>
            <span className="text-xs text-ink">
              RM{((item.price * item.quantity) / 100).toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      {/* Grand total */}
      <div className="border-t border-ink pt-3">
        <div className="dot-leader items-center">
          <span className="uppercase text-sm font-bold text-ink">GRAND TOTAL</span>
          <span className="text-lg font-bold text-ink">
            RM{(grandTotalCents / 100).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
