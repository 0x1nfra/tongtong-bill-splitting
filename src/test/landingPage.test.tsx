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
  it('"tongtong" text is visible in the h1 heading', () => {
    render(<Home />)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toBeInTheDocument()
    expect(heading.textContent).toContain('tongtong')
  })

  it('the red period "." inside h1 has text-stamp class', () => {
    const { container } = render(<Home />)
    const h1 = container.querySelector('h1')
    expect(h1).not.toBeNull()
    const span = h1?.querySelector('span')
    expect(span).not.toBeNull()
    expect(span?.className).toContain('text-stamp')
    expect(span?.textContent).toBe('.')
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
