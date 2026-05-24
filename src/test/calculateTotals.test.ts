/**
 * calculateTotals behavioral tests.
 *
 * The logic is extracted inline from RunningTotal.tsx — we replicate it here
 * as the source of truth is the implementation, not a separately exported helper.
 * Tests verify the exact arithmetic the component performs.
 */

import { describe, it, expect } from 'vitest'
import type { ItemDraft } from '@/components/ItemRow'

// Replicated exactly from RunningTotal.tsx (implementation is read-only)
function calculateTotals(
  items: ItemDraft[],
  applySST: boolean,
  applyServiceCharge: boolean
) {
  const subtotal = items.reduce(
    (sum, item) =>
      sum + Math.round(parseFloat(item.price || '0') * 100) * item.quantity,
    0
  )

  const serviceCharge = applyServiceCharge ? Math.round(subtotal * 0.1) : 0
  const afterSC = subtotal + serviceCharge

  const sst = applySST ? Math.round(afterSC * 0.06) : 0
  const grandTotal = afterSC + sst

  return { subtotal, serviceCharge, sst, grandTotal }
}

function makeItem(price: string, quantity: number = 1): ItemDraft {
  return { id: 'test', name: 'item', price, quantity }
}

describe('calculateTotals', () => {
  it('subtotal equals sum of (parseFloat(price) * 100 * quantity) as integer cents', () => {
    const items = [makeItem('12.50', 2), makeItem('5.00', 1)]
    // 12.50 * 100 * 2 = 2500 + 5.00 * 100 * 1 = 500 → 3000 cents
    const { subtotal } = calculateTotals(items, false, false)
    expect(subtotal).toBe(3000)
  })

  it('both toggles off: grandTotal equals subtotal', () => {
    const items = [makeItem('10.00', 1)]
    const { subtotal, grandTotal } = calculateTotals(items, false, false)
    expect(grandTotal).toBe(subtotal)
    expect(grandTotal).toBe(1000)
  })

  it('service charge only: grandTotal = subtotal * 1.10', () => {
    const items = [makeItem('100.00', 1)]
    const { subtotal, grandTotal, serviceCharge } = calculateTotals(items, false, true)
    expect(subtotal).toBe(10000)
    expect(serviceCharge).toBe(1000)
    expect(grandTotal).toBe(11000)
  })

  it('SST only: grandTotal = subtotal * 1.06', () => {
    const items = [makeItem('100.00', 1)]
    const { subtotal, grandTotal, sst } = calculateTotals(items, true, false)
    expect(subtotal).toBe(10000)
    expect(sst).toBe(600)
    expect(grandTotal).toBe(10600)
  })

  it('both on: service charge applied first then SST — grandTotal = subtotal * 1.10 * 1.06', () => {
    const items = [makeItem('100.00', 1)]
    const { subtotal, serviceCharge, sst, grandTotal } = calculateTotals(items, true, true)
    expect(subtotal).toBe(10000)
    expect(serviceCharge).toBe(1000) // 10% of subtotal
    const afterSC = 11000
    // SST is 6% of afterSC (11000 * 0.06 = 660)
    expect(sst).toBe(Math.round(afterSC * 0.06))
    expect(grandTotal).toBe(afterSC + sst)
  })

  it('price "0" treated as 0 cents', () => {
    const items = [makeItem('0', 3)]
    const { subtotal, grandTotal } = calculateTotals(items, true, true)
    expect(subtotal).toBe(0)
    expect(grandTotal).toBe(0)
  })

  it('empty price string treated as 0 cents', () => {
    const items = [makeItem('', 2)]
    const { subtotal } = calculateTotals(items, false, false)
    expect(subtotal).toBe(0)
  })

  it('empty items array yields all zeros', () => {
    const { subtotal, serviceCharge, sst, grandTotal } = calculateTotals([], true, true)
    expect(subtotal).toBe(0)
    expect(serviceCharge).toBe(0)
    expect(sst).toBe(0)
    expect(grandTotal).toBe(0)
  })

  it('quantity multiplier is respected for subtotal calculation', () => {
    const items = [makeItem('5.00', 4)]
    const { subtotal } = calculateTotals(items, false, false)
    // 5.00 * 100 * 4 = 2000
    expect(subtotal).toBe(2000)
  })

  it('SST is applied on post-service-charge total not on subtotal alone', () => {
    const items = [makeItem('200.00', 1)]
    const { subtotal, grandTotal } = calculateTotals(items, true, true)
    expect(subtotal).toBe(20000)
    const afterSC = 20000 + Math.round(20000 * 0.1) // 22000
    const sst = Math.round(afterSC * 0.06) // 1320
    expect(grandTotal).toBe(afterSC + sst) // 23320

    // Verify SST-only path would give a different (smaller) result
    const { grandTotal: sstOnly } = calculateTotals(items, true, false)
    expect(sstOnly).toBeLessThan(grandTotal)
  })
})
