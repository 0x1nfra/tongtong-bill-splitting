/**
 * updateBankingInfo mutation boundary tests.
 * Tests the auth, archive-freeze, and XSS-sanitisation contracts as pure predicates,
 * independent of the Convex runtime.
 * Follows updateRoundingAdjustment.test.ts pattern.
 */

import { describe, it, expect } from 'vitest'

// Pure predicate: returns true only when organizerSecret matches the bill's secret.
// Replicates the auth guard contract that updateBankingInfo must enforce.
function isAuthorized(
  bill: { organizerSecret: string; archivedAt?: number } | null,
  organizerSecret: string
): boolean {
  if (bill === null) return false
  if (bill.organizerSecret !== organizerSecret) return false
  return true
}

// Pure predicate: returns true when the bill has been archived.
// Replicates the archive-freeze guard contract that updateBankingInfo must enforce.
function isArchived(bill: { archivedAt?: number }): boolean {
  return bill.archivedAt !== undefined
}

// Pure predicate: returns true when the string contains none of <, >, or ".
// Replicates the XSS sanitisation contract that updateBankingInfo must enforce
// for bankName, bankAccountNumber, and bankAccountName fields.
function isSafeText(s: string): boolean {
  return !s.includes('<') && !s.includes('>') && !s.includes('"')
}

// ---------------------------------------------------------------------------
// 1. Auth boundary
// ---------------------------------------------------------------------------

describe('updateBankingInfo — auth boundary', () => {
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

describe('updateBankingInfo — archive freeze boundary', () => {
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
// 3. XSS sanitization
// ---------------------------------------------------------------------------

describe('updateBankingInfo — XSS sanitization', () => {
  it('isSafeText("<script>") returns false (contains <)', () => {
    expect(isSafeText('<script>')).toBe(false)
  })

  it('isSafeText(\'\"hello\"\') returns false (contains ")', () => {
    expect(isSafeText('"hello"')).toBe(false)
  })

  it('isSafeText("hello>world") returns false (contains >)', () => {
    expect(isSafeText('hello>world')).toBe(false)
  })

  it('isSafeText("Maybank") returns true (plain text)', () => {
    expect(isSafeText('Maybank')).toBe(true)
  })

  it('isSafeText("") returns true (empty string is safe)', () => {
    expect(isSafeText('')).toBe(true)
  })

  it('isSafeText("DuitNow 012-3456789") returns true (phone format, safe)', () => {
    expect(isSafeText('DuitNow 012-3456789')).toBe(true)
  })
})
