/**
 * DemoChit component behavioral tests (LAND-01).
 *
 * Verifies the demo chit on the landing page renders the correct kopitiam
 * items, grand total, SETTLE stamp, bill code, and quantity suffix.
 *
 * DEMO_ITEMS:
 *   Mee Goreng Mamak   RM8.00  (qty 1)
 *   Teh Tarik          RM3.00  (qty 1)
 *   Roti Canai         RM2.50  (qty 1)
 *   Nasi Lemak Biasa   RM10.00 (qty 2, price 500 cents each)
 *   Grand total: 800+300+250+1000 = 2350 cents = RM23.50
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DemoChit } from '@/components/DemoChit'

describe('DemoChit', () => {
  it('renders "Mee Goreng Mamak" item', () => {
    render(<DemoChit />)
    expect(screen.getByText('Mee Goreng Mamak')).toBeInTheDocument()
  })

  it('renders "Teh Tarik" item', () => {
    render(<DemoChit />)
    expect(screen.getByText('Teh Tarik')).toBeInTheDocument()
  })

  it('renders "Roti Canai" item', () => {
    render(<DemoChit />)
    expect(screen.getByText('Roti Canai')).toBeInTheDocument()
  })

  it('renders "Nasi Lemak Biasa" item', () => {
    render(<DemoChit />)
    expect(screen.getByText(/Nasi Lemak Biasa/)).toBeInTheDocument()
  })

  it('grand total displays "RM23.50"', () => {
    render(<DemoChit />)
    expect(screen.getByText('RM23.50')).toBeInTheDocument()
  })

  it('"GRAND TOTAL" label is visible', () => {
    render(<DemoChit />)
    expect(screen.getByText('GRAND TOTAL')).toBeInTheDocument()
  })

  it('"SETTLE" stamp text is visible (pre-landed stamp on demo chit)', () => {
    render(<DemoChit />)
    expect(screen.getByText('SETTLE')).toBeInTheDocument()
  })

  it('"#TT-DEMO" bill code header is visible', () => {
    render(<DemoChit />)
    expect(screen.getByText('#TT-DEMO')).toBeInTheDocument()
  })

  it('"x2" quantity suffix is visible for Nasi Lemak Biasa (quantity=2)', () => {
    render(<DemoChit />)
    // The quantity span renders "x{quantity}" for items with qty > 1
    expect(screen.getByText('x2')).toBeInTheDocument()
  })

  it('only one item has a quantity suffix (only Nasi Lemak Biasa has qty > 1)', () => {
    const { container } = render(<DemoChit />)
    // The quantity suffix spans have opacity-60 and ml-1 text-xs classes from the impl
    // We check no "x1" suffix appears (qty===1 items have no suffix rendered)
    const allText = container.textContent ?? ''
    expect(allText).not.toContain('x1')
  })
})
