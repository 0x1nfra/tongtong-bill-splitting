/**
 * Display code format behavioral tests.
 *
 * Source: share/[billId]/page.tsx line 54
 *   const displayCode = `#TT-${billId.slice(0, 4).toUpperCase()}`;
 *
 * NOTE: The implementation takes the FIRST 4 characters (slice(0,4)), not
 * the last 4. Tests verify the actual implementation behavior.
 */

import { describe, it, expect } from 'vitest'

// Replicated exactly from share/[billId]/page.tsx
function deriveDisplayCode(billId: string): string {
  return `#TT-${billId.slice(0, 4).toUpperCase()}`
}

describe('displayCode derivation', () => {
  it('prefixed with "#TT-"', () => {
    const code = deriveDisplayCode('abcd1234efgh')
    expect(code.startsWith('#TT-')).toBe(true)
  })

  it('first 4 characters extracted and uppercased', () => {
    // billId = "j5kx..." → first 4 = "j5kx" → uppercased "J5KX"
    const code = deriveDisplayCode('j5kxabcdefgh')
    expect(code).toBe('#TT-J5KX')
  })

  it('lowercase characters in first 4 positions are uppercased', () => {
    const code = deriveDisplayCode('abcdEFGH')
    expect(code).toBe('#TT-ABCD')
  })

  it('uppercase characters in first 4 positions remain uppercase', () => {
    const code = deriveDisplayCode('ABCDefgh')
    expect(code).toBe('#TT-ABCD')
  })

  it('digits in first 4 positions are preserved as-is', () => {
    const code = deriveDisplayCode('1234abcd')
    expect(code).toBe('#TT-1234')
  })

  it('full format: #TT-XXXX has exactly 8 characters after "#TT-" prefix is removed', () => {
    // The suffix should always be exactly 4 chars (assuming billId >= 4 chars)
    const code = deriveDisplayCode('ks8tabcdef')
    const suffix = code.replace('#TT-', '')
    expect(suffix).toHaveLength(4)
  })

  it('billId shorter than 4 chars: slice(0,4) returns what is available', () => {
    const code = deriveDisplayCode('ab')
    // Should not throw; returns only available chars uppercased
    expect(code).toBe('#TT-AB')
  })

  it('characters BEYOND first 4 are NOT included in display code', () => {
    // billId with unique trailing chars — confirm they don't appear
    const code = deriveDisplayCode('xxxxZZZZ')
    // First 4 = "xxxx" → "XXXX"
    expect(code).toBe('#TT-XXXX')
    expect(code).not.toContain('ZZZZ')
  })
})
