// Builds the category-by-month overview from the stored transactions.
import type { OverviewRequest, OverviewTable } from '@shared/overview'
import { totalsByCategoryAndMonth } from '@core/aggregate'
import type { GetRepository } from '../storage/repository'

export type OverviewService = {
  get(request: OverviewRequest): Promise<OverviewTable>
  years(): Promise<number[]>
}

export type OverviewServiceDependencies = {
  getRepository: GetRepository
}

export function createOverviewService({
  getRepository
}: OverviewServiceDependencies): OverviewService {
  return {
    years: async () => {
      const months = await (await getRepository()).listMonths()
      const years = new Set(months.map((month) => Number(month.slice(0, 4))))
      return [...years].sort((a, b) => b - a)
    },
    get: async (request) => {
      const repository = await getRepository()
      const [transactions, categories] = await Promise.all([
        repository.getTransactions({ from: request.from, to: request.to }),
        repository.getCategories()
      ])
      return totalsByCategoryAndMonth(transactions, categories, request)
    }
  }
}
