// Builds the insights for a period, compared with the same period a year earlier.
import { shiftYear } from '@shared/dates'
import type { Insights } from '@shared/insightTypes'
import type { OverviewRequest } from '@shared/overview'
import { todayAsIso } from '@shared/periods'
import { computeInsights } from '@core/insights'
import type { DataRepository } from '../storage/repository'

export type InsightsService = {
  get(request: OverviewRequest): Promise<Insights>
}

export type InsightsServiceDependencies = {
  getRepository: () => Promise<DataRepository>
  today?: () => string
}

export function createInsightsService({
  getRepository,
  today = todayAsIso
}: InsightsServiceDependencies): InsightsService {
  return {
    get: async ({ from, to, accountIds }) => {
      const repository = await getRepository()
      const end = to < today() ? to : today()
      const previous = { from: shiftYear(from, -1), to: shiftYear(end, -1) }
      const [transactions, categories] = await Promise.all([
        repository.getTransactions({ from: previous.from, to: end }),
        repository.getCategories()
      ])
      return computeInsights(transactions, categories, {
        period: { from, to: end },
        previous,
        accountIds
      })
    }
  }
}
