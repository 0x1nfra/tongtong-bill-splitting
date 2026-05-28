// BONUS-05 is deferred per D-08. This stub verifies the SignInButton component renders correctly.
// Full OAuth wiring is not implemented in Phase 4.

/**
 * SignInButton smoke tests.
 *
 * This test is a FAILING stub (RED state) — SignInButton does not exist yet.
 * Plan 04 will create src/components/SignInButton.tsx to make this test pass.
 *
 * UI contract from 04-UI-SPEC.md "Google OAuth Sign-In":
 *   - Renders a button with text "SIGN IN WITH GOOGLE"
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SignInButton } from '@/components/SignInButton'

describe('SignInButton', () => {
  it('renders SIGN IN WITH GOOGLE button', () => {
    render(<SignInButton />)
    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument()
  })
})
