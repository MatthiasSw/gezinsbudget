// Tests IBAN normalization, validation and formatting.
import { describe, expect, it } from 'vitest'
import { formatIban, isValidIban, normalizeIban } from './iban'

describe('normalizeIban', () => {
  it('removes spaces and uppercases', () => {
    expect(normalizeIban('be68 5390 0754 7034')).toBe('BE68539007547034')
  })

  it('treats a missing IBAN as empty', () => {
    expect(normalizeIban(undefined)).toBe('')
  })
})

describe('isValidIban', () => {
  it('accepts valid IBANs with or without spaces and in any case', () => {
    expect(isValidIban('BE68 5390 0754 7034')).toBe(true)
    expect(isValidIban('be68539007547034')).toBe(true)
    expect(isValidIban('BE71 0961 2345 6769')).toBe(true)
    expect(isValidIban('NL91 ABNA 0417 1643 00')).toBe(true)
  })

  it('rejects a wrong check digit', () => {
    expect(isValidIban('BE69 5390 0754 7034')).toBe(false)
  })

  it('rejects a mistyped number', () => {
    expect(isValidIban('BE68 5390 0754 7035')).toBe(false)
  })

  it('rejects text that is not shaped like an IBAN', () => {
    expect(isValidIban('')).toBe(false)
    expect(isValidIban('12345')).toBe(false)
    expect(isValidIban('BE68')).toBe(false)
  })
})

describe('formatIban', () => {
  it('groups the IBAN in blocks of four', () => {
    expect(formatIban('be68539007547034')).toBe('BE68 5390 0754 7034')
  })
})
