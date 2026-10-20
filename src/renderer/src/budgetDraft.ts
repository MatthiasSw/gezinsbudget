// Converts budgets to editable text fields and back, and checks what the user typed.
import { formatCentsPlain, parseAmountToCents } from '@shared/money'
import type { Budget, BudgetPeriod, Category } from '@shared/types'

export type BudgetDraftEntry = {
  amount: string
  period: BudgetPeriod
}

export type BudgetDraft = Record<string, BudgetDraftEntry>

export const defaultBudgetPeriod: BudgetPeriod = 'month'

export function toBudgetDraft(budgets: Budget[]): BudgetDraft {
  return Object.fromEntries(
    budgets.map((budget) => [
      budget.categoryId,
      { amount: formatCentsPlain(budget.amountCents), period: budget.period }
    ])
  )
}

export function fromBudgetDraft(draft: BudgetDraft): Budget[] {
  return Object.entries(draft)
    .filter(([, entry]) => entry.amount.trim() !== '')
    .map(([categoryId, entry]) => ({
      categoryId,
      period: entry.period,
      amountCents: parseAmountToCents(entry.amount)
    }))
}

export function budgetDraftProblem(draft: BudgetDraft, categories: Category[]): string | null {
  const names = new Map(categories.map((category) => [category.id, category.name]))
  for (const [categoryId, entry] of Object.entries(draft)) {
    if (entry.amount.trim() === '') continue
    const cents = tryParseCents(entry.amount)
    if (cents === null || cents <= 0) {
      return `‘${names.get(categoryId) ?? 'Onbekend'}’ heeft geen geldig bedrag, bijvoorbeeld 150 of 150,50`
    }
  }
  return null
}

function tryParseCents(text: string): number | null {
  try {
    return parseAmountToCents(text)
  } catch {
    return null
  }
}
