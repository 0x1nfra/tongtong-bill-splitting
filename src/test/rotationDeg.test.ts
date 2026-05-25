/**
 * rotationDeg derivation behavioral tests.
 *
 * Formula from src/app/c/[billId]/page.tsx:
 *   const rotationDeg = (billId.charCodeAt(0) % 20) / 10 + 1;
 *
 * charCodeAt(0) % 20 produces values 0–19
 * /10 maps that to 0.0–1.9
 * +1 shifts to 1.0–2.9
 *
 * Requirement (UI-09): deterministic tilt between 1.0 and 2.9 degrees derived
 * from first character of billId.
 */

import { describe, it, expect } from 'vitest'

// Replicated exactly from src/app/c/[billId]/page.tsx
function deriveRotationDeg(billId: string): number {
  return (billId.charCodeAt(0) % 20) / 10 + 1
}

describe('rotationDeg derivation', () => {
  it('output is always >= 1.0 for any single char code (min: charCode%20=0 → 0/10+1=1.0)', () => {
    // Find a char whose charCode % 20 === 0 to hit the minimum
    // charCode 20 = ASCII DC4 (control), charCode 40 = '(', charCode 60 = '<', charCode 80 = 'P'
    const billIdWithMinChar = String.fromCharCode(80) + 'rest'  // 'P': 80%20=0 → 1.0
    const result = deriveRotationDeg(billIdWithMinChar)
    expect(result).toBeGreaterThanOrEqual(1.0)
    expect(result).toBe(1.0)
  })

  it('output is always <= 2.9 (max: charCode%20=19 → 19/10+1=2.9)', () => {
    // charCode 19 = ASCII EM (control) → 19%20=19 → 2.9
    // charCode 19+20=39 = "'" → 39%20=19 → 2.9
    const billIdWithMaxChar = String.fromCharCode(39) + 'rest'  // "'": 39%20=19 → 2.9
    const result = deriveRotationDeg(billIdWithMaxChar)
    expect(result).toBeLessThanOrEqual(2.9)
    expect(result).toBeCloseTo(2.9, 10)
  })

  it('output is strictly less than 3.0 for all possible first characters', () => {
    // Exhaustive check over printable ASCII range 32–126
    for (let code = 32; code <= 126; code++) {
      const billId = String.fromCharCode(code) + 'test'
      const result = deriveRotationDeg(billId)
      expect(result).toBeLessThan(3.0)
    }
  })

  it('same billId always produces the same rotation (deterministic)', () => {
    const billId = 'j5kxabcdefgh'
    const first = deriveRotationDeg(billId)
    const second = deriveRotationDeg(billId)
    const third = deriveRotationDeg(billId)
    expect(first).toBe(second)
    expect(second).toBe(third)
  })

  it('different billIds with same first character produce the same rotation', () => {
    const billId1 = 'aXXXXXX'
    const billId2 = 'aYYYYYY'
    expect(deriveRotationDeg(billId1)).toBe(deriveRotationDeg(billId2))
  })

  it('two chars with charCodes differing by 20 produce same rotation (periodicity of % 20)', () => {
    // charCode 65 = 'A' (65%20=5), charCode 85 = 'U' (85%20=5)
    const billIdA = String.fromCharCode(65) + 'rest'  // 'A': 65%20=5
    const billIdU = String.fromCharCode(85) + 'rest'  // 'U': 85%20=5
    expect(deriveRotationDeg(billIdA)).toBe(deriveRotationDeg(billIdU))
  })

  it('formula produces correct value for a known input', () => {
    // 'a' = charCode 97; 97 % 20 = 17; 17/10 + 1 = 2.7
    const result = deriveRotationDeg('abcdefgh')
    expect(result).toBeCloseTo(2.7, 10)
  })
})
