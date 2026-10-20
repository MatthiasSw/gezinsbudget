// Tests the conversion between budgets and their editable text form.
import { describe, expect, it } from 'vitest'
import type { Budget, Category } from '@shared/types'
import { budgetDraftProblem, fromBudgetDraft, toBudgetDraft } from './budgetDraft'

const categories: Category[] = [{ id: 'food', name: 'Eten', kind: 'expense' }]

describe('toBudgetDraft', () => {
  it('shows amounts with a decimal comma', () => {
    const budgets: Budget[] = [{ categoryId: 'food', period: 'month', amountCents: 15050 }]
    expect(toBudgetDraft(budgets)).toEqual({ food: { amount: '150,50', period: 'month' } })
  })
})

describe('fromBudgetDraft', () => {
  it('turns the typed amounts into cents and skips empty fields', () => {
    const draft = {
      food: { amount: '1.500,5', period: 'year' as const },
      fun: { amount: '  ', period: 'month' as const }
    }
    expect(fromBudgetDraft(draft)).toEqual([
      { categoryId: 'food', period: 'year', amountCents: 150050 }
    ])
  })

  it('round-trips with toBudgetDraft', () => {
    const budgets: Budget[] = [{ categoryId: 'food', period: 'month', amountCents: 60000 }]
    expect(fromBudgetDraft(toBudgetDraft(budgets))).toEqual(budgets)
  })
})

describe('budgetDraftProblem', () => {
  it('accepts valid and empty amounts', () => {
    expect(budgetDraftProblem({ food: { amount: '150', period: 'month' } }, categories)).toBeNull()
    expect(budgetDraftProblem({ food: { amount: '', period: 'month' } }, categories)).toBeNull()
  })

  it.each(['abc', '0', '-5', '1,234'])('names the category for the amount "%s"', (amount) => {
    const problem = budgetDraftProblem({ food: { amount, period: 'month' } }, categories)
    expect(problem).toContain('‘Eten’')
  })
})
