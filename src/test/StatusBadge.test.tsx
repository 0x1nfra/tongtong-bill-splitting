/**
 * StatusBadge component behavioral tests.
 *
 * UI-SPEC constraint: red (--color-stamp) is ONLY permitted for "UNCLAIMED ❋".
 * All other statuses must NOT use red.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusBadge } from '@/components/StatusBadge'
import type { StatusValue } from '@/components/StatusBadge'

describe('StatusBadge', () => {
  it('"UNCLAIMED ❋" renders with --color-stamp class (the only permitted red)', () => {
    const { container } = render(<StatusBadge status="UNCLAIMED ❋" />)
    const badge = container.querySelector('span')
    expect(badge).toBeInTheDocument()
    expect(badge?.className).toContain('text-stamp')
  })

  it('"UNCLAIMED ❋" does NOT use --color-ink class', () => {
    const { container } = render(<StatusBadge status="UNCLAIMED ❋" />)
    const badge = container.querySelector('span')
    // Should not have the ink class in addition to stamp
    expect(badge?.className).not.toContain('text-ink')
  })

  it('"N/A" renders with text-ink-muted class', () => {
    const { container } = render(<StatusBadge status="N/A" />)
    const badge = container.querySelector('span')
    expect(badge?.className).toContain('text-ink-muted')
  })

  it('"N/A" does NOT use --color-stamp (red forbidden for N/A)', () => {
    const { container } = render(<StatusBadge status="N/A" />)
    const badge = container.querySelector('span')
    expect(badge?.className).not.toContain('--color-stamp')
  })

  it('"CONFIRMED" renders with --color-ink class (no red, no blue stamp)', () => {
    const { container } = render(<StatusBadge status="CONFIRMED" />)
    const badge = container.querySelector('span')
    expect(badge?.className).toContain('text-ink')
    expect(badge?.className).not.toContain('--color-stamp')
    expect(badge?.className).not.toContain('text-ink-muted')
  })

  it('"AWAITING" renders with --color-ink class (no red)', () => {
    const { container } = render(<StatusBadge status="AWAITING" />)
    const badge = container.querySelector('span')
    expect(badge?.className).toContain('text-ink')
    expect(badge?.className).not.toContain('--color-stamp')
  })

  it('"CLAIMED — UNPAID" renders with --color-ink class (no red)', () => {
    const { container } = render(<StatusBadge status="CLAIMED — UNPAID" />)
    const badge = container.querySelector('span')
    expect(badge?.className).toContain('text-ink')
    expect(badge?.className).not.toContain('--color-stamp')
  })

  it.each<StatusValue>(['N/A', 'CONFIRMED', 'AWAITING', 'CLAIMED — UNPAID', 'UNCLAIMED ❋'])(
    'renders correct text for status "%s"',
    (status) => {
      render(<StatusBadge status={status} />)
      expect(screen.getByText(status)).toBeInTheDocument()
    }
  )
})
