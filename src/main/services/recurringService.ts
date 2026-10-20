// Finds the recurring monthly expenses in all stored transactions.
import { todayAsIso } from '@shared/periods'
import type { RecurringSpend } from '@shared/recurringTypes'
import { detectRecurringSpend } from '@core/recurring'
import type { DataRepository } from '../storage/repository'

export type RecurringService = {
  get(): Promise<RecurringSpend[]>
}

export type RecurringServiceDependencies = {
  getRepository: () => Promise<DataRepository>
  today?: () => string
}

export function createRecurringService({
  getRepository,
  today = todayAsIso
}: RecurringServiceDependencies): RecurringService {
  return {
    get: async () => {
      const repository = await getRepository()
      return detectRecurringSpend(await repository.getTransactions(), today())
    }
  }
}
