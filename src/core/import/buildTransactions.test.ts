// Tests that parsed rows become transactions with stable, distinct ids.
import { readFileSync } from 'fs'
import { join } from 'path'
import { describe, expect, it } from 'vitest'
import { buildTransactions } from './buildTransactions'
import { parseImportFile } from './parseImportFile'

const fixture = (name: string): Buffer =>
  readFileSync(join(__dirname, '../../../tests/fixtures', name))

describe('buildTransactions', () => {
  const rows = parseImportFile(fixture('belfius-basic.csv')).rows

  it('creates one transaction per row with the import source', () => {
    const transactions = buildTransactions(rows, 'basic.csv')
    expect(transactions).toHaveLength(rows.length)
    expect(transactions.every((transaction) => transaction.importedFrom === 'basic.csv')).toBe(true)
    expect(transactions.every((transaction) => !transaction.isInternalTransfer)).toBe(true)
  })

  it('carries over the bank fields', () => {
    const [first] = buildTransactions(rows, 'basic.csv')
    expect(first).toMatchObject({
      accountId: 'BE68539007547034',
      bookingDate: '2026-01-28',
      amountCents: -4530,
      currency: 'EUR'
    })
    expect(first.description).toContain('DEBITMASTERCARD')
  })

  it('produces the same ids for the same file every time', () => {
    const first = buildTransactions(rows, 'a.csv').map((transaction) => transaction.id)
    const second = buildTransactions(rows, 'b.csv').map((transaction) => transaction.id)
    expect(second).toEqual(first)
  })
})
