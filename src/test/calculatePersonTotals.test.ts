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

  it('sole claimer with qty > 1 pays price * quantity', () => {
    const items = [item('i1', 800, 3)]
    const claims = [claim('i1', 'alice')]
    const billTotals = calculateTotals(items, false, false)
    const result = calculatePersonTotals(items, claims, 'alice', billTotals)
    // alice sole claimer: Math.round(800 * 3 / 1) = 2400
    expect(result.personSubtotalCents).toBe(2400)
    expect(result.personTotalCents).toBe(2400)
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
    // alice sole claimer of i1: Math.round(500 * 2 / 1) = 1000
    expect(result.personSubtotalCents).toBe(1000)
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
