// Tests page counting, clamping, slicing and the shown range.
import { describe, expect, it } from 'vitest'
import { clampPage, pageCount, pageRange, pageSlice } from './pagination'

const items = Array.from({ length: 120 }, (_, index) => index + 1)

describe('pageCount', () => {
  it('rounds up and is at least one', () => {
    expect(pageCount(120, 50)).toBe(3)
    expect(pageCount(100, 50)).toBe(2)
    expect(pageCount(0, 50)).toBe(1)
  })
})

describe('clampPage', () => {
  it('keeps the page inside the available pages', () => {
    expect(clampPage(7, 120, 50)).toBe(2)
    expect(clampPage(-1, 120, 50)).toBe(0)
    expect(clampPage(1, 0, 50)).toBe(0)
  })
})

describe('pageSlice', () => {
  it('returns the items of the requested page', () => {
    expect(pageSlice(items, 0, 50)).toHaveLength(50)
    expect(pageSlice(items, 1, 50)[0]).toBe(51)
    expect(pageSlice(items, 2, 50)).toHaveLength(20)
  })

  it('falls back to the last page when the page is too high', () => {
    expect(pageSlice(items, 9, 50)[0]).toBe(101)
  })
})

describe('pageRange', () => {
  it('describes the first and last item shown', () => {
    expect(pageRange(0, 120, 50)).toEqual({ first: 1, last: 50 })
    expect(pageRange(2, 120, 50)).toEqual({ first: 101, last: 120 })
    expect(pageRange(0, 0, 50)).toEqual({ first: 0, last: 0 })
  })
})
