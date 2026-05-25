/**
 * ProgressBar component behavioral tests.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProgressBar } from '@/components/ProgressBar'

describe('ProgressBar', () => {
  it('renders "TOTAL COLLECTED" label', () => {
    render(<ProgressBar collectedCents={0} totalCents={1000} />)
    expect(screen.getByText('TOTAL COLLECTED')).toBeInTheDocument()
  })

  it('fill width is (collectedCents / totalCents) * 100% when within bounds', () => {
    const { container } = render(<ProgressBar collectedCents={500} totalCents={1000} />)
    // The fill div is the second div inside the track div
    const fillDiv = container.querySelector('.bg-pen')
    expect(fillDiv).toBeInTheDocument()
    expect(fillDiv).toHaveStyle({ width: '50%' })
  })

  it('fill width is 0% when collectedCents is 0', () => {
    const { container } = render(<ProgressBar collectedCents={0} totalCents={1000} />)
    const fillDiv = container.querySelector('.bg-pen')
    expect(fillDiv).toHaveStyle({ width: '0%' })
  })

  it('fill width is capped at 100% when collectedCents exceeds totalCents', () => {
    const { container } = render(<ProgressBar collectedCents={2000} totalCents={1000} />)
    const fillDiv = container.querySelector('.bg-pen')
    expect(fillDiv).toHaveStyle({ width: '100%' })
  })

  it('fill width is 0% when totalCents is 0 (avoids division by zero)', () => {
    const { container } = render(<ProgressBar collectedCents={0} totalCents={0} />)
    const fillDiv = container.querySelector('.bg-pen')
    expect(fillDiv).toHaveStyle({ width: '0%' })
  })

  it('displays RM amounts in X.XX format', () => {
    render(<ProgressBar collectedCents={750} totalCents={1500} />)
    expect(screen.getByText('RM7.50 / RM15.00')).toBeInTheDocument()
  })

  it('displays whole-cent amounts correctly', () => {
    render(<ProgressBar collectedCents={100} totalCents={100} />)
    expect(screen.getByText('RM1.00 / RM1.00')).toBeInTheDocument()
  })
})
