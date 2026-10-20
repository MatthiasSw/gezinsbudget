// Tests sorting by each column, direction toggling and blank categories.
import { describe, expect, it } from 'vitest'
import type { Account, Category, Transaction } from '@shared/types'
import { defaultSort, nextSort, sortTransactions } from './transactionSort'

const accounts: Account[] = [
  { iban: 'BE68539007547034', name: 'Zichtrekening' },
  { iban: 'BE71096123456769', name: 'Spaarrekening' }
]
const categories: Category[] = [
  { id: 'food', name: 'Boodschappen', kind: 'expense' },
  { id: 'fun', name: 'Vrije tijd', kind: 'expense' }
]

function tx(id: string, overrides: Partial<Transaction>): Transaction {
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

const list = [
  tx('a', {
    bookingDate: '2026-01-05',
    amountCents: -500,
    counterpartyName: 'Émile',
    categoryId: 'fun'
  }),
  tx('b', {
    bookingDate: '2026-01-20',
    amountCents: 2500,
    counterpartyName: 'Aldi',
    accountId: 'BE71096123456769'
  }),
  tx('c', {
    bookingDate: '2026-01-12',
    amountCents: -9000,
    counterpartyName: 'Zora',
    categoryId: 'food'
  })
]

const ids = (sorted: Transaction[]): string[] => sorted.map((item) => item.id)

describe('sortTransactions', () => {
  it('sorts by date in both directions', () => {
    expect(
      ids(sortTransactions(list, { key: 'date', direction: 'asc' }, accounts, categories))
    ).toEqual(['a', 'c', 'b'])
    expect(
      ids(sortTransactions(list, { key: 'date', direction: 'desc' }, accounts, categories))
    ).toEqual(['b', 'c', 'a'])
  })

  it('sorts by amount as a number', () => {
    expect(
      ids(sortTransactions(list, { key: 'amount', direction: 'asc' }, accounts, categories))
    ).toEqual(['c', 'a', 'b'])
  })

  it('sorts by counterparty ignoring accents and case', () => {
    expect(
      ids(sortTransactions(list, { key: 'counterparty', direction: 'asc' }, accounts, categories))
    ).toEqual(['b', 'a', 'c'])
  })

  it('sorts by account name', () => {
    expect(
      ids(sortTransactions(list, { key: 'account', direction: 'asc' }, accounts, categories))[0]
    ).toBe('b')
  })

  it('sorts by category name and keeps uncategorised ones last in both directions', () => {
    expect(
      ids(sortTransactions(list, { key: 'category', direction: 'asc' }, accounts, categories))
    ).toEqual(['c', 'a', 'b'])
    expect(
      ids(sortTransactions(list, { key: 'category', direction: 'desc' }, accounts, categories))
    ).toEqual(['a', 'c', 'b'])
  })

  it('does not change the original list', () => {
    const copy = [...list]
    sortTransactions(list, defaultSort, accounts, categories)
    expect(list).toEqual(copy)
  })
})

describe('nextSort', () => {
  it('flips the direction when the same column is clicked again', () => {
    expect(nextSort({ key: 'date', direction: 'desc' }, 'date')).toEqual({
      key: 'date',
      direction: 'asc'
    })
  })

  it('starts dates and amounts descending and text ascending', () => {
    expect(nextSort(defaultSort, 'amount')).toEqual({ key: 'amount', direction: 'desc' })
    expect(nextSort(defaultSort, 'counterparty')).toEqual({ key: 'counterparty', direction: 'asc' })
  })
})
