// Tests that the chart series match the overview table figures.
import { describe, expect, it } from 'vitest'
import type { OverviewRow, OverviewTable } from '@shared/overview'
import {
  activeMonths,
  categoryEvolution,
  monthlyTotalsSeries,
  spendingByCategory
} from './chartData'

function row(overrides: Partial<OverviewRow>): OverviewRow {
  return {
    categoryId: 'x',
    name: 'X',
    icon: '',
    parentId: null,
    depth: 0,
    perMonth: {},
    totalCents: 0,
    ...overrides
  }
}

const overview: OverviewTable = {
  months: ['2026-01', '2026-02'],
  rows: [
    row({
      categoryId: 'groceries',
      name: 'Boodschappen',
      perMonth: { '2026-01': -10000, '2026-02': -5000 },
      totalCents: -15000
    }),
    row({
      categoryId: 'fruit',
      name: 'Fruit',
      parentId: 'groceries',
      depth: 1,
      perMonth: { '2026-01': -2000 },
      totalCents: -2000
    }),
    row({
      categoryId: 'salary',
      name: 'Loon',
      perMonth: { '2026-01': 200000, '2026-02': 200000 },
      totalCents: 400000
    }),
    row({
      categoryId: 'fun',
      name: 'Vrije tijd',
      perMonth: { '2026-02': -30000 },
      totalCents: -30000
    }),
    row({ categoryId: null, name: '', perMonth: { '2026-01': -1000 }, totalCents: -1000 })
  ],
  perMonthTotals: {
    '2026-01': { incomeCents: 200000, expenseCents: 13000, netCents: 187000 },
    '2026-02': { incomeCents: 200000, expenseCents: 35000, netCents: 165000 }
  },
  totals: { incomeCents: 400000, expenseCents: 48000, netCents: 352000 }
}

describe('monthlyTotalsSeries', () => {
  it('lists income, expense and net per month with Dutch labels', () => {
    expect(monthlyTotalsSeries(overview)).toEqual([
      {
        month: '2026-01',
        label: 'jan 2026',
        incomeCents: 200000,
        expenseCents: 13000,
        netCents: 187000
      },
      {
        month: '2026-02',
        label: 'feb 2026',
        incomeCents: 200000,
        expenseCents: 35000,
        netCents: 165000
      }
    ])
  })
})

describe('categoryEvolution', () => {
  it('returns absolute amounts per chosen category and month', () => {
    const points = categoryEvolution(overview, ['groceries', 'fruit'])
    expect(points[0].centsByCategory).toEqual({ groceries: 10000, fruit: 2000 })
    expect(points[1].centsByCategory).toEqual({ groceries: 5000, fruit: 0 })
  })

  it('ignores unknown categories', () => {
    expect(categoryEvolution(overview, ['ghost'])[0].centsByCategory).toEqual({})
  })
})

describe('spendingByCategory', () => {
  it('lists main categories with spending for the whole year, largest first', () => {
    expect(spendingByCategory(overview, 'year', false)).toEqual([
      { categoryId: 'fun', name: 'Vrije tijd', depth: 0, cents: 30000 },
      { categoryId: 'groceries', name: 'Boodschappen', depth: 0, cents: 15000 }
    ])
  })

  it('uses one month when asked', () => {
    const entries = spendingByCategory(overview, '2026-01', false)
    expect(entries.map((entry) => [entry.name, entry.cents])).toEqual([['Boodschappen', 10000]])
  })

  it('leaves out the uncategorised row, subcategories and income by default', () => {
    const names = spendingByCategory(overview, 'year', false).map((entry) => entry.name)
    expect(names).toEqual(['Vrije tijd', 'Boodschappen'])
  })

  it('adds subcategories right under their parent, each level largest first', () => {
    const entries = spendingByCategory(overview, 'year', true)
    expect(entries.map((entry) => [entry.depth, entry.cents])).toEqual([
      [0, 30000],
      [0, 15000],
      [1, 2000]
    ])
    expect(entries[2].name).toContain('Fruit')
  })

  it('sorts subcategories largest first', () => {
    const withSiblings: OverviewTable = {
      ...overview,
      rows: [
        ...overview.rows,
        row({
          categoryId: 'bread',
          name: 'Brood',
          parentId: 'groceries',
          depth: 1,
          perMonth: { '2026-01': -5000 },
          totalCents: -5000
        })
      ]
    }
    const subs = spendingByCategory(withSiblings, 'year', true).filter((entry) => entry.depth === 1)
    expect(subs.map((entry) => entry.cents)).toEqual([5000, 2000])
  })
})

describe('activeMonths', () => {
  it('drops trailing months without any income or expense', () => {
    const months = ['2026-01', '2026-02', '2026-03', '2026-04']
    const empty = { incomeCents: 0, expenseCents: 0, netCents: 0 }
    const sparse: OverviewTable = {
      ...overview,
      months,
      perMonthTotals: { ...overview.perMonthTotals, '2026-03': empty, '2026-04': empty }
    }
    expect(activeMonths(sparse)).toEqual(['2026-01', '2026-02'])
  })

  it('keeps empty months between months with data', () => {
    const empty = { incomeCents: 0, expenseCents: 0, netCents: 0 }
    const gap: OverviewTable = {
      ...overview,
      months: ['2026-01', '2026-02', '2026-03'],
      perMonthTotals: {
        '2026-01': overview.perMonthTotals['2026-01'],
        '2026-02': empty,
        '2026-03': overview.perMonthTotals['2026-02']
      }
    }
    expect(activeMonths(gap)).toHaveLength(3)
  })

  it('is empty without any data', () => {
    expect(activeMonths({ ...overview, months: [], perMonthTotals: {} })).toEqual([])
  })
})
