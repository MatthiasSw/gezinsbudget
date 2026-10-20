// Tests budget validation, pruning and progress against the yearly budget.
import { describe, expect, it } from 'vitest'
import {
  assertValidBudgets,
  budgetProgress,
  keepBudgetableBudgets,
  yearBudgetCents
} from './budgets'
import type { Budget, Category } from './types'

const categories: Category[] = [
  { id: 'food', name: 'Eten', kind: 'expense' },
  { id: 'pay', name: 'Loon', kind: 'income' }
]

function budget(overrides: Partial<Budget> = {}): Budget {
  return { categoryId: 'food', period: 'month', amountCents: 20000, ...overrides }
}

describe('yearBudgetCents', () => {
  it('multiplies a monthly budget by twelve and keeps a yearly budget as it is', () => {
    expect(yearBudgetCents(budget({ period: 'month', amountCents: 20000 }))).toBe(240000)
    expect(yearBudgetCents(budget({ period: 'year', amountCents: 50000 }))).toBe(50000)
  })
})

describe('budgetProgress', () => {
  const yearly = budget({ period: 'year', amountCents: 100000 })

  it('is ok below 80 percent', () => {
    expect(budgetProgress(yearly, 79999)).toMatchObject({ status: 'ok', spentCents: 79999 })
  })

  it('warns from 80 percent up to and including the budget', () => {
    expect(budgetProgress(yearly, 80000).status).toBe('warning')
    expect(budgetProgress(yearly, 100000).status).toBe('warning')
  })

  it('is over budget above 100 percent', () => {
    const progress = budgetProgress(yearly, 125000)
    expect(progress.status).toBe('over')
    expect(progress.ratio).toBe(1.25)
  })

  it('treats refunds as no spending', () => {
    expect(budgetProgress(yearly, -5000)).toMatchObject({ spentCents: 0, ratio: 0, status: 'ok' })
  })
})

describe('keepBudgetableBudgets', () => {
  it('drops budgets of removed or non-expense categories', () => {
    const budgets = [budget(), budget({ categoryId: 'pay' }), budget({ categoryId: 'gone' })]
    expect(keepBudgetableBudgets(budgets, categories)).toEqual([budget()])
  })
})

describe('assertValidBudgets', () => {
  it('accepts valid budgets', () => {
    expect(() => assertValidBudgets([budget()], categories)).not.toThrow()
  })

  it.each([
    ['a zero amount', [budget({ amountCents: 0 })]],
    ['a negative amount', [budget({ amountCents: -100 })]],
    ['a fractional amount', [budget({ amountCents: 10.5 })]],
    ['an unknown period', [budget({ period: 'week' as Budget['period'] })]],
    ['a duplicate category', [budget(), budget({ period: 'year' })]],
    ['an income category', [budget({ categoryId: 'pay' })]],
    ['an unknown category', [budget({ categoryId: 'gone' })]]
  ])('rejects %s', (_label, budgets) => {
    expect(() => assertValidBudgets(budgets, categories)).toThrowError(
      expect.objectContaining({ code: 'INVALID_BUDGETS' })
    )
  })
})
