// Validates budgets and turns spending into progress against a yearly budget.
import { AppError } from './errors'
import type { Budget, Category } from './types'

const monthsPerYear = 12
const warningRatio = 0.8

export type BudgetStatus = 'ok' | 'warning' | 'over'

export type BudgetProgress = {
  budgetCents: number
  spentCents: number
  ratio: number
  status: BudgetStatus
}

export function yearBudgetCents(budget: Budget): number {
  return budget.period === 'month' ? budget.amountCents * monthsPerYear : budget.amountCents
}

export function budgetProgress(budget: Budget, spentCents: number): BudgetProgress {
  const budgetCents = yearBudgetCents(budget)
  const spent = Math.max(0, spentCents)
  const ratio = spent / budgetCents
  const status: BudgetStatus = ratio > 1 ? 'over' : ratio >= warningRatio ? 'warning' : 'ok'
  return { budgetCents, spentCents: spent, ratio, status }
}

export function keepBudgetableBudgets(budgets: Budget[], categories: Category[]): Budget[] {
  const expenseIds = new Set(
    categories.filter((category) => category.kind === 'expense').map((category) => category.id)
  )
  return budgets.filter((budget) => expenseIds.has(budget.categoryId))
}

export function assertValidBudgets(budgets: Budget[], categories: Category[]): void {
  const seen = new Set<string>()
  for (const budget of budgets) {
    if (!isPositiveAmount(budget.amountCents)) throw invalid('a budget needs a positive amount')
    if (budget.period !== 'month' && budget.period !== 'year') throw invalid('unknown period')
    if (seen.has(budget.categoryId)) throw invalid('a category has more than one budget')
    seen.add(budget.categoryId)
  }
  if (keepBudgetableBudgets(budgets, categories).length !== budgets.length) {
    throw invalid('a budget needs an existing expense category')
  }
}

function isPositiveAmount(cents: number): boolean {
  return (
    Number.isSafeInteger(cents) && cents > 0 && cents <= Number.MAX_SAFE_INTEGER / monthsPerYear
  )
}

function invalid(message: string): AppError {
  return new AppError('INVALID_BUDGETS', message)
}
