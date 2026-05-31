"use client";

import type { ItemDraft } from "./ItemRow";

type RunningTotalProps = Readonly<{
  items: ItemDraft[];
  applySST: boolean;
  applyServiceCharge: boolean;
}>;

function calculateTotals(
  items: ItemDraft[],
  applySST: boolean,
  applyServiceCharge: boolean
) {
  // Sum: price (as RM string) × quantity — convert to integer cents
  const subtotal = items.reduce(
    (sum, item) =>
      sum + Math.round(parseFloat(item.price || "0") * 100) * item.quantity,
    0
  );

  // Service charge (10%) applied BEFORE SST — Malaysian restaurant convention
  const serviceCharge = applyServiceCharge ? Math.round(subtotal * 0.1) : 0;
  const afterSC = subtotal + serviceCharge;

  // SST (6%) applied on post-service-charge total
  const sst = applySST ? Math.round(afterSC * 0.06) : 0;
  const grandTotal = afterSC + sst;

  return { subtotal, serviceCharge, sst, grandTotal };
}

export function RunningTotal({
  items,
  applySST,
  applyServiceCharge,
}: RunningTotalProps) {
  const { subtotal, serviceCharge, sst, grandTotal } = calculateTotals(
    items,
    applySST,
    applyServiceCharge
  );

  return (
    <div>
      <div className="dot-leader flex justify-between text-sm text-ink mb-1">
        <span className="text-ink-muted">Subtotal</span>
        <span>RM{(subtotal / 100).toFixed(2)}</span>
      </div>

      {applyServiceCharge && (
        <div className="dot-leader flex justify-between text-sm text-ink mb-1">
          <span className="text-ink-muted">Service Charge (10%)</span>
          <span>RM{(serviceCharge / 100).toFixed(2)}</span>
        </div>
      )}

      {applySST && (
        <div className="dot-leader flex justify-between text-sm text-ink mb-1">
          <span className="text-ink-muted">SST (6%)</span>
          <span>RM{(sst / 100).toFixed(2)}</span>
        </div>
      )}

      <div className="dot-leader flex justify-between font-bold text-base text-ink border-t border-ink mt-2 pt-2">
        <span className="uppercase tracking-widest">GRAND TOTAL</span>
        <span>RM{(grandTotal / 100).toFixed(2)}</span>
      </div>
    </div>
  );
}
