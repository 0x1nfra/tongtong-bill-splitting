// BONUS-05 wired in Phase 8 — SignInButton now hooks up to Google OAuth via useAuthActions.
// This test mocks the auth hook so the component can render without a real provider.

/**
 * SignInButton smoke tests.
 *
 * UI contract from 08-UI-SPEC.md "Google OAuth Sign-In":
 *   - Renders a button with text "SIGN IN WITH GOOGLE"
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SignInButton } from '@/components/SignInButton'

vi.mock('@convex-dev/auth/react', () => ({ useAuthActions: () => ({ signIn: vi.fn() }) }))

describe('SignInButton', () => {
  it('renders SIGN IN WITH GOOGLE button', () => {
    render(<SignInButton />)
    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument()
  })
})
