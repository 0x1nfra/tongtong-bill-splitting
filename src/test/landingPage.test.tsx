/**
 * Landing page (Home) behavioral tests (UI-08).
 *
 * Verifies the logotype, taglines, DemoChit presence, and CTA link
 * on the landing page.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Home from '@/app/page'

describe('Landing page — logotype and content (UI-08)', () => {
  it('tongtong. logotype SVG is visible', () => {
    render(<Home />)
    const svg = screen.getByRole('img', { name: 'tongtong.' })
    expect(svg).toBeInTheDocument()
  })

  it('the red period "." in the logotype SVG has fill="#B91C1C"', () => {
    const { container } = render(<Home />)
    const redPeriod = container.querySelector('tspan[fill="#B91C1C"]')
    expect(redPeriod).not.toBeNull()
    expect(redPeriod?.textContent).toBe('.')
  })

  it('"A CHIT FOR EVERYONE" tagline is visible', () => {
    render(<Home />)
    expect(screen.getByText('A CHIT FOR EVERYONE')).toBeInTheDocument()
  })

  it('"SPLIT THE BILL, NOT THE FRIENDSHIP." tagline is visible', () => {
    render(<Home />)
    expect(screen.getByText('SPLIT THE BILL, NOT THE FRIENDSHIP.')).toBeInTheDocument()
  })

  it('"START NEW BILL" CTA is visible', () => {
    render(<Home />)
    expect(screen.getByText('START NEW BILL')).toBeInTheDocument()
  })

  it('"START NEW BILL" links to "/create"', () => {
    render(<Home />)
    // next/link renders as <a> in jsdom
    const link = screen.getByText('START NEW BILL').closest('a')
    expect(link).not.toBeNull()
    expect(link?.getAttribute('href')).toBe('/create')
  })
})

describe('Landing page — benefits and how-it-works sections (Phase 5)', () => {
  it('benefits section renders 3 benefit rows', () => {
    render(<Home />)
    expect(screen.getByText(/No more chasing/i)).toBeInTheDocument()
    expect(screen.getByText(/See your exact share/i)).toBeInTheDocument()
    expect(screen.getByText(/DuitNow QR/i)).toBeInTheDocument()
  })

  it('how-it-works section renders 3 numbered steps', () => {
    const { container } = render(<Home />)
    const text = container.textContent ?? ''
    expect(text).toContain('01.')
    expect(text).toContain('02.')
    expect(text).toContain('03.')
  })

  it('DemoChit appears before benefits section in DOM order', () => {
    const { container } = render(<Home />)
    const text = container.textContent ?? ''
    const grandTotalPos = text.indexOf('GRAND TOTAL')
    const whyTongtongPos = text.indexOf('WHY TONGTONG')
    expect(grandTotalPos).toBeGreaterThan(-1)
    expect(whyTongtongPos).toBeGreaterThan(-1)
    expect(grandTotalPos).toBeLessThan(whyTongtongPos)
  })

  it('START NEW BILL CTA appears after how-it-works in DOM order', () => {
    const { container } = render(<Home />)
    const text = container.textContent ?? ''
    const howItWorksPos = text.indexOf('HOW IT WORKS')
    const startNewBillPos = text.lastIndexOf('START NEW BILL')
    expect(howItWorksPos).toBeGreaterThan(-1)
    expect(startNewBillPos).toBeGreaterThan(-1)
    expect(howItWorksPos).toBeLessThan(startNewBillPos)
  })
})
