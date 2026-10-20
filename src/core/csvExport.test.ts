// Tests the CSV export: Excel-friendly layout, Belgian notation, quoting and formula protection.
import { describe, expect, it } from 'vitest'
import type { Account, Category, Transaction } from '@shared/types'
import { buildTransactionsCsv } from './csvExport'

const accounts: Account[] = [{ iban: 'BE00000000000001', name: 'Zichtrekening' }]
const categories: Category[] = [
  { id: 'wonen', name: 'Wonen', kind: 'expense' },
  { id: 'water', name: 'Water', kind: 'expense', parentId: 'wonen' }
]

function tx(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 't1',
    accountId: 'BE00000000000001',
    bookingDate: '2026-03-05',
    amountCents: -123456,
    currency: 'EUR',
    counterpartyName: 'Waterbedrijf',
    isInternalTransfer: false,
    importedFrom: 'x.csv',
    ...overrides
  }
}

function lines(csv: string): string[] {
  return csv.replace('﻿', '').split('\r\n')
}

describe('buildTransactionsCsv', () => {
  it('starts with a byte order mark and a header row', () => {
    const csv = buildTransactionsCsv([], accounts, categories)
    expect(csv.startsWith('﻿')).toBe(true)
    expect(lines(csv)[0]).toBe(
      'Datum;Rekening;Tegenpartij;IBAN tegenpartij;Mededeling;Bedrag;Categorie;Interne overboeking'
    )
  })

  it('writes a row with a Belgian date, a decimal comma and the account name', () => {
    const csv = buildTransactionsCsv([tx({ message: 'Factuur 12' })], accounts, categories)
    expect(lines(csv)[1]).toBe('05/03/2026;Zichtrekening;Waterbedrijf;;Factuur 12;-1234,56;;Nee')
  })

  it('writes the full category path and marks internal transfers', () => {
    const csv = buildTransactionsCsv(
      [tx({ categoryId: 'water', isInternalTransfer: true })],
      accounts,
      categories
    )
    expect(lines(csv)[1]).toContain(';Wonen > Water;Ja')
  })

  it('falls back to the account number and an empty category when unknown', () => {
    const csv = buildTransactionsCsv(
      [tx({ accountId: 'BE00000000000009', categoryId: 'gone' })],
      accounts,
      categories
    )
    expect(lines(csv)[1]).toContain(';BE00000000000009;')
    expect(lines(csv)[1]).toContain('-1234,56;;Nee')
  })

  it('quotes values with separators, quotes and line breaks', () => {
    const csv = buildTransactionsCsv([tx({ message: 'een; "twee"\nrij' })], accounts, categories)
    expect(csv).toContain('"een; ""twee""\nrij"')
  })

  it('neutralises text that a spreadsheet would run as a formula', () => {
    const csv = buildTransactionsCsv(
      [tx({ counterpartyName: '=SOM(A1)', message: '@bron' })],
      accounts,
      categories
    )
    expect(lines(csv)[1]).toContain(";'=SOM(A1);;'@bron;")
  })

  it('keeps negative amounts as numbers', () => {
    const csv = buildTransactionsCsv([tx({ amountCents: -5 })], accounts, categories)
    expect(lines(csv)[1]).toContain(';-0,05;')
  })

  it('ends with a line break', () => {
    expect(buildTransactionsCsv([tx()], accounts, categories).endsWith('\r\n')).toBe(true)
  })
})
