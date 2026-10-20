// Tests period presets, including leap years and the January rollover.
import { describe, expect, it } from 'vitest'
import { monthKeyRange, presetRange, todayAsIso, yearRangeOf } from './periods'

describe('presetRange', () => {
  it('covers the current month', () => {
    expect(presetRange('thisMonth', '2026-03-15')).toEqual({ from: '2026-03-01', to: '2026-03-31' })
  })

  it('handles a 30 day month and a leap February', () => {
    expect(presetRange('thisMonth', '2026-04-10').to).toBe('2026-04-30')
    expect(presetRange('thisMonth', '2024-02-10').to).toBe('2024-02-29')
    expect(presetRange('thisMonth', '2026-02-10').to).toBe('2026-02-28')
  })

  it('covers the previous month', () => {
    expect(presetRange('lastMonth', '2026-03-15')).toEqual({ from: '2026-02-01', to: '2026-02-28' })
  })

  it('wraps to December of the previous year in January', () => {
    expect(presetRange('lastMonth', '2026-01-05')).toEqual({ from: '2025-12-01', to: '2025-12-31' })
  })

  it('covers this year and last year', () => {
    expect(presetRange('thisYear', '2026-06-01')).toEqual({ from: '2026-01-01', to: '2026-12-31' })
    expect(presetRange('lastYear', '2026-06-01')).toEqual({ from: '2025-01-01', to: '2025-12-31' })
  })

  it('has no bounds for all', () => {
    expect(presetRange('all', '2026-06-01')).toEqual({})
  })
})

describe('todayAsIso', () => {
  it('formats a local date as ISO', () => {
    expect(todayAsIso(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})

describe('monthKeyRange and yearRangeOf', () => {
  it('turns a month key into its first and last day', () => {
    expect(monthKeyRange('2026-02')).toEqual({ from: '2026-02-01', to: '2026-02-28' })
  })

  it('turns a year into its first and last day', () => {
    expect(yearRangeOf(2026)).toEqual({ from: '2026-01-01', to: '2026-12-31' })
  })
})
