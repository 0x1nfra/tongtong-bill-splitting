/**
 * SettleStamp component behavioral tests.
 *
 * Status-to-render mapping from implementation:
 *   null     → renders nothing
 *   rejected → renders nothing
 *   pending  → stamp at opacity-50, text "AWAITING CONFIRMATION"
 *   settled  → stamp at full opacity, text "HAVE A GOOD ONE!" in --color-pen (blue, not red)
 *
 * Animation guard (D-05):
 *   Mount with status="settled" → NO animation (prevStatusRef init'd to current prop)
 *   Transition pending→settled → animation fires (isAnimating=true, aria-busy="true")
 */

import { describe, it, expect } from 'vitest'
import { render, screen, act } from '@testing-library/react'
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

describe('SettleStamp — animation guard (D-05)', () => {
  it('mount with status="settled" does NOT animate (no animate-stamp-land class on stamp container)', () => {
    // D-05: prevStatusRef is init'd to current prop, so prev===status on first effect run
    // → condition (status==="settled" && prev!=="settled") is false → isAnimating stays false
    const { container } = render(<SettleStamp status="settled" />)
    // The inner stamp div is the one that receives animate-stamp-land
    const stampInner = container.querySelector('.border-stamp')
    expect(stampInner).not.toBeNull()
    expect(stampInner?.className).not.toContain('animate-stamp-land')
  })

  it('mount with status="settled" does NOT set aria-busy (no animation on direct mount)', () => {
    // aria-busy is on the outer div; React omits boolean false attribute from DOM
    const { container } = render(<SettleStamp status="settled" />)
    const outerDiv = container.firstChild as HTMLElement
    expect(outerDiv).not.toBeNull()
    // aria-busy should be "false" or absent — not "true"
    expect(outerDiv.getAttribute('aria-busy')).not.toBe('true')
  })

  it('transition from "pending" to "settled" sets aria-busy="true" (animation fires)', () => {
    // This is the real thwack path: prevStatusRef="pending", status becomes "settled"
    // → isAnimating=true → aria-busy="true"
    const { rerender, container } = render(<SettleStamp status="pending" />)
    act(() => {
      rerender(<SettleStamp status="settled" />)
    })
    const outerDiv = container.firstChild as HTMLElement
    expect(outerDiv).not.toBeNull()
    expect(outerDiv.getAttribute('aria-busy')).toBe('true')
  })

  it('transition from "pending" to "settled" adds animate-stamp-land class to stamp container', () => {
    const { rerender, container } = render(<SettleStamp status="pending" />)
    act(() => {
      rerender(<SettleStamp status="settled" />)
    })
    const stampInner = container.querySelector('.border-stamp')
    expect(stampInner).not.toBeNull()
    expect(stampInner?.className).toContain('animate-stamp-land')
  })
})
