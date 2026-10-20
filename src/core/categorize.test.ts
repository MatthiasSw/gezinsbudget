// Tests manual categorization and clearing removed categories.
import { describe, expect, it } from 'vitest'
import type { Transaction } from '@shared/types'
import { clearCategories, setManualCategory } from './categorize'

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

describe('setManualCategory', () => {
  it('marks the chosen transactions as manually categorized', () => {
    const result = setManualCategory([tx('a'), tx('b')], new Set(['a']), 'food')
    expect(result[0]).toMatchObject({ categoryId: 'food', categorySource: 'manual' })
    expect(result[1].categoryId).toBeUndefined()
  })

  it('overrides a rule-based category', () => {
    const [result] = setManualCategory(
      [tx('a', { categoryId: 'fun', categorySource: 'rule' })],
      new Set(['a']),
      'food'
    )
    expect(result).toMatchObject({ categoryId: 'food', categorySource: 'manual' })
  })

  it('removes category and source when set to null', () => {
    const [result] = setManualCategory(
      [tx('a', { categoryId: 'fun', categorySource: 'manual' })],
      new Set(['a']),
      null
    )
    expect('categoryId' in result).toBe(false)
    expect('categorySource' in result).toBe(false)
  })

  it('does not mutate its input', () => {
    const input = [tx('a')]
    setManualCategory(input, new Set(['a']), 'food')
    expect(input[0].categoryId).toBeUndefined()
  })
})

describe('clearCategories', () => {
  it('removes the category and its source from transactions that use a removed category', () => {
    const transactions = [
      tx('a', { categoryId: 'gone', categorySource: 'manual' }),
      tx('b', { categoryId: 'kept', categorySource: 'rule' }),
      tx('c')
    ]
    const result = clearCategories(transactions, new Set(['gone']))
    expect(result[0]).not.toHaveProperty('categoryId')
    expect(result[0]).not.toHaveProperty('categorySource')
    expect(result[1]).toBe(transactions[1])
    expect(result[2]).toBe(transactions[2])
  })
})
