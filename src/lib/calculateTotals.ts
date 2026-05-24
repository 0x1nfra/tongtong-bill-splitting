/**
 * calculateTotals — derives totals from Convex items stored as integer RM cents.
 * Service charge (10%) applied before SST (6%) — Malaysian restaurant convention.
 * Returns all values in integer RM cents. Callers format with (v / 100).toFixed(2).
 */
export function calculateTotals(
  items: Array<{ price: number; quantity: number }>,
  applySST: boolean,
  applyServiceCharge: boolean
): {
  subtotalCents: number;
  serviceChargeCents: number;
  sstCents: number;
  grandTotalCents: number;
} {
  const subtotalCents = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const serviceChargeCents = applyServiceCharge
    ? Math.round(subtotalCents * 0.1)
    : 0;
  const afterServiceCharge = subtotalCents + serviceChargeCents;
  const sstCents = applySST ? Math.round(afterServiceCharge * 0.06) : 0;
  const grandTotalCents = afterServiceCharge + sstCents;
  return { subtotalCents, serviceChargeCents, sstCents, grandTotalCents };
}
