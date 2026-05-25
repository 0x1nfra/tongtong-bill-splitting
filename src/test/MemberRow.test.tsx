/**
 * MemberRow component behavioral tests.
 *
 * Note: the "CLAIMED — UNPAID" status value uses an em-dash with surrounding
 * spaces, matching the literal in StatusBadge.tsx and MemberRow.tsx.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemberRow } from '@/components/MemberRow'

describe('MemberRow', () => {
  it('name is displayed in uppercase', () => {
    render(
      <MemberRow
        name="alice"
        status="CONFIRMED"
        amountOwed={1000}
      />
    )
    const nameEl = screen.getByText('alice')
    expect(nameEl.className).toContain('uppercase')
  })

  it('amount displayed as "RM X.XX" format', () => {
    render(
      <MemberRow
        name="Bob"
        status="CONFIRMED"
        amountOwed={1250}
      />
    )
    expect(screen.getByText('RM12.50')).toBeInTheDocument()
  })

  it('AWAITING status: STAMP SETTLED button is visible', () => {
    render(
      <MemberRow
        name="Carol"
        status="AWAITING"
        amountOwed={500}
        onConfirm={vi.fn()}
        onReject={vi.fn()}
      />
    )
    expect(screen.getByRole('button', { name: /stamp settled/i })).toBeInTheDocument()
  })

  it('AWAITING status: STAMP SETTLED button has blue bg-pen class', () => {
    const { container } = render(
      <MemberRow
        name="Carol"
        status="AWAITING"
        amountOwed={500}
        onConfirm={vi.fn()}
        onReject={vi.fn()}
      />
    )
    const confirmBtn = screen.getByRole('button', { name: /stamp settled/i })
    expect(confirmBtn.className).toContain('bg-pen')
  })

  it('AWAITING status: REJECT button is visible', () => {
    render(
      <MemberRow
        name="Carol"
        status="AWAITING"
        amountOwed={500}
        onConfirm={vi.fn()}
        onReject={vi.fn()}
      />
    )
    expect(screen.getByRole('button', { name: /reject/i })).toBeInTheDocument()
  })

  it('AWAITING status: clicking STAMP SETTLED calls onConfirm', async () => {
    const onConfirm = vi.fn()
    render(
      <MemberRow
        name="Carol"
        status="AWAITING"
        amountOwed={500}
        onConfirm={onConfirm}
        onReject={vi.fn()}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: /stamp settled/i }))
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('CONFIRMED status: no action buttons rendered', () => {
    render(
      <MemberRow
        name="Dave"
        status="CONFIRMED"
        amountOwed={800}
      />
    )
    expect(screen.queryByRole('button', { name: /stamp settled/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /reject/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /send reminder/i })).toBeNull()
  })

  it('"CLAIMED — UNPAID" status: SEND REMINDER button is visible', () => {
    render(
      <MemberRow
        name="Eve"
        status="CLAIMED — UNPAID"
        amountOwed={600}
        onRemind={vi.fn()}
      />
    )
    expect(screen.getByRole('button', { name: /send reminder/i })).toBeInTheDocument()
  })

  it('"UNCLAIMED ❋" status: SEND REMINDER button is visible', () => {
    render(
      <MemberRow
        name="Frank"
        status="UNCLAIMED ❋"
        amountOwed={400}
        onRemind={vi.fn()}
      />
    )
    expect(screen.getByRole('button', { name: /send reminder/i })).toBeInTheDocument()
  })

  it('"CLAIMED — UNPAID" status: no STAMP SETTLED or REJECT buttons', () => {
    render(
      <MemberRow
        name="Eve"
        status="CLAIMED — UNPAID"
        amountOwed={600}
        onRemind={vi.fn()}
      />
    )
    expect(screen.queryByRole('button', { name: /stamp settled/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /reject/i })).toBeNull()
  })
})
