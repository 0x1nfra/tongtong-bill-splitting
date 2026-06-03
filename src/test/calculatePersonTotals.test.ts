/**
 * Behavioral tests for calculatePersonTotals from @/lib/calculateTotals.
 *
 * calculatePersonTotals computes a single claimant's proportional share:
 *   - personSubtotalCents: sum of Math.round(itemPrice * qty / claimantCount) per claimed item
 *   - personServiceChargeCents: Math.round((personSubtotal / billSubtotal) * billServiceCharge)
 *   - personSSTCents: Math.round((personSubtotal / billSubtotal) * billSST)
 *   - personTotalCents: sum of the three above
 *
 * Uses billTotals from calculateTotals directly — never recalculates SC/SST percentages.
 * Service charge is applied before SST (Malaysian convention) already encoded in calculateTotals.
 * All outputs are integer RM cents.
 */

import { describe, it, expect } from 'vitest'
import { calculatePersonTotals, calculateTotals } from '@/lib/calculateTotals'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function item(id: string, price: number, quantity: number) {
  return { _id: id, price, quantity }
}

function claim(itemId: string, claimantSession: string) {
  return { itemId, claimantSession }
}

function claimWithQty(itemId: string, claimantSession: string, claimQty: number) {
  return { itemId, claimantSession, claimQty }
}

// ---------------------------------------------------------------------------
// Test items and bill for most scenarios
// ---------------------------------------------------------------------------
// i1: RM 10.00 (1000 cents), qty 1
// i2: RM 20.00 (2000 cents), qty 1
// billSubtotal = 3000 cents
const BASE_ITEMS = [item('i1', 1000, 1), item('i2', 2000, 1)]

// ---------------------------------------------------------------------------
// 1. Single claimer — gets full item cost
// ---------------------------------------------------------------------------

describe('calculatePersonTotals — single claimer per item', () => {
  it('sole claimer of an item pays the full item price', () => {
    const items = [item('i1', 1500, 1)]
    const claims = [claim('i1', 'alice')]
    const billTotals = calculateTotals(items, false, false)
    const result = calculatePersonTotals(items, claims, 'alice', billTotals)
    // alice is sole claimer of i1 (1500 / 1 = 1500)
    expect(result.personSubtotalCents).toBe(1500)
    expect(result.personServiceChargeCents).toBe(0)
    expect(result.personSSTCents).toBe(0)
    expect(result.personTotalCents).toBe(1500)
  })

  it('sole claimer of qty > 1 item with no claimQty pays 1 unit (default)', () => {
    const items = [item('i1', 800, 3)]
    const claims = [claim('i1', 'alice')]
    const billTotals = calculateTotals(items, false, false)
    const result = calculatePersonTotals(items, claims, 'alice', billTotals)
    // no claimQty → defaults to 1 unit = 800
    expect(result.personSubtotalCents).toBe(800)
    expect(result.personTotalCents).toBe(800)
  })

  it('claimant claiming 2 units of a qty>1 item pays 2× the unit price', () => {
    const items = [item('i1', 800, 5)]
    const claims = [claimWithQty('i1', 'alice', 2)]
    const billTotals = calculateTotals(items, false, false)
    const result = calculatePersonTotals(items, claims, 'alice', billTotals)
    // alice claims 2 of 5 nasi lemak at 800 each → 1600
    expect(result.personSubtotalCents).toBe(1600)
    expect(result.personTotalCents).toBe(1600)
  })

  it('two people claim different quantities of the same multi-qty item', () => {
    const items = [item('i1', 1200, 5)]
    // alice claims 3, bob claims 2 — bill subtotal = 5 * 1200 = 6000
    const claims = [claimWithQty('i1', 'alice', 3), claimWithQty('i1', 'bob', 2)]
    const billTotals = calculateTotals(items, false, false)
    const alice = calculatePersonTotals(items, claims, 'alice', billTotals)
    const bob = calculatePersonTotals(items, claims, 'bob', billTotals)
    expect(alice.personSubtotalCents).toBe(3600) // 3 × 1200
    expect(bob.personSubtotalCents).toBe(2400)   // 2 × 1200
    expect(alice.personSubtotalCents + bob.personSubtotalCents).toBe(billTotals.subtotalCents)
  })
})

// ---------------------------------------------------------------------------
// 2. Multi-claimer split — cost split per item by number of claimants
// ---------------------------------------------------------------------------

describe('calculatePersonTotals — multi-claimer split', () => {
  it('two claimants on same item each pay half (Math.round applied)', () => {
    const items = [item('i1', 1000, 1)]
    const claims = [claim('i1', 'alice'), claim('i1', 'bob')]
    const billTotals = calculateTotals(items, false, false)
    const aliceResult = calculatePersonTotals(items, claims, 'alice', billTotals)
    const bobResult = calculatePersonTotals(items, claims, 'bob', billTotals)
    // Math.round(1000 / 2) = 500 each
    expect(aliceResult.personSubtotalCents).toBe(500)
    expect(bobResult.personSubtotalCents).toBe(500)
    expect(aliceResult.personTotalCents).toBe(500)
    expect(bobResult.personTotalCents).toBe(500)
  })

  it('alice claims i1 (shared with bob) and i2 alone — correct per-item subtotal', () => {
    const claims = [
      claim('i1', 'alice'),
      claim('i1', 'bob'),
      claim('i2', 'alice'),
    ]
    const billTotals = calculateTotals(BASE_ITEMS, false, false)
    const result = calculatePersonTotals(BASE_ITEMS, claims, 'alice', billTotals)
    // Math.round(1000 / 2) + Math.round(2000 / 1) = 500 + 2000 = 2500
    expect(result.personSubtotalCents).toBe(2500)
    expect(result.personTotalCents).toBe(2500)
  })

  it('three-way split applies Math.round per item, not on aggregate', () => {
    // item: 1000 cents / 3 = 333.33... → Math.round = 333
    const items = [item('i1', 1000, 1)]
    const claims = [claim('i1', 'alice'), claim('i1', 'bob'), claim('i1', 'carol')]
    const billTotals = calculateTotals(items, false, false)
    const result = calculatePersonTotals(items, claims, 'alice', billTotals)
    expect(result.personSubtotalCents).toBe(Math.round(1000 / 3)) // 333
    expect(Number.isInteger(result.personSubtotalCents)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 3. Service charge distributed proportionally
// ---------------------------------------------------------------------------

describe('calculatePersonTotals — service charge proportional', () => {
  it('service charge is distributed in proportion to personSubtotal / billSubtotal', () => {
    const claims = [
      claim('i1', 'alice'),
      claim('i1', 'bob'),
      claim('i2', 'alice'),
    ]
    const billTotals = calculateTotals(BASE_ITEMS, false, true)
    // billTotals: subtotal=3000, SC=300, SST=0, grand=3300
    const result = calculatePersonTotals(BASE_ITEMS, claims, 'alice', billTotals)
    // alice subtotal = 2500; SC = Math.round((2500 / 3000) * 300) = Math.round(250) = 250
    expect(result.personSubtotalCents).toBe(2500)
    expect(result.personServiceChargeCents).toBe(Math.round((2500 / 3000) * 300))
    expect(result.personServiceChargeCents).toBe(250)
    expect(result.personSSTCents).toBe(0)
    expect(result.personTotalCents).toBe(2500 + 250)
  })

  it('service charge output is an integer (no floats)', () => {
    const items = [item('i1', 333, 1)]
    const claims = [claim('i1', 'alice')]
    const billTotals = calculateTotals(items, false, true)
    const result = calculatePersonTotals(items, claims, 'alice', billTotals)
    expect(Number.isInteger(result.personServiceChargeCents)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 4. SST distributed proportionally
// ---------------------------------------------------------------------------

describe('calculatePersonTotals — SST proportional', () => {
  it('SST is distributed in proportion to personSubtotal / billSubtotal', () => {
    const claims = [
      claim('i1', 'alice'),
      claim('i1', 'bob'),
      claim('i2', 'alice'),
    ]
    const billTotals = calculateTotals(BASE_ITEMS, true, false)
    // billTotals: subtotal=3000, SC=0, SST=Math.round(3000*0.06)=180, grand=3180
    const result = calculatePersonTotals(BASE_ITEMS, claims, 'alice', billTotals)
    // alice subtotal = 2500; SST = Math.round((2500 / 3000) * 180) = Math.round(150) = 150
    expect(result.personSSTCents).toBe(Math.round((2500 / 3000) * billTotals.sstCents))
    expect(result.personSSTCents).toBe(150)
    expect(result.personServiceChargeCents).toBe(0)
  })

  it('SST output is an integer (no floats)', () => {
    const items = [item('i1', 777, 1)]
    const claims = [claim('i1', 'alice')]
    const billTotals = calculateTotals(items, true, false)
    const result = calculatePersonTotals(items, claims, 'alice', billTotals)
    expect(Number.isInteger(result.personSSTCents)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 5. Both SC and SST applied — matches plan spec
// ---------------------------------------------------------------------------

describe('calculatePersonTotals — both charges', () => {
  it('both charges distributed proportionally as per plan spec', () => {
    const claims = [
      claim('i1', 'alice'),
      claim('i1', 'bob'),
      claim('i2', 'alice'),
    ]
    // billTotals per plan: subtotal=3000, SC=300, SST=Math.round(3300*0.06)=198, grand=3498
    const billTotals = calculateTotals(BASE_ITEMS, true, true)
    expect(billTotals.subtotalCents).toBe(3000)
    expect(billTotals.serviceChargeCents).toBe(300)
    expect(billTotals.sstCents).toBe(198)
    const result = calculatePersonTotals(BASE_ITEMS, claims, 'alice', billTotals)
    // alice SC = Math.round((2500 / 3000) * 300) = 250
    // alice SST = Math.round((2500 / 3000) * 198) = Math.round(165) = 165
    // alice total = 2500 + 250 + 165 = 2915
    expect(result.personSubtotalCents).toBe(2500)
    expect(result.personServiceChargeCents).toBe(250)
    expect(result.personSSTCents).toBe(165)
    expect(result.personTotalCents).toBe(2915)
  })

  it('all four output values are integers', () => {
    const claims = [claim('i1', 'alice'), claim('i2', 'alice')]
    const billTotals = calculateTotals(BASE_ITEMS, true, true)
    const result = calculatePersonTotals(BASE_ITEMS, claims, 'alice', billTotals)
    expect(Number.isInteger(result.personSubtotalCents)).toBe(true)
    expect(Number.isInteger(result.personServiceChargeCents)).toBe(true)
    expect(Number.isInteger(result.personSSTCents)).toBe(true)
    expect(Number.isInteger(result.personTotalCents)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 6. Zero billSubtotal guard (division-by-zero)
// ---------------------------------------------------------------------------

describe('calculatePersonTotals — zero bill subtotal guard', () => {
  it('returns all-zero totals when billSubtotalCents is zero', () => {
    const items = [item('i1', 0, 1)]
    const claims = [claim('i1', 'alice')]
    const billTotals = calculateTotals(items, true, true)
    // billTotals.subtotalCents === 0 → guard fires
    const result = calculatePersonTotals(items, claims, 'alice', billTotals)
    expect(result.personSubtotalCents).toBe(0)
    expect(result.personServiceChargeCents).toBe(0)
    expect(result.personSSTCents).toBe(0)
    expect(result.personTotalCents).toBe(0)
  })

  it('zero bill subtotal guard returns zeroes even with non-zero items listed', () => {
    // Simulate a billTotals with subtotalCents: 0 passed directly (edge scenario)
    const items = [item('i1', 1000, 1)]
    const claims = [claim('i1', 'alice')]
    const zeroBillTotals = { subtotalCents: 0, serviceChargeCents: 0, sstCents: 0, grandTotalCents: 0 }
    const result = calculatePersonTotals(items, claims, 'alice', zeroBillTotals)
    expect(result.personSubtotalCents).toBe(0)
    expect(result.personServiceChargeCents).toBe(0)
    expect(result.personSSTCents).toBe(0)
    expect(result.personTotalCents).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// 7. Session with no claims → all zeros
// ---------------------------------------------------------------------------

describe('calculatePersonTotals — session with no claims', () => {
  it('session that has not claimed anything returns all-zero totals', () => {
    const claims = [claim('i1', 'bob'), claim('i2', 'bob')]
    const billTotals = calculateTotals(BASE_ITEMS, false, false)
    const result = calculatePersonTotals(BASE_ITEMS, claims, 'alice', billTotals)
    expect(result.personSubtotalCents).toBe(0)
    expect(result.personServiceChargeCents).toBe(0)
    expect(result.personSSTCents).toBe(0)
    expect(result.personTotalCents).toBe(0)
  })

  it('empty claims array returns all-zero totals', () => {
    const billTotals = calculateTotals(BASE_ITEMS, false, false)
    const result = calculatePersonTotals(BASE_ITEMS, [], 'alice', billTotals)
    expect(result.personSubtotalCents).toBe(0)
    expect(result.personServiceChargeCents).toBe(0)
    expect(result.personSSTCents).toBe(0)
    expect(result.personTotalCents).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// 8. Unclaimed items contribute zero to the claimer's subtotal
// ---------------------------------------------------------------------------

describe('calculatePersonTotals — unclaimed items excluded', () => {
  it('items not in any claim record contribute zero to personSubtotalCents', () => {
    // alice only claims i1; i2 has no claims at all
    const claims = [claim('i1', 'alice')]
    const billTotals = calculateTotals(BASE_ITEMS, false, false)
    const result = calculatePersonTotals(BASE_ITEMS, claims, 'alice', billTotals)
    // alice subtotal = full i1 cost (sole claimer); i2 excluded
    expect(result.personSubtotalCents).toBe(1000)
    expect(result.personTotalCents).toBe(1000)
  })

  it('multiple unclaimed items do not affect any session\'s subtotal', () => {
    // only i1 is claimed; i2, i3 unclaimed
    const items = [item('i1', 500, 2), item('i2', 1000, 1), item('i3', 750, 1)]
    const claims = [claim('i1', 'alice')]
    const billTotals = calculateTotals(items, false, false)
    const result = calculatePersonTotals(items, claims, 'alice', billTotals)
    // alice sole claimer of i1 (qty=2): pays 1 unit = 500
    expect(result.personSubtotalCents).toBe(500)
  })
})

// ---------------------------------------------------------------------------
// 9. Proportional distribution sums to bill total (when all items claimed)
// ---------------------------------------------------------------------------

describe('calculatePersonTotals — alice + bob sum equals bill total (no rounding gap)', () => {
  it('when all items claimed, alice and bob person totals differ from bill grand total only by rounding', () => {
    // alice: i1 sole, i2 shared with bob
    // bob: i2 shared with alice, i3 sole
    const items = [item('i1', 1000, 1), item('i2', 2000, 1), item('i3', 500, 1)]
    const claims = [
      claim('i1', 'alice'),
      claim('i2', 'alice'),
      claim('i2', 'bob'),
      claim('i3', 'bob'),
    ]
    const billTotals = calculateTotals(items, true, true)
    const alice = calculatePersonTotals(items, claims, 'alice', billTotals)
    const bob = calculatePersonTotals(items, claims, 'bob', billTotals)
    // alice subtotal = 1000 + Math.round(2000/2) = 1000 + 1000 = 2000
    // bob subtotal = Math.round(2000/2) + 500 = 1000 + 500 = 1500
    expect(alice.personSubtotalCents).toBe(2000)
    expect(bob.personSubtotalCents).toBe(1500)
    // Combined person totals should be within 2 cents of bill grand total (rounding tolerance)
    const combined = alice.personTotalCents + bob.personTotalCents
    expect(Math.abs(combined - billTotals.grandTotalCents)).toBeLessThanOrEqual(2)
  })
})

// ---------------------------------------------------------------------------
// 10. Rounding adjustment distribution (RED — function not yet extended)
// ---------------------------------------------------------------------------

describe('calculatePersonTotals — rounding adjustment distribution', () => {
  it('T-ADJ-01: zero adjustment leaves personTotalCents unchanged and personRoundingAdjustmentCents is 0', () => {
    // Same inputs as "both charges" test; 5th arg = 0 (explicit zero)
    const claims = [
      claim('i1', 'alice'),
      claim('i1', 'bob'),
      claim('i2', 'alice'),
    ]
    const billTotals = calculateTotals(BASE_ITEMS, true, true)
    const result = calculatePersonTotals(BASE_ITEMS, claims, 'alice', billTotals, 0)
    // personRoundingAdjustmentCents must be 0 (zero adjustment)
    expect(result.personRoundingAdjustmentCents).toBe(0)
    // personTotalCents must be unchanged from the non-adjustment version
    expect(result.personTotalCents).toBe(result.personSubtotalCents + result.personServiceChargeCents + result.personSSTCents)
  })

  it('T-ADJ-02: positive adjustment distributed proportionally (alice 2500/3000, adj=+6)', () => {
    // i1: 2500 cents claimed by alice; i2: 500 cents claimed by bob; subtotal = 3000
    const i1 = item('i1', 2500, 1)
    const i2 = item('i2', 500, 1)
    const testItems = [i1, i2]
    const testClaims = [claim('i1', 'alice'), claim('i2', 'bob')]
    const billTotals = calculateTotals(testItems, false, false)
    const result = calculatePersonTotals(testItems, testClaims, 'alice', billTotals, 6)
    // alice ratio = 2500/3000; personRoundingAdjustmentCents = Math.round((2500/3000) * 6) = 5
    expect(result.personRoundingAdjustmentCents).toBe(Math.round((2500 / 3000) * 6))
    expect(result.personRoundingAdjustmentCents).toBe(5)
  })

  it('T-ADJ-03: negative adjustment reduces personTotalCents (adj=-3)', () => {
    const i1 = item('i1', 2500, 1)
    const i2 = item('i2', 500, 1)
    const testItems = [i1, i2]
    const testClaims = [claim('i1', 'alice'), claim('i2', 'bob')]
    const billTotals = calculateTotals(testItems, false, false)
    const result = calculatePersonTotals(testItems, testClaims, 'alice', billTotals, -3)
    // alice ratio = 2500/3000; personRoundingAdjustmentCents = Math.round((2500/3000) * -3) = -2
    expect(result.personRoundingAdjustmentCents).toBe(Math.round((2500 / 3000) * -3))
    expect(result.personRoundingAdjustmentCents).toBe(-2)
    // personTotalCents includes the negative adjustment
    expect(result.personTotalCents).toBe(
      result.personSubtotalCents + result.personServiceChargeCents + result.personSSTCents + (-2)
    )
  })

  it('T-ADJ-04: single person claims all items — gets full adjustment (ratio = 1.0, adj=+7)', () => {
    // alice claims everything in BASE_ITEMS; ratio = 1.0
    const claims = [claim('i1', 'alice'), claim('i2', 'alice')]
    const billTotals = calculateTotals(BASE_ITEMS, false, false)
    const result = calculatePersonTotals(BASE_ITEMS, claims, 'alice', billTotals, 7)
    // ratio = 3000/3000 = 1.0; personRoundingAdjustmentCents = Math.round(1.0 * 7) = 7
    expect(result.personRoundingAdjustmentCents).toBe(7)
  })

  it('T-ADJ-05: zero billSubtotalCents fires zero guard — personRoundingAdjustmentCents is 0', () => {
    const testItems = [item('i1', 1000, 1)]
    const testClaims = [claim('i1', 'alice')]
    const zeroBillTotals = {
      subtotalCents: 0,
      serviceChargeCents: 0,
      sstCents: 0,
      grandTotalCents: 0,
      roundingAdjustmentCents: 0,
    }
    const result = calculatePersonTotals(testItems, testClaims, 'alice', zeroBillTotals, 5)
    expect(result.personRoundingAdjustmentCents).toBe(0)
  })

  it('T-ADJ-06: result is always an integer (3-way split of adj=1)', () => {
    // billTotals.subtotalCents = 3000; alice subtotal = 1000 (1/3)
    // personRoundingAdjustmentCents = Math.round(1000/3000 * 1) = Math.round(0.333) = 0
    const i1 = item('i1', 1000, 1)
    const i2 = item('i2', 1000, 1)
    const i3 = item('i3', 1000, 1)
    const testItems = [i1, i2, i3]
    const testClaims = [claim('i1', 'alice'), claim('i2', 'bob'), claim('i3', 'carol')]
    const billTotals = calculateTotals(testItems, false, false)
    const result = calculatePersonTotals(testItems, testClaims, 'alice', billTotals, 1)
    expect(Number.isInteger(result.personRoundingAdjustmentCents)).toBe(true)
    expect(result.personRoundingAdjustmentCents).toBe(Math.round(1000 / 3000 * 1))
    expect(result.personRoundingAdjustmentCents).toBe(0)
  })

  it('T-ADJ-07: absent 5th argument defaults to 0 — same result as explicit 0', () => {
    const claims = [claim('i1', 'alice'), claim('i2', 'alice')]
    const billTotals = calculateTotals(BASE_ITEMS, false, false)
    const withZero = calculatePersonTotals(BASE_ITEMS, claims, 'alice', billTotals, 0)
    const withoutArg = calculatePersonTotals(BASE_ITEMS, claims, 'alice', billTotals)
    expect(withoutArg.personRoundingAdjustmentCents).toBe(0)
    expect(withoutArg.personTotalCents).toBe(withZero.personTotalCents)
  })
})
