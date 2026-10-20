// Reads and saves the budgets per category, ignoring budgets whose category no longer fits.
import { assertValidBudgets, keepBudgetableBudgets } from '@shared/budgets'
import type { Budget } from '@shared/types'
import type { DataRepository } from '../storage/repository'

export type BudgetService = {
  get(): Promise<Budget[]>
  save(budgets: Budget[]): Promise<Budget[]>
}

export type BudgetServiceDependencies = {
  getRepository: () => Promise<DataRepository>
}

export function createBudgetService({ getRepository }: BudgetServiceDependencies): BudgetService {
  return {
    get: async () => {
      const repository = await getRepository()
      const [budgets, categories] = await Promise.all([
        repository.getBudgets(),
        repository.getCategories()
      ])
      return keepBudgetableBudgets(budgets, categories)
    },
    save: async (budgets) => {
      const repository = await getRepository()
      assertValidBudgets(budgets, await repository.getCategories())
      await repository.saveBudgets(budgets)
      return budgets
    }
  }
}
