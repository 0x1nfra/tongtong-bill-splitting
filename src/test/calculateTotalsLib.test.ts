/**
 * Behavioral tests for the shared calculateTotals utility at @/lib/calculateTotals.
 *
 * This tests the ACTUAL exported function — not a local replica.
 * Price is integer RM cents (no string parsing). All outputs are RM cents.
 * Service charge (10%) is applied before SST (6%) — Malaysian restaurant convention.
 */

import { describe, it, expect } from 'vitest'
import { calculateTotals } from '@/lib/calculateTotals'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function item(price: number, quantity: number) {
  return { price, quantity }
}

// ---------------------------------------------------------------------------
// 1. Basic subtotal: sum of price × quantity
// ---------------------------------------------------------------------------

describe('calculateTotals — subtotal', () => {
  it('subtotalCents equals the sum of each item price multiplied by its quantity', () => {
    // 1200 * 2 = 2400; 500 * 1 = 500 → total 2900
    const result = calculateTotals(
      [item(1200, 2), item(500, 1)],
      false,
      false
    )
    expect(result.subtotalCents).toBe(2900)
  })

  it('multi-item: three items are all summed correctly', () => {
    // 1000 * 3 = 3000; 250 * 2 = 500; 750 * 1 = 750 → total 4250
    const result = calculateTotals(
      [item(1000, 3), item(250, 2), item(750, 1)],
      false,
      false
    )
    expect(result.subtotalCents).toBe(4250)
  })

  it('quantity multiplier scales price correctly (4 × 500 cents = 2000)', () => {
    const result = calculateTotals([item(500, 4)], false, false)
    expect(result.subtotalCents).toBe(2000)
  })
})

// ---------------------------------------------------------------------------
// 2. No charges: grandTotalCents === subtotalCents
// ---------------------------------------------------------------------------

describe('calculateTotals — no charges', () => {
  it('both charges off: grandTotalCents equals subtotalCents exactly', () => {
    const result = calculateTotals([item(1000, 1)], false, false)
    expect(result.serviceChargeCents).toBe(0)
    expect(result.sstCents).toBe(0)
    expect(result.grandTotalCents).toBe(result.subtotalCents)
    expect(result.grandTotalCents).toBe(1000)
  })
})

// ---------------------------------------------------------------------------
// 3. Service charge only: 10% of subtotal
// ---------------------------------------------------------------------------

describe('calculateTotals — service charge only', () => {
  it('service charge is 10% of subtotalCents and SST remains zero', () => {
    // subtotal = 10000 cents; SC = 1000; SST = 0; grand = 11000
    const result = calculateTotals([item(10000, 1)], false, true)
    expect(result.subtotalCents).toBe(10000)
    expect(result.serviceChargeCents).toBe(1000)
    expect(result.sstCents).toBe(0)
    expect(result.grandTotalCents).toBe(11000)
  })
})

// ---------------------------------------------------------------------------
// 4. SST only: 6% of subtotal (no service charge applied first)
// ---------------------------------------------------------------------------

describe('calculateTotals — SST only', () => {
  it('SST is 6% of subtotalCents when service charge is off', () => {
    // subtotal = 10000; SC = 0; afterSC = 10000; SST = 600; grand = 10600
    const result = calculateTotals([item(10000, 1)], true, false)
    expect(result.subtotalCents).toBe(10000)
    expect(result.serviceChargeCents).toBe(0)
    expect(result.sstCents).toBe(600)
    expect(result.grandTotalCents).toBe(10600)
  })
})

// ---------------------------------------------------------------------------
// 5. Both charges: SC first, then SST on post-SC total
// ---------------------------------------------------------------------------

describe('calculateTotals — both charges (ordering matters)', () => {
  it('SST is computed on post-service-charge total, not on subtotal alone', () => {
    // subtotal = 10000; SC = 1000; afterSC = 11000; SST = 660; grand = 11660
    const result = calculateTotals([item(10000, 1)], true, true)
    expect(result.subtotalCents).toBe(10000)
    expect(result.serviceChargeCents).toBe(1000)
    expect(result.sstCents).toBe(660) // 11000 * 0.06 = 660, not 600
    expect(result.grandTotalCents).toBe(11660)
  })

  it('grand total with both charges is larger than with SST-only (proves SC is included in SST base)', () => {
    const both = calculateTotals([item(20000, 1)], true, true)
    const sstOnly = calculateTotals([item(20000, 1)], true, false)
    expect(both.grandTotalCents).toBeGreaterThan(sstOnly.grandTotalCents)
  })
})

// ---------------------------------------------------------------------------
// 6. Empty array: all outputs are zero
// ---------------------------------------------------------------------------

describe('calculateTotals — empty items array', () => {
  it('all four output values are zero when no items are provided', () => {
    const result = calculateTotals([], true, true)
    expect(result.subtotalCents).toBe(0)
    expect(result.serviceChargeCents).toBe(0)
    expect(result.sstCents).toBe(0)
    expect(result.grandTotalCents).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// 7. Zero-price item: all outputs are zero
// ---------------------------------------------------------------------------

describe('calculateTotals — zero-price item', () => {
  it('item with price 0 cents and any quantity produces all-zero totals', () => {
    const result = calculateTotals([item(0, 5)], true, true)
    expect(result.subtotalCents).toBe(0)
    expect(result.serviceChargeCents).toBe(0)
    expect(result.sstCents).toBe(0)
    expect(result.grandTotalCents).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// 8. Math.round applied correctly to percentage calculations (fractional cents)
// ---------------------------------------------------------------------------

describe('calculateTotals — Math.round on percentage outputs', () => {
  it('service charge rounds half-cent fractions to nearest integer cent', () => {
    // subtotal = 5 cents; SC = Math.round(5 * 0.1) = Math.round(0.5) = 1
    const result = calculateTotals([item(5, 1)], false, true)
    expect(result.serviceChargeCents).toBe(Math.round(5 * 0.1))
    expect(Number.isInteger(result.serviceChargeCents)).toBe(true)
  })

  it('SST rounds fractional cent results to nearest integer cent', () => {
    // subtotal = 7 cents (no SC); SST = Math.round(7 * 0.06) = Math.round(0.42) = 0
    const result = calculateTotals([item(7, 1)], true, false)
    expect(result.sstCents).toBe(Math.round(7 * 0.06))
    expect(Number.isInteger(result.sstCents)).toBe(true)
  })

  it('both charges rounded: verifies exact Math.round behavior on non-round inputs', () => {
    // subtotal = 333 cents; SC = Math.round(33.3) = 33; afterSC = 366; SST = Math.round(21.96) = 22
    const result = calculateTotals([item(333, 1)], true, true)
    expect(result.serviceChargeCents).toBe(Math.round(333 * 0.1))    // 33
    const afterSC = 333 + Math.round(333 * 0.1)                       // 366
    expect(result.sstCents).toBe(Math.round(afterSC * 0.06))          // 22
    expect(result.grandTotalCents).toBe(afterSC + Math.round(afterSC * 0.06)) // 388
  })
})
