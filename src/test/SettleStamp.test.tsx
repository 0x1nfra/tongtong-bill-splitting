/**
 * SettleStamp component behavioral tests.
 *
 * Status-to-render mapping from implementation:
 *   null     → renders nothing
 *   rejected → renders nothing
 *   pending  → stamp at opacity-50, text "AWAITING CONFIRMATION"
 *   settled  → stamp at full opacity, text "HAVE A GOOD ONE!" in --color-pen (blue, not red)
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SettleStamp } from '@/components/SettleStamp'

describe('SettleStamp', () => {
  it('null status renders nothing (null DOM)', () => {
    const { container } = render(<SettleStamp status={null} />)
    expect(container.firstChild).toBeNull()
  })

  it('"rejected" status renders nothing (null DOM)', () => {
    const { container } = render(<SettleStamp status="rejected" />)
    expect(container.firstChild).toBeNull()
  })

  it('"pending" status: stamp wrapper has opacity-50 class', () => {
    const { container } = render(<SettleStamp status="pending" />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).not.toBeNull()
    expect(wrapper.className).toContain('opacity-50')
  })

  it('"pending" status: renders "AWAITING CONFIRMATION" text', () => {
    render(<SettleStamp status="pending" />)
    expect(screen.getByText('AWAITING CONFIRMATION')).toBeInTheDocument()
  })

  it('"pending" status: renders "SETTLE" stamp text', () => {
    render(<SettleStamp status="pending" />)
    expect(screen.getByText('SETTLE')).toBeInTheDocument()
  })

  it('"settled" status: wrapper does NOT have opacity-50 (full opacity)', () => {
    const { container } = render(<SettleStamp status="settled" />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).not.toBeNull()
    expect(wrapper.className).not.toContain('opacity-50')
  })

  it('"settled" status: renders "HAVE A GOOD ONE!" text', () => {
    render(<SettleStamp status="settled" />)
    expect(screen.getByText('HAVE A GOOD ONE!')).toBeInTheDocument()
  })

  it('"settled" status: "HAVE A GOOD ONE!" uses --color-pen class (blue, not red stamp)', () => {
    const { container } = render(<SettleStamp status="settled" />)
    // Find the paragraph that contains "HAVE A GOOD ONE!"
    const para = container.querySelector('p')
    expect(para).toBeInTheDocument()
    expect(para?.className).toContain('text-pen')
    expect(para?.className).not.toContain('text-stamp')
  })

  it('"settled" status: renders "SETTLE" stamp text', () => {
    render(<SettleStamp status="settled" />)
    expect(screen.getByText('SETTLE')).toBeInTheDocument()
  })
})
