// Tests the insights (facts, top lists and movers) on fictional transactions.
import { describe, expect, it } from 'vitest'
import type { Category, Transaction } from '@shared/types'
import { computeInsights, type InsightRequest } from './insights'

const categories: Category[] = [
  { id: 'food', name: 'Eten', kind: 'expense' },
  { id: 'shop', name: 'Winkel', kind: 'expense', parentId: 'food' },
  { id: 'fun', name: 'Plezier', kind: 'expense' },
  { id: 'pay', name: 'Loon', kind: 'income' }
]

const request: InsightRequest = {
  period: { from: '2026-01-01', to: '2026-06-30' },
  previous: { from: '2025-01-01', to: '2025-06-30' }
}

let counter = 0

function tx(
  bookingDate: string,
  amountCents: number,
  overrides: Partial<Transaction> = {}
): Transaction {
  counter += 1
  return {
    id: `t${counter}`,
    accountId: 'BE00000000000001',
    bookingDate,
    amountCents,
    currency: 'EUR',
    counterpartyName: `Winkel ${counter}`,
    isInternalTransfer: false,
    importedFrom: 'x.csv',
    ...overrides
  }
}

function fact(insights: ReturnType<typeof computeInsights>, kind: string): unknown {
  return insights.facts.find((item) => item.kind === kind)
}

describe('computeInsights', () => {
  it('returns nothing without spending', () => {
    const insights = computeInsights([tx('2026-02-01', 100000)], categories, request)
    expect(insights.facts).toEqual([])
    expect(insights.topExpenses).toEqual([])
    expect(insights.hasPreviousPeriod).toBe(false)
  })

  it('ranks the biggest single expenses and ignores income and internal transfers', () => {
    const transactions = [
      tx('2026-01-10', -5000, { counterpartyName: 'Klein' }),
      tx('2026-02-10', -90000, { counterpartyName: 'Groot', categoryId: 'fun' }),
      tx('2026-03-10', -70000, { counterpartyName: 'Middel' }),
      tx('2026-03-11', 999999),
      tx('2026-03-12', -800000, { isInternalTransfer: true })
    ]
    const { topExpenses } = computeInsights(transactions, categories, request)
    expect(topExpenses.map((item) => item.counterparty)).toEqual(['Groot', 'Middel', 'Klein'])
    expect(topExpenses[0]).toMatchObject({ amountCents: 90000, categoryId: 'fun' })
  })

  it('limits the top expenses to ten', () => {
    const transactions = Array.from({ length: 15 }, (_, index) =>
      tx('2026-02-01', -(index + 1) * 100)
    )
    expect(computeInsights(transactions, categories, request).topExpenses).toHaveLength(10)
  })

  it('totals the top counterparties regardless of case and accents', () => {
    const transactions = [
      tx('2026-01-10', -1000, { counterpartyName: 'Café Zoë' }),
      tx('2026-02-10', -2000, { counterpartyName: 'CAFE ZOE' }),
      tx('2026-02-11', -2500, { counterpartyName: 'Bakker' })
    ]
    const { topCounterparties } = computeInsights(transactions, categories, request)
    expect(topCounterparties[0]).toMatchObject({ totalCents: 3000, count: 2 })
    expect(topCounterparties[1]).toMatchObject({ name: 'Bakker', totalCents: 2500 })
  })

  it('computes the average per month over the months of the period', () => {
    const transactions = [tx('2026-01-10', -60000), tx('2026-04-10', -60000)]
    expect(fact(computeInsights(transactions, categories, request), 'averagePerMonth')).toEqual({
      kind: 'averagePerMonth',
      cents: 20000,
      months: 6
    })
  })

  it('finds the priciest and cheapest complete months, but not with too few months', () => {
    const few = [tx('2026-01-10', -1000), tx('2026-02-10', -2000)]
    expect(fact(computeInsights(few, categories, request), 'priciestMonth')).toBeUndefined()

    const many = [
      tx('2026-01-10', -1000),
      tx('2026-02-10', -5000),
      tx('2026-03-10', -3000),
      tx('2026-03-20', -500)
    ]
    const insights = computeInsights(many, categories, request)
    expect(fact(insights, 'priciestMonth')).toMatchObject({ month: '2026-02', cents: 5000 })
    expect(fact(insights, 'cheapestMonth')).toMatchObject({ month: '2026-01', cents: 1000 })
  })

  it('ignores a month that is not finished when picking the cheapest month', () => {
    const transactions = [
      tx('2026-01-10', -4000),
      tx('2026-02-10', -5000),
      tx('2026-03-10', -3000),
      tx('2026-04-02', -100)
    ]
    const partial: InsightRequest = { ...request, period: { from: '2026-01-01', to: '2026-04-10' } }
    expect(fact(computeInsights(transactions, categories, partial), 'cheapestMonth')).toMatchObject(
      {
        month: '2026-03'
      }
    )
  })

  it('counts a subcategory toward its main category for the biggest category', () => {
    const transactions = [
      tx('2026-01-10', -3000, { categoryId: 'food' }),
      tx('2026-01-11', -4000, { categoryId: 'shop' }),
      tx('2026-01-12', -5000, { categoryId: 'fun' })
    ]
    expect(fact(computeInsights(transactions, categories, request), 'biggestCategory')).toEqual({
      kind: 'biggestCategory',
      categoryId: 'food',
      cents: 7000,
      percent: 58
    })
  })

  it('finds the most visited counterparty from three visits on', () => {
    const twice = [
      tx('2026-01-01', -100, { counterpartyName: 'A' }),
      tx('2026-01-02', -100, { counterpartyName: 'A' })
    ]
    expect(
      fact(computeInsights(twice, categories, request), 'mostVisitedCounterparty')
    ).toBeUndefined()

    const thrice = [...twice, tx('2026-01-03', -300, { counterpartyName: 'A' })]
    expect(fact(computeInsights(thrice, categories, request), 'mostVisitedCounterparty')).toEqual({
      kind: 'mostVisitedCounterparty',
      name: 'A',
      count: 3,
      totalCents: 500
    })
  })

  it('finds the weekday with the most spending once there is enough data', () => {
    const fridays = Array.from({ length: 12 }, (_, index) =>
      tx(`2026-03-${String(6 + (index % 3) * 7).padStart(2, '0')}`, -1000)
    )
    const others = Array.from({ length: 10 }, () => tx('2026-03-10', -100))
    const insights = computeInsights([...fridays, ...others], categories, request)
    expect(fact(insights, 'busiestWeekday')).toMatchObject({ weekday: 5 })
  })

  it('computes how much of the income was kept', () => {
    const transactions = [tx('2026-01-25', 200000), tx('2026-02-02', -150000)]
    expect(fact(computeInsights(transactions, categories, request), 'savingsRate')).toEqual({
      kind: 'savingsRate',
      percent: 25,
      savedCents: 50000
    })
  })

  it('reports a negative savings rate when more was spent than earned', () => {
    const transactions = [tx('2026-01-25', 100000), tx('2026-02-02', -150000)]
    expect(fact(computeInsights(transactions, categories, request), 'savingsRate')).toMatchObject({
      percent: -50
    })
  })

  it('counts expenses without a category', () => {
    const transactions = [tx('2026-01-01', -100), tx('2026-01-02', -100, { categoryId: 'fun' })]
    expect(fact(computeInsights(transactions, categories, request), 'uncategorized')).toEqual({
      kind: 'uncategorized',
      count: 1
    })
  })

  it('shows a recurring payment once, with its biggest amount and how often it occurred', () => {
    const mortgage = ['2026-01-02', '2026-02-02', '2026-03-02', '2026-04-02'].map((date, index) =>
      tx(date, -(120000 + index * 100), { counterpartyName: 'Bank hypotheek' })
    )
    const holiday = tx('2026-03-10', -80000, { counterpartyName: 'Reisbureau' })
    const { topExpenses } = computeInsights([...mortgage, holiday], categories, request)

    expect(topExpenses.map((item) => item.counterparty)).toEqual(['Bank hypotheek', 'Reisbureau'])
    expect(topExpenses[0]).toMatchObject({ amountCents: 120300, count: 4 })
    expect(topExpenses[1]).toMatchObject({ amountCents: 80000, count: 1 })
  })

  it('counts only the occurrences inside the period of a recurring payment', () => {
    const subscription = ['2025-12-05', '2026-01-05', '2026-02-05', '2026-03-05'].map((date) =>
      tx(date, -1299, { counterpartyName: 'Streamdienst' })
    )
    const { topExpenses } = computeInsights(subscription, categories, request)
    expect(topExpenses).toHaveLength(1)
    expect(topExpenses[0].count).toBe(3)
  })

  it('leaves categories that do not count in the totals out of every insight', () => {
    const withExcluded: Category[] = [
      ...categories,
      { id: 'work', name: 'Onkosten werkgever', kind: 'expense', excludedFromTotals: true }
    ]
    const transactions = [
      tx('2026-01-10', -2200, { counterpartyName: 'Parking', categoryId: 'work' }),
      tx('2026-01-11', -3000, { counterpartyName: 'Bakker' })
    ]
    const { topExpenses, topCounterparties } = computeInsights(transactions, withExcluded, request)
    expect(topExpenses.map((item) => item.counterparty)).toEqual(['Bakker'])
    expect(topCounterparties.map((item) => item.name)).toEqual(['Bakker'])
  })

  it('filters on the chosen account', () => {
    const transactions = [
      tx('2026-01-01', -1000),
      tx('2026-01-02', -9000, { accountId: 'BE00000000000002' })
    ]
    const { topExpenses } = computeInsights(transactions, categories, {
      ...request,
      accountIds: ['BE00000000000002']
    })
    expect(topExpenses).toHaveLength(1)
    expect(topExpenses[0].amountCents).toBe(9000)
  })
})

describe('movers', () => {
  const previousYear = [
    tx('2025-02-01', -20000, { categoryId: 'food' }),
    tx('2025-02-02', -10000, { categoryId: 'fun' }),
    tx('2025-02-03', -50000, { categoryId: 'shop' })
  ]

  it('compares main categories with the same period a year earlier', () => {
    const transactions = [
      ...previousYear,
      tx('2026-02-01', -50000, { categoryId: 'food' }),
      tx('2026-02-02', -2000, { categoryId: 'fun' })
    ]
    const insights = computeInsights(transactions, categories, request)
    expect(insights.hasPreviousPeriod).toBe(true)
    expect(insights.risers).toEqual([])
    expect(insights.fallers.map((mover) => [mover.categoryId, mover.changeCents])).toEqual([
      ['food', -20000],
      ['fun', -8000]
    ])
  })

  it('finds risers and ignores changes below five euro', () => {
    const transactions = [
      ...previousYear,
      tx('2026-02-01', -90000, { categoryId: 'fun' }),
      tx('2026-02-02', -70000, { categoryId: 'food' }),
      tx('2026-02-03', -100, { categoryId: 'food' })
    ]
    const insights = computeInsights(transactions, categories, request)
    expect(insights.risers.map((mover) => mover.categoryId)).toEqual(['fun'])
    expect(insights.fallers).toEqual([])
  })
})
