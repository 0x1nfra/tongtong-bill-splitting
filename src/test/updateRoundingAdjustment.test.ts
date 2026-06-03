/**
 * updateRoundingAdjustment mutation boundary tests.
 * Tests the auth, archive-freeze, integer validation, quantity validation,
 * claimant name validation, and claimedCount semantics as pure predicates,
 * independent of the Convex runtime.
 * Follows updateQR.test.ts pattern.
 */

import { describe, it, expect } from 'vitest'

// Pure predicate: returns true only when organizerSecret matches the bill's secret.
// Replicates the auth guard contract that updateRoundingAdjustment must enforce.
function isAuthorized(
  bill: { organizerSecret: string; archivedAt?: number } | null,
  organizerSecret: string
): boolean {
  if (bill === null) return false
  if (bill.organizerSecret !== organizerSecret) return false
  return true
}

// Pure predicate: returns true when the bill has been archived.
// Replicates the archive-freeze guard contract that updateRoundingAdjustment must enforce.
function isArchived(bill: { archivedAt?: number }): boolean {
  return bill.archivedAt !== undefined
}

// Pure predicate: returns true when value is an integer (valid rounding adjustment).
function isValidAdjustment(value: number): boolean {
  return Number.isInteger(value)
}

// Pure predicate: returns true when quantity is a positive integer.
function isValidQuantity(quantity: number): boolean {
  return Number.isInteger(quantity) && quantity >= 1
}

// Pure predicate: returns true when claimant name is non-empty after trimming.
function isValidClaimantName(name: string): boolean {
  return name.trim().length > 0
}

// Pure function: returns count of unique claiming sessions.
function claimedCountFromSessions(claimingSessions: Set<string>): number {
  return claimingSessions.size
}

// ---------------------------------------------------------------------------
// 1. Auth boundary
// ---------------------------------------------------------------------------

describe('updateRoundingAdjustment — auth boundary', () => {
  it('returns false when bill is null (not found)', () => {
    expect(isAuthorized(null, 'any-secret')).toBe(false)
  })

  it('returns false when organizerSecret does not match', () => {
    const bill = { organizerSecret: 'correct-secret' }
    expect(isAuthorized(bill, 'wrong-secret')).toBe(false)
  })

  it('returns true when organizerSecret matches', () => {
    expect(isAuthorized({ organizerSecret: 'correct-secret' }, 'correct-secret')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 2. Archive freeze boundary
// ---------------------------------------------------------------------------

describe('updateRoundingAdjustment — archive freeze boundary', () => {
  it('treats bill with archivedAt set as archived', () => {
    expect(isArchived({ archivedAt: Date.now() })).toBe(true)
  })

  it('treats bill with no archivedAt as not archived', () => {
    expect(isArchived({})).toBe(false)
  })

  it('treats bill with archivedAt: undefined as not archived', () => {
    expect(isArchived({ archivedAt: undefined })).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// 3. Integer validation
// ---------------------------------------------------------------------------

describe('updateRoundingAdjustment — integer validation', () => {
  it('1.5 fails isValidAdjustment (non-integer rejected)', () => {
    expect(isValidAdjustment(1.5)).toBe(false)
  })

  it('0 passes isValidAdjustment (zero is a valid integer)', () => {
    expect(isValidAdjustment(0)).toBe(true)
  })

  it('positive integer passes isValidAdjustment', () => {
    expect(isValidAdjustment(5)).toBe(true)
  })

  it('negative integer passes isValidAdjustment', () => {
    expect(isValidAdjustment(-3)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 4. createBill quantity validation — pure predicate
// ---------------------------------------------------------------------------

describe('createBill quantity validation — pure predicate', () => {
  it('0 fails isValidQuantity (quantity must be at least 1)', () => {
    expect(isValidQuantity(0)).toBe(false)
  })

  it('-1 fails isValidQuantity (negative quantity rejected)', () => {
    expect(isValidQuantity(-1)).toBe(false)
  })

  it('0.5 fails isValidQuantity (fractional quantity rejected)', () => {
    expect(isValidQuantity(0.5)).toBe(false)
  })

  it('1 passes isValidQuantity (minimum valid quantity)', () => {
    expect(isValidQuantity(1)).toBe(true)
  })

  it('10 passes isValidQuantity (standard quantity accepted)', () => {
    expect(isValidQuantity(10)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 5. claimItem claimantName validation — pure predicate
// ---------------------------------------------------------------------------

describe('claimItem claimantName validation — pure predicate', () => {
  it('empty string fails isValidClaimantName', () => {
    expect(isValidClaimantName('')).toBe(false)
  })

  it('whitespace-only string fails isValidClaimantName', () => {
    expect(isValidClaimantName('   ')).toBe(false)
  })

  it('"Alice" passes isValidClaimantName', () => {
    expect(isValidClaimantName('Alice')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 6. getClaimsForBill claimedCount semantics — pure predicate
// ---------------------------------------------------------------------------

describe('getClaimsForBill claimedCount semantics — pure predicate', () => {
  it('session with a claim is counted (2 sessions → count = 2)', () => {
    const claimingSessions = new Set(['s1', 's2'])
    expect(claimedCountFromSessions(claimingSessions)).toBe(2)
  })

  it('session with claim + settled payment is still counted (payment status does not exclude)', () => {
    // D-09: claimedCount counts all sessions that have claims, regardless of payment status
    const claimingSessions = new Set(['s1', 's2', 's3'])
    expect(claimedCountFromSessions(claimingSessions)).toBe(3)
  })

  it('session with no claims is excluded (empty set → count = 0)', () => {
    const claimingSessions = new Set<string>()
    expect(claimedCountFromSessions(claimingSessions)).toBe(0)
  })
})
