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
  const { subtotalCents, serviceChargeCents, sstCents, grandTotalCents } =
    calculateTotals(items, applySST, applyServiceCharge);

  return (
    <div className="chit p-4">
      <p
        className="text-[10px] text-ink-muted mb-0.5 uppercase tracking-widest"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {displayCode}
      </p>
      <p
        className="text-sm font-bold text-ink uppercase tracking-wide mb-3"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {title || "UNTITLED BILL"}
      </p>

      {/* Item list */}
      <div className="mb-3">
        {items.map((item, i) => (
          <div key={i} className="dot-leader flex justify-between text-xs text-ink mb-1">
            <span>
              {item.name}
              {item.quantity > 1 ? ` ×${item.quantity}` : ""}
            </span>
            <span>RM{((item.price * item.quantity) / 100).toFixed(2)}</span>
          </div>
        ))}
      </div>

      {/* Totals breakdown */}
      <div className="dot-leader flex justify-between text-xs text-ink mb-1">
        <span className="text-ink-muted">Subtotal</span>
        <span>RM{(subtotalCents / 100).toFixed(2)}</span>
      </div>
      {applyServiceCharge && (
        <div className="dot-leader flex justify-between text-xs text-ink mb-1">
          <span className="text-ink-muted">Service Charge (10%)</span>
          <span>RM{(serviceChargeCents / 100).toFixed(2)}</span>
        </div>
      )}
      {applySST && (
        <div className="dot-leader flex justify-between text-xs text-ink mb-1">
          <span className="text-ink-muted">SST (6%)</span>
          <span>RM{(sstCents / 100).toFixed(2)}</span>
        </div>
      )}
      <div className="dot-leader flex justify-between font-bold text-sm text-ink border-t border-ink mt-2 pt-2">
        <span className="uppercase tracking-widest">GRAND TOTAL</span>
        <span>RM{(grandTotalCents / 100).toFixed(2)}</span>
      </div>
    </div>
  );
}
