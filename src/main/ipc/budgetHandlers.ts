// Handles the IPC channels for budgets by delegating to the budget service.
import type { IpcHandlers } from '@shared/ipc'
import type { BudgetService } from '../services/budgetService'

export type BudgetHandlers = Pick<IpcHandlers, 'budgets:get' | 'budgets:save'>

export function createBudgetHandlers(service: BudgetService): BudgetHandlers {
  return {
    'budgets:get': () => service.get(),
    'budgets:save': (budgets) => service.save(budgets)
  }
}
