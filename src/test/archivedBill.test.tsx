/**
 * ArchivedStamp component behavioral tests.
 *
 * This test is a FAILING stub (RED state) — ArchivedStamp does not exist yet.
 * Plan 03 will create src/components/ArchivedStamp.tsx to make these tests pass.
 *
 * UI contract from 04-UI-SPEC.md "ARCHIVED State":
 *   - Renders "ARCHIVED" stamp text (Bungee font, text-stamp class)
 *   - Renders sub-copy "THIS BILL IS ARCHIVED"
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ArchivedStamp } from '@/components/ArchivedStamp'

describe('ArchivedStamp', () => {
  it('renders ARCHIVED text when archivedAt is provided', () => {
    render(<ArchivedStamp />)
    expect(screen.getByText('ARCHIVED')).toBeInTheDocument()
  })

  it('renders sub-copy THIS BILL IS ARCHIVED', () => {
    render(<ArchivedStamp />)
    expect(screen.getByText('THIS BILL IS ARCHIVED')).toBeInTheDocument()
  })
})
