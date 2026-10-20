// Tests id stability, duplicate handling and overlapping imports.
import { describe, expect, it } from 'vitest'
import { assignTransactionIds, type IdentifiableRow } from './transactionId'

function buildRow(overrides: Partial<IdentifiableRow> = {}): IdentifiableRow {
  return {
    accountId: 'BE68539007547034',
    bookingDate: '2026-01-10',
    amountCents: -250,
    counterpartyName: 'Parking Centrum',
    message: 'Parkeren',
    ...overrides
  }
}

describe('assignTransactionIds', () => {
  it('gives the same ids when the same file is imported again', () => {
    const rows = [buildRow(), buildRow({ amountCents: -1000, message: 'Brood' })]
    expect(assignTransactionIds(rows)).toEqual(assignTransactionIds(rows))
  })

  it('keeps two identical rows on the same day as two distinct transactions', () => {
    const [first, second] = assignTransactionIds([buildRow(), buildRow()])
    expect(first).not.toBe(second)
  })

  it('gives the same ids to identical rows when that file is imported again', () => {
    const rows = [buildRow(), buildRow()]
    expect(assignTransactionIds(rows)).toEqual(assignTransactionIds(rows))
  })

  it('only treats rows from the non-overlapping period as new', () => {
    const parking = buildRow()
    const groceries = buildRow({ bookingDate: '2026-01-11', amountCents: -4500 })
    const salary = buildRow({ bookingDate: '2026-01-25', amountCents: 250000 })

    const fileA = assignTransactionIds([parking, parking, groceries])
    const fileB = assignTransactionIds([parking, parking, groceries, salary])

    const known = new Set(fileA)
    const fresh = fileB.filter((id) => !known.has(id))
    expect(fresh).toHaveLength(1)
  })

  it('does not depend on the position of other rows', () => {
    const parking = buildRow()
    const other = buildRow({ bookingDate: '2026-01-12', amountCents: -100 })
    const [alone] = assignTransactionIds([parking])
    const ids = assignTransactionIds([other, parking])
    expect(ids[1]).toBe(alone)
  })

  it('ignores whitespace differences in text fields', () => {
    const [plain] = assignTransactionIds([buildRow({ message: 'Betaling factuur 42' })])
    const [spaced] = assignTransactionIds([buildRow({ message: '  Betaling   factuur  42 ' })])
    expect(spaced).toBe(plain)
  })

  it('ignores case and spacing in IBANs', () => {
    const [plain] = assignTransactionIds([buildRow({ counterpartyIban: 'BE71096123456769' })])
    const [spaced] = assignTransactionIds([
      buildRow({ accountId: 'be68 5390 0754 7034', counterpartyIban: 'be71 0961 2345 6769' })
    ])
    expect(spaced).toBe(plain)
  })

  it('treats composed and decomposed accents as the same text', () => {
    const composed = 'Café Zoë'.normalize('NFC')
    const decomposed = composed.normalize('NFD')
    expect(decomposed).not.toBe(composed)
    const [fromComposed] = assignTransactionIds([buildRow({ counterpartyName: composed })])
    const [fromDecomposed] = assignTransactionIds([buildRow({ counterpartyName: decomposed })])
    expect(fromDecomposed).toBe(fromComposed)
  })

  it.each([
    ['account', { accountId: 'BE71096123456769' }],
    ['booking date', { bookingDate: '2026-01-11' }],
    ['amount', { amountCents: -251 }],
    ['counterparty', { counterpartyName: 'Andere' }],
    ['message', { message: 'Iets anders' }],
    ['statement number', { statementNumber: '12' }],
    ['transaction number', { transactionNumber: '99' }],
    ['description', { description: 'Andere omschrijving' }]
  ])('gives a different id when the %s differs', (_label, change) => {
    const [base] = assignTransactionIds([buildRow()])
    const [changed] = assignTransactionIds([buildRow(change)])
    expect(changed).not.toBe(base)
  })

  it('produces 24 character hexadecimal ids', () => {
    expect(assignTransactionIds([buildRow()])[0]).toMatch(/^[0-9a-f]{24}$/)
  })
})
