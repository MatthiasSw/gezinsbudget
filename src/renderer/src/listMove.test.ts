// Tests moving an item up, down and out of range.
import { describe, expect, it } from 'vitest'
import { moveItem } from './listMove'

describe('moveItem', () => {
  const list = ['a', 'b', 'c', 'd']

  it('moves an item down', () => {
    expect(moveItem(list, 0, 2)).toEqual(['b', 'c', 'a', 'd'])
  })

  it('moves an item up', () => {
    expect(moveItem(list, 3, 1)).toEqual(['a', 'd', 'b', 'c'])
  })

  it('does not change the original list', () => {
    moveItem(list, 0, 3)
    expect(list).toEqual(['a', 'b', 'c', 'd'])
  })

  it('returns the same list for no move or an index out of range', () => {
    expect(moveItem(list, 1, 1)).toBe(list)
    expect(moveItem(list, -1, 2)).toBe(list)
    expect(moveItem(list, 1, 9)).toBe(list)
  })
})
