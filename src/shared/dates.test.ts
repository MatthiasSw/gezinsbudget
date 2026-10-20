// Tests date parsing and month keys.
import { describe, expect, it } from 'vitest'
import {
  formatBelgianDate,
  formatMonthLabel,
  isValidIsoDate,
  lastDayOfMonth,
  shiftYear,
  monthKey,
  monthKeysBetween,
  parseBelgianDate,
  shortMonthName
} from './dates'

describe('parseBelgianDate', () => {
  it.each([
    ['05/01/2026', '2026-01-05'],
    ['31/12/2025', '2025-12-31'],
    ['29/02/2024', '2024-02-29'],
    [' 01/03/2026 ', '2026-03-01']
  ])('parses %s as %s', (text, expected) => {
    expect(parseBelgianDate(text)).toBe(expected)
  })

  it.each(['31/02/2026', '29/02/2025', '00/01/2026', '01/13/2026', '5/1/2026', '2026-01-05', ''])(
    'rejects %s',
    (text) => {
      expect(() => parseBelgianDate(text)).toThrowError(
        expect.objectContaining({ code: 'IMPORT_PARSE_ERROR' })
      )
    }
  )
})

describe('isValidIsoDate', () => {
  it('accepts real dates and rejects impossible ones', () => {
    expect(isValidIsoDate('2026-02-28')).toBe(true)
    expect(isValidIsoDate('2026-02-30')).toBe(false)
    expect(isValidIsoDate('2026-2-3')).toBe(false)
  })
})

describe('monthKey', () => {
  it('takes the year and month of an ISO date', () => {
    expect(monthKey('2026-01-05')).toBe('2026-01')
  })
})

describe('formatBelgianDate', () => {
  it('writes an ISO date as dd/mm/yyyy', () => {
    expect(formatBelgianDate('2026-01-05')).toBe('05/01/2026')
  })

  it('roundtrips with the parser', () => {
    expect(parseBelgianDate(formatBelgianDate('2026-12-31'))).toBe('2026-12-31')
  })
})

describe('month labels', () => {
  it('uses short Dutch month names', () => {
    expect(shortMonthName('2026-03')).toBe('mrt')
    expect(shortMonthName('2026-05')).toBe('mei')
    expect(formatMonthLabel('2026-12')).toBe('dec 2026')
  })
})

describe('monthKeysBetween', () => {
  it('lists every month in an inclusive range', () => {
    expect(monthKeysBetween('2026-01-15', '2026-03-02')).toEqual(['2026-01', '2026-02', '2026-03'])
  })

  it('crosses year boundaries', () => {
    expect(monthKeysBetween('2025-11-01', '2026-02-28')).toEqual([
      '2025-11',
      '2025-12',
      '2026-01',
      '2026-02'
    ])
  })

  it('returns one month for a range inside a month and none for a reversed range', () => {
    expect(monthKeysBetween('2026-05-01', '2026-05-31')).toEqual(['2026-05'])
    expect(monthKeysBetween('2026-06-01', '2026-05-01')).toEqual([])
  })
})

describe('shiftYear', () => {
  it('moves a date by whole years', () => {
    expect(shiftYear('2026-03-15', -1)).toBe('2025-03-15')
    expect(shiftYear('2026-12-31', -2)).toBe('2024-12-31')
  })

  it('falls back to the 28th when the day does not exist in the target year', () => {
    expect(shiftYear('2024-02-29', -1)).toBe('2023-02-28')
  })
})

describe('lastDayOfMonth', () => {
  it('returns the last day including leap years', () => {
    expect(lastDayOfMonth('2026-04')).toBe('2026-04-30')
    expect(lastDayOfMonth('2024-02')).toBe('2024-02-29')
    expect(lastDayOfMonth('2026-12')).toBe('2026-12-31')
  })
})
