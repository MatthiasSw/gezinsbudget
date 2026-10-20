// Tests every filter of the transaction list.
import { describe, expect, it } from 'vitest'
import type { TransactionQuery } from '@shared/transactionQuery'
import type { Category, Transaction } from '@shared/types'
import { filterTransactions } from './transactionFilter'

const categories: Category[] = [
  { id: 'food', name: 'Eten', kind: 'expense' },
  { id: 'groceries', name: 'Boodschappen', kind: 'expense', parentId: 'food' },
  { id: 'fun', name: 'Vrije tijd', kind: 'expense' }
]

function tx(id: string, overrides: Partial<Transaction> = {}): Transaction {
  return {
    id,
    accountId: 'BE68539007547034',
    bookingDate: '2026-01-10',
    amountCents: -1000,
    currency: 'EUR',
    isInternalTransfer: false,
    importedFrom: 'x.csv',
    ...overrides
  }
}

const base: TransactionQuery = { internal: 'show' }
const ids = (list: Transaction[]): string[] => list.map((transaction) => transaction.id)

describe('filterTransactions', () => {
  it('sorts newest first, then by id', () => {
    const result = filterTransactions(
      [
        tx('b', { bookingDate: '2026-01-01' }),
        tx('c', { bookingDate: '2026-02-01' }),
        tx('a', { bookingDate: '2026-01-01' })
      ],
      base,
      categories
    )
    expect(ids(result)).toEqual(['c', 'a', 'b'])
  })

  it('filters by account', () => {
    const list = [tx('a'), tx('b', { accountId: 'BE71096123456769' })]
    expect(
      ids(filterTransactions(list, { ...base, accountIds: ['BE71 0961 2345 6769'] }, categories))
    ).toEqual(['b'])
    expect(ids(filterTransactions(list, { ...base, accountIds: [] }, categories))).toEqual([
      'a',
      'b'
    ])
  })

  it('filters by inclusive date range', () => {
    const list = [
      tx('early', { bookingDate: '2026-01-01' }),
      tx('mid', { bookingDate: '2026-01-15' }),
      tx('late', { bookingDate: '2026-01-31' })
    ]
    const result = filterTransactions(
      list,
      { ...base, from: '2026-01-15', to: '2026-01-31' },
      categories
    )
    expect(ids(result)).toEqual(['late', 'mid'])
  })

  it('includes subcategories when filtering on a parent category', () => {
    const list = [
      tx('a', { categoryId: 'groceries' }),
      tx('b', { categoryId: 'food' }),
      tx('c', { categoryId: 'fun' }),
      tx('d')
    ]
    expect(
      ids(filterTransactions(list, { ...base, categoryId: 'food' }, categories)).sort()
    ).toEqual(['a', 'b'])
  })

  it('finds uncategorized transactions', () => {
    const list = [tx('a', { categoryId: 'fun' }), tx('b')]
    expect(
      ids(filterTransactions(list, { ...base, categoryId: 'uncategorized' }, categories))
    ).toEqual(['b'])
  })

  it.each([
    ['hide', ['a']],
    ['only', ['b']],
    ['show', ['a', 'b']]
  ] as const)('handles internal transfers in %s mode', (mode, expected) => {
    const list = [tx('a'), tx('b', { isInternalTransfer: true })]
    expect(ids(filterTransactions(list, { ...base, internal: mode }, categories))).toEqual(expected)
  })

  describe('search', () => {
    const list = [
      tx('cafe', { counterpartyName: 'Café Zoë', amountCents: -840 }),
      tx('salary', {
        counterpartyName: 'Zonnebloem NV',
        message: 'Loon januari',
        amountCents: 234567
      }),
      tx('iban', { counterpartyIban: 'BE62510007547061', description: 'Overschrijving' })
    ]
    const search = (text: string): string[] =>
      ids(filterTransactions(list, { ...base, search: text }, categories))

    it('ignores case and accents', () => {
      expect(search('CAFE ZOE')).toEqual(['cafe'])
      expect(search('café')).toEqual(['cafe'])
    })

    it('searches name, message, description and IBAN', () => {
      expect(search('zonnebloem')).toEqual(['salary'])
      expect(search('januari')).toEqual(['salary'])
      expect(search('overschrijving')).toEqual(['iban'])
      expect(search('5100075')).toEqual(['iban'])
    })

    it('searches the amount as text, with and without sign', () => {
      expect(search('8,40')).toEqual(['cafe'])
      expect(search('-8,40')).toEqual(['cafe'])
      expect(search('2345,67')).toEqual(['salary'])
    })

    it('requires every word to match', () => {
      expect(search('zonnebloem loon')).toEqual(['salary'])
      expect(search('zonnebloem cafe')).toEqual([])
    })

    it('returns everything for an empty search', () => {
      expect(search('   ')).toHaveLength(3)
    })
  })
})
