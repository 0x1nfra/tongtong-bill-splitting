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
    <div className="border-t border-[--color-ink] pt-4 mt-4 space-y-2">
      {/* Subtotal row */}
      <div className="flex justify-between items-center text-sm text-[--color-ink]">
        <span className="uppercase">Subtotal</span>
        <span>RM{(subtotal / 100).toFixed(2)}</span>
      </div>

      {/* Service charge row — only shown when enabled */}
      {applyServiceCharge && (
        <div className="flex justify-between items-center text-sm text-[--color-ink]">
          <span className="uppercase">Service Charge (10%)</span>
          <span>RM{(serviceCharge / 100).toFixed(2)}</span>
        </div>
      )}

      {/* SST row — only shown when enabled */}
      {applySST && (
        <div className="flex justify-between items-center text-sm text-[--color-ink]">
          <span className="uppercase">SST (6%)</span>
          <span>RM{(sst / 100).toFixed(2)}</span>
        </div>
      )}

      {/* Grand total row */}
      <div className="flex justify-between items-center text-lg font-bold text-[--color-ink] pt-1 border-t border-[--color-ink]">
        <span className="uppercase">Total</span>
        <span>RM{(grandTotal / 100).toFixed(2)}</span>
      </div>
    </div>
  );
}
