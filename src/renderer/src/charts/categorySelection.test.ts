// Tests that colors stay with their category when the selection changes.
import { describe, expect, it } from 'vitest'
import {
  addCategory,
  maxSelectedCategories,
  removeCategory,
  selectionOf
} from './categorySelection'

describe('category selection', () => {
  it('gives the first free slot to a new category', () => {
    expect(selectionOf(['a', 'b'])).toEqual([
      { categoryId: 'a', slot: 0 },
      { categoryId: 'b', slot: 1 }
    ])
  })

  it('keeps the slots of the remaining categories when one is removed', () => {
    const selection = removeCategory(selectionOf(['a', 'b', 'c']), 'a')
    expect(selection).toEqual([
      { categoryId: 'b', slot: 1 },
      { categoryId: 'c', slot: 2 }
    ])
  })

  it('reuses a freed slot for the next category', () => {
    const selection = addCategory(removeCategory(selectionOf(['a', 'b']), 'a'), 'c')
    expect(selection.find((item) => item.categoryId === 'c')?.slot).toBe(0)
  })

  it('ignores duplicates and stops at the maximum', () => {
    const full = selectionOf(['a', 'b', 'c', 'd', 'e'])
    expect(full).toHaveLength(maxSelectedCategories)
    expect(addCategory(full, 'f')).toEqual(full)
    expect(addCategory(full, 'a')).toEqual(full)
  })
})
