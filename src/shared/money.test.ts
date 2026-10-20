// Tests amount parsing and formatting.
import { describe, expect, it } from 'vitest'
import { formatCents, formatCentsPlain, formatCompactEuros, parseAmountToCents } from './money'

describe('parseAmountToCents', () => {
  it.each([
    ['0', 0],
    ['-0,01', -1],
    ['0,05', 5],
    ['12', 1200],
    ['12,5', 1250],
    ['12,50', 1250],
    ['-12,50', -1250],
    ['+12,50', 1250],
    ['1.234,56', 123456],
    ['-1.234,56', -123456],
    ['1.000.000,00', 100000000],
    ['  7,00  ', 700],
    ['-0', 0]
  ])('parses %s as %i cents', (text, expected) => {
    expect(parseAmountToCents(text)).toBe(expected)
  })

  it.each(['', 'abc', '1,234', '1,2,3', '12.5', '1.23,45', '1.2345,00', '--5', '5-', '€5', '1e3'])(
    'rejects %s',
    (text) => {
      expect(() => parseAmountToCents(text)).toThrowError(
        expect.objectContaining({ code: 'IMPORT_PARSE_ERROR' })
      )
    }
  )

  it('does not lose precision on amounts that floats would round', () => {
    expect(parseAmountToCents('0,29')).toBe(29)
    expect(parseAmountToCents('1.005,05')).toBe(100505)
  })

  it('rejects amounts beyond the safe integer range', () => {
    expect(() => parseAmountToCents('99.999.999.999.999.999,99')).toThrowError(
      expect.objectContaining({ code: 'IMPORT_PARSE_ERROR' })
    )
  })
})

describe('formatCents', () => {
  it.each([
    [0, '0,00 €'],
    [5, '0,05 €'],
    [100, '1,00 €'],
    [123456, '1.234,56 €'],
    [-1250, '-12,50 €'],
    [-1, '-0,01 €'],
    [100000000, '1.000.000,00 €'],
    [99999, '999,99 €'],
    [100000, '1.000,00 €']
  ])('formats %i as %s', (cents, expected) => {
    expect(formatCents(cents)).toBe(expected)
  })

  it('refuses fractional cents', () => {
    expect(() => formatCents(12.5)).toThrow()
  })

  it('roundtrips with the parser', () => {
    for (const cents of [0, 1, -1, 99, 100, -123456, 100000000]) {
      const text = formatCents(cents).replace(' €', '')
      expect(parseAmountToCents(text)).toBe(cents)
    }
  })
})

describe('formatCentsPlain', () => {
  it('uses a decimal comma without grouping or currency sign', () => {
    expect(formatCentsPlain(123456)).toBe('1234,56')
    expect(formatCentsPlain(-5)).toBe('-0,05')
    expect(formatCentsPlain(0)).toBe('0,00')
  })
})

describe('formatCompactEuros', () => {
  it('shows whole euros below one thousand', () => {
    expect(formatCompactEuros(0)).toBe('0')
    expect(formatCompactEuros(25050)).toBe('251')
  })

  it('shows thousands with a decimal comma', () => {
    expect(formatCompactEuros(150000)).toBe('1,5K')
    expect(formatCompactEuros(200000)).toBe('2K')
    expect(formatCompactEuros(-300000)).toBe('-3K')
  })
})
