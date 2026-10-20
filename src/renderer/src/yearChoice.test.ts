// Tests the year options and selection of the year filters.
import { describe, expect, it } from 'vitest'
import { selectedYear, yearOptions } from './yearChoice'

describe('yearOptions', () => {
  it('offers the years with data, or the current year when there is none', () => {
    expect(yearOptions([2026, 2025], 2026)).toEqual([2026, 2025])
    expect(yearOptions([], 2026)).toEqual([2026])
  })
})

describe('selectedYear', () => {
  it('keeps the chosen year when it has data', () => {
    expect(selectedYear([2026, 2025], 2025, 2026)).toBe(2025)
  })

  it('falls back to the current year, then to the newest year with data', () => {
    expect(selectedYear([2026, 2025], null, 2026)).toBe(2026)
    expect(selectedYear([2025, 2024], null, 2026)).toBe(2025)
  })

  it('ignores a chosen year that has no data', () => {
    expect(selectedYear([2025], 2020, 2026)).toBe(2025)
  })
})
