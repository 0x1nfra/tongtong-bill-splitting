/**
 * isGenerateDisabled behavioral tests.
 *
 * Logic extracted from create/page.tsx line 130:
 *   const isGenerateDisabled = items.length === 0 || isSubmitting;
 */

import { describe, it, expect } from 'vitest'
import type { ItemDraft } from '@/components/ItemRow'

// Pure function mirroring the inline expression in create/page.tsx
const isGenerateDisabled = (items: ItemDraft[], isSubmitting: boolean): boolean =>
  items.length === 0 || isSubmitting

function makeItem(): ItemDraft {
  return { id: 'abc', name: 'Nasi Lemak', price: '12.50', quantity: 1 }
}

describe('isGenerateDisabled', () => {
  it('empty items array → disabled true', () => {
    expect(isGenerateDisabled([], false)).toBe(true)
  })

  it('items present and not submitting → disabled false', () => {
    expect(isGenerateDisabled([makeItem()], false)).toBe(false)
  })

  it('items present but submitting → disabled true', () => {
    expect(isGenerateDisabled([makeItem()], true)).toBe(true)
  })

  it('empty items and submitting → disabled true', () => {
    expect(isGenerateDisabled([], true)).toBe(true)
  })

  it('multiple items, not submitting → disabled false', () => {
    expect(isGenerateDisabled([makeItem(), makeItem(), makeItem()], false)).toBe(false)
  })

  it('multiple items, submitting → disabled true', () => {
    expect(isGenerateDisabled([makeItem(), makeItem()], true)).toBe(true)
  })
})
