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

/**
 * calculatePersonTotals — computes a single claimant's proportional share of the bill.
 *
 * Algorithm:
 * 1. Build claimantsPerItem: Map<itemId, count> from all claim records.
 * 2. Filter myClaims to only the target claimantSession.
 * 3. For each of myClaims: find matching item and add Math.round(price * qty / claimantCount).
 * 4. Guard: if billTotals.subtotalCents === 0, return all zeros.
 * 5. Distribute billTotals service charge and SST proportionally.
 *
 * Critical: uses billTotals.serviceChargeCents and billTotals.sstCents directly —
 * never recalculates percentages — preserving the Malaysian SC-before-SST convention.
 */
export function calculatePersonTotals(
  items: Array<{ _id: string; price: number; quantity: number }>,
  claims: Array<{ itemId: string; claimantSession: string; claimQty?: number }>,
  claimantSession: string,
  billTotals: ReturnType<typeof calculateTotals>
): {
  personSubtotalCents: number;
  personServiceChargeCents: number;
  personSSTCents: number;
  personTotalCents: number;
} {
  // Guard: division-by-zero — if bill subtotal is zero, all person totals are zero
  if (billTotals.subtotalCents === 0) {
    return {
      personSubtotalCents: 0,
      personServiceChargeCents: 0,
      personSSTCents: 0,
      personTotalCents: 0,
    };
  }

  // Build a map of itemId → number of claimants for that item
  const claimantsPerItem = new Map<string, number>();
  for (const claim of claims) {
    claimantsPerItem.set(
      claim.itemId,
      (claimantsPerItem.get(claim.itemId) ?? 0) + 1
    );
  }

  // Build an item lookup map for O(1) access
  const itemMap = new Map<string, { price: number; quantity: number }>();
  for (const item of items) {
    itemMap.set(item._id, { price: item.price, quantity: item.quantity });
  }

  // Filter to only this session's claims and compute person subtotal
  const myClaims = claims.filter(
    (claim) => claim.claimantSession === claimantSession
  );

  let personSubtotalCents = 0;
  for (const claim of myClaims) {
    const item = itemMap.get(claim.itemId);
    if (!item) continue;
    if (item.quantity > 1) {
      // Multi-qty item: claimant pays for however many units they claimed
      personSubtotalCents += item.price * (claim.claimQty ?? 1);
    } else {
      // Single item: split cost among all claimants
      const claimantCount = claimantsPerItem.get(claim.itemId) ?? 1;
      personSubtotalCents += Math.round(item.price / claimantCount);
    }
  }

  // Distribute bill-level charges proportionally — never recalculate from percentages
  const ratio = personSubtotalCents / billTotals.subtotalCents;
  const personServiceChargeCents = Math.round(
    ratio * billTotals.serviceChargeCents
  );
  const personSSTCents = Math.round(ratio * billTotals.sstCents);
  const personTotalCents =
    personSubtotalCents + personServiceChargeCents + personSSTCents;

  return {
    personSubtotalCents,
    personServiceChargeCents,
    personSSTCents,
    personTotalCents,
  };
}
