"use client";

type BillSummaryCardProps = Readonly<{
  title: string;
  items: Array<{ name: string; price: number; quantity: number }>; // price in cents
  applySST: boolean;
  applyServiceCharge: boolean;
  displayCode: string; // e.g. "#TT-K97C"
}>;

/**
 * calculateTotals — derives grand total from items already stored as integer cents.
 * Service charge (10%) applied before SST (6%) — Malaysian restaurant convention.
 */
function calculateTotals(
  items: Array<{ price: number; quantity: number }>,
  applySST: boolean,
  applyServiceCharge: boolean
) {
  // price is already in integer RM cents
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
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

export function BillSummaryCard({
  title,
  items,
  applySST,
  applyServiceCharge,
  displayCode,
}: BillSummaryCardProps) {
  const { grandTotal } = calculateTotals(items, applySST, applyServiceCharge);

  return (
    <div className="bg-[--color-paper-chit] rounded p-4">
      {/* Display code — short human-readable bill code */}
      <p className="uppercase text-xs text-[--color-ink] opacity-60 mb-1">
        {displayCode}
      </p>

      {/* Bill title */}
      <p className="text-base font-bold text-[--color-ink] uppercase tracking-wide mb-1">
        {title || "UNTITLED CHIT"}
      </p>

      {/* Item count */}
      <p className="text-xs text-[--color-ink] opacity-60 mb-3">
        {items.length} {items.length === 1 ? "ITEM" : "ITEMS"}
      </p>

      {/* Grand total */}
      <div className="border-t border-[--color-ink] pt-3">
        <div className="flex justify-between items-center">
          <span className="uppercase text-sm font-bold text-[--color-ink]">
            TOTAL
          </span>
          <span className="text-lg font-bold text-[--color-ink]">
            RM{(grandTotal / 100).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
