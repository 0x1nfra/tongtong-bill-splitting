/**
 * BILL TOTAL rounding adj row — data prerequisite smoke tests.
 * Verifies that calculateTotals returns roundingAdjustmentCents in its output shape.
 * These tests already pass; they document the data contract that the BILL TOTAL
 * rounding adj row UI insertion in 07-03 depends on.
 */

import { describe, it, expect } from 'vitest'
import { calculateTotals } from '@/lib/calculateTotals'

describe('BILL TOTAL rounding adj row — data prerequisite', () => {
  it('positive adjustment passthrough: roundingAdjustmentCents of 7 → 7', () => {
    const result = calculateTotals([{ price: 1000, quantity: 1 }], false, false, 7)
    expect(result.roundingAdjustmentCents).toBe(7)
  })

  it('zero adjustment: roundingAdjustmentCents of 0 → 0', () => {
    const result = calculateTotals([{ price: 1000, quantity: 1 }], false, false, 0)
    expect(result.roundingAdjustmentCents).toBe(0)
  })

  it('negative adjustment: roundingAdjustmentCents of -5 → -5', () => {
    const result = calculateTotals([{ price: 1000, quantity: 1 }], false, false, -5)
    expect(result.roundingAdjustmentCents).toBe(-5)
  })
})
