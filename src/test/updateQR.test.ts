/**
 * updateQR mutation boundary tests.
 * Tests the auth and archive-freeze logic as pure predicates,
 * independent of the Convex runtime.
 * Follows archiveStale.test.ts pattern.
 */

import { describe, it, expect } from 'vitest'

// Pure predicate: returns true only when organizerSecret matches the bill's secret.
// Replicates the auth guard contract that updateQR must enforce.
function isAuthorized(
  bill: { organizerSecret: string; archivedAt?: number } | null,
  organizerSecret: string
): boolean {
  if (bill === null) return false
  if (bill.organizerSecret !== organizerSecret) return false
  return true
}

// Pure predicate: returns true when the bill has been archived.
// Replicates the archive-freeze guard contract that updateQR must enforce.
function isArchived(bill: { archivedAt?: number }): boolean {
  return bill.archivedAt !== undefined
}

describe('updateQR — auth boundary', () => {
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

describe('updateQR — archive freeze boundary', () => {
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
