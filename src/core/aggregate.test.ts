// Tests category-by-month totals against hand-calculated numbers.
import { describe, expect, it } from 'vitest'
import type { Category, Transaction } from '@shared/types'
import { totalsByCategoryAndMonth } from './aggregate'

const categories: Category[] = [
  { id: 'food', name: 'Eten', kind: 'expense' },
  { id: 'groceries', name: 'Boodschappen', kind: 'expense', parentId: 'food' },
  { id: 'restaurant', name: 'Restaurant', kind: 'expense', parentId: 'food' },
  { id: 'fun', name: 'Vrije tijd', kind: 'expense' },
  { id: 'salary', name: 'Loon', kind: 'income' },
  { id: 'unused', name: 'Ongebruikt', kind: 'expense' }
]

function tx(
  id: string,
  bookingDate: string,
  amountCents: number,
  overrides: Partial<Transaction> = {}
): Transaction {
  return {
    id,
    accountId: 'BE68539007547034',
    bookingDate,
    amountCents,
    currency: 'EUR',
    isInternalTransfer: false,
    importedFrom: 'x.csv',
    ...overrides
  }
}

const transactions: Transaction[] = [
  tx('g1', '2026-01-05', -4500, { categoryId: 'groceries' }),
  tx('g2', '2026-02-10', -3000, { categoryId: 'groceries' }),
  tx('r1', '2026-01-20', -2500, { categoryId: 'restaurant' }),
  tx('f1', '2026-01-25', -1000, { categoryId: 'food' }),
  tx('v1', '2026-02-01', -800, { categoryId: 'fun' }),
  tx('refund', '2026-02-15', 500, { categoryId: 'fun' }),
  tx('pay1', '2026-01-28', 250000, { categoryId: 'salary' }),
  tx('pay2', '2026-02-28', 250000, { categoryId: 'salary' }),
  tx('none', '2026-02-12', -1200),
  tx('transfer-out', '2026-01-12', -20000, { isInternalTransfer: true, categoryId: 'fun' }),
  tx('outside', '2025-12-31', -9999, { categoryId: 'fun' })
]

const request = { from: '2026-01-01', to: '2026-03-31' }
const table = totalsByCategoryAndMonth(transactions, categories, request)
const row = (id: string | null): (typeof table.rows)[number] =>
  table.rows.find((candidate) => candidate.categoryId === id)!

describe('totalsByCategoryAndMonth', () => {
  it('lists every month in the range, also empty ones', () => {
    expect(table.months).toEqual(['2026-01', '2026-02', '2026-03'])
  })

  it('keeps expenses negative and income positive per category and month', () => {
    expect(row('groceries').perMonth).toEqual({ '2026-01': -4500, '2026-02': -3000, '2026-03': 0 })
    expect(row('salary').perMonth).toEqual({ '2026-01': 250000, '2026-02': 250000, '2026-03': 0 })
  })

  it('makes a parent the sum of its children plus its own transactions', () => {
    expect(row('food').perMonth['2026-01']).toBe(-4500 - 2500 - 1000)
    expect(row('food').perMonth['2026-02']).toBe(-3000)
    expect(row('food').totalCents).toBe(-4500 - 2500 - 1000 - 3000)
  })

  it('lets a refund reduce the expenses of its category', () => {
    expect(row('fun').perMonth['2026-02']).toBe(-800 + 500)
  })

  it('excludes internal transfers and rows outside the range', () => {
    expect(row('fun').perMonth['2026-01']).toBe(0)
    expect(row('fun').totalCents).toBe(-300)
  })

  it('puts transactions without category in a separate row', () => {
    expect(row(null).totalCents).toBe(-1200)
    expect(row(null).perMonth['2026-02']).toBe(-1200)
  })

  it('treats a category id that no longer exists as uncategorized', () => {
    const result = totalsByCategoryAndMonth(
      [tx('x', '2026-01-02', -100, { categoryId: 'gone' })],
      categories,
      request
    )
    expect(result.rows).toHaveLength(1)
    expect(result.rows[0].categoryId).toBeNull()
  })

  it('omits categories without transactions', () => {
    expect(table.rows.some((candidate) => candidate.categoryId === 'unused')).toBe(false)
  })

  it('orders rows as a tree: income, then parents followed by their children, then uncategorized', () => {
    expect(table.rows.map((candidate) => `${candidate.depth}:${candidate.categoryId}`)).toEqual([
      '0:salary',
      '0:food',
      '1:groceries',
      '1:restaurant',
      '0:fun',
      '0:null'
    ])
  })

  it('reports where each row sits in the tree', () => {
    expect(row('groceries').parentId).toBe('food')
    expect(row('food').parentId).toBeNull()
  })

  it('computes income, expenses and net per month and in total', () => {
    expect(table.perMonthTotals['2026-01']).toEqual({
      incomeCents: 250000,
      expenseCents: 4500 + 2500 + 1000,
      netCents: 250000 - 8000
    })
    expect(table.perMonthTotals['2026-03']).toEqual({
      incomeCents: 0,
      expenseCents: 0,
      netCents: 0
    })
    expect(table.totals).toEqual({
      incomeCents: 500000 + 500,
      expenseCents: 4500 + 3000 + 2500 + 1000 + 800 + 1200,
      netCents: 500000 + 500 - (4500 + 3000 + 2500 + 1000 + 800 + 1200)
    })
  })

  it('has net equal to the sum of all category rows without parents counted twice', () => {
    const roots = table.rows.filter((candidate) => candidate.parentId === null)
    expect(roots.reduce((sum, candidate) => sum + candidate.totalCents, 0)).toBe(
      table.totals.netCents
    )
  })

  it('filters by account', () => {
    const other = [
      tx('a', '2026-01-02', -100, { categoryId: 'fun' }),
      tx('b', '2026-01-02', -200, { categoryId: 'fun', accountId: 'BE71096123456769' })
    ]
    const result = totalsByCategoryAndMonth(other, categories, {
      ...request,
      accountIds: ['BE71 0961 2345 6769']
    })
    expect(result.totals.expenseCents).toBe(200)
  })

  it('returns an empty table for no transactions', () => {
    const result = totalsByCategoryAndMonth([], categories, request)
    expect(result.rows).toEqual([])
    expect(result.totals).toEqual({ incomeCents: 0, expenseCents: 0, netCents: 0 })
  })
})

describe('category icons in the overview', () => {
  it('carries the chosen or default icon of each category', () => {
    const withIcons: Category[] = [
      { id: 'a', name: 'Boodschappen', kind: 'expense' },
      { id: 'b', name: 'Huisdier', kind: 'expense', icon: '🐶' },
      { id: 'c', name: 'Onbekend', kind: 'expense' }
    ]
    const items = ['a', 'b', 'c'].map((id) => tx(id, '2026-01-05', -100, { categoryId: id }))
    const result = totalsByCategoryAndMonth(items, withIcons, {
      from: '2026-01-01',
      to: '2026-01-31'
    })
    expect(result.rows.map((item) => item.icon)).toEqual(['🛒', '🐶', ''])
  })
})
