// Finds the recurring monthly expenses in all stored transactions.
import { todayAsIso } from '@shared/periods'
import type { RecurringSpend } from '@shared/recurringTypes'
import { withoutExcludedCategories } from '@core/countedTransactions'
import { detectRecurringSpend } from '@core/recurring'
import type { GetRepository } from '../storage/repository'

export type RecurringService = {
  get(): Promise<RecurringSpend[]>
}

export type RecurringServiceDependencies = {
  getRepository: GetRepository
  today?: () => string
}

export function createRecurringService({
  getRepository,
  today = todayAsIso
}: RecurringServiceDependencies): RecurringService {
  return {
    get: async () => {
      const repository = await getRepository()
      const [transactions, categories] = await Promise.all([
        repository.getTransactions(),
        repository.getCategories()
      ])
      return detectRecurringSpend(withoutExcludedCategories(transactions, categories), today())
    }
  }
}
