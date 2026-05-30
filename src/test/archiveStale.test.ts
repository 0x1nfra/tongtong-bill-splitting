/**
 * archiveStale unit tests.
 *
 * Tests the isStale pure-function predicate that will be extracted from
 * convex/bills.ts in plan 02. The predicate is defined inline here to
 * establish the contract before the implementation exists.
 *
 * Contract: a bill is stale if its _creationTime is 30+ days before now.
 * Boundary: exactly 30 days old counts as stale (>= not >).
 */

import { describe, it, expect } from 'vitest'

// Contract definition — replicated from the spec in 04-01-PLAN.md.
// plan 02 must extract this predicate to convex/bills.ts as isStale().
function isStale(creationTime: number, nowMs: number): boolean {
  return nowMs - creationTime >= 30 * 24 * 60 * 60 * 1000
}

describe('isStale', () => {
  it('marks bills where _creationTime is older than 30 days as stale', () => {
    const nowMs = Date.now()
    const creationTime = nowMs - 31 * 24 * 60 * 60 * 1000
    expect(isStale(creationTime, nowMs)).toBe(true)
  })

  it('does NOT mark bills where _creationTime is within 30 days as stale', () => {
    const nowMs = Date.now()
    const creationTime = nowMs - 29 * 24 * 60 * 60 * 1000
    expect(isStale(creationTime, nowMs)).toBe(false)
  })

  it('boundary: a bill created exactly 30 days ago is considered stale', () => {
    const nowMs = Date.now()
    const creationTime = nowMs - 30 * 24 * 60 * 60 * 1000
    expect(isStale(creationTime, nowMs)).toBe(true)
  })
})
