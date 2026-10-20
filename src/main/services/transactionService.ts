// Serves the filtered transaction list and applies manual category choices.
import { AppError } from '@shared/errors'
import { monthKey } from '@shared/dates'
import type { ExportResult, SetCategoryRequest, TransactionQuery } from '@shared/transactionQuery'
import type { Transaction } from '@shared/types'
import { setManualCategory } from '@core/categorize'
import { buildTransactionsCsv } from '@core/csvExport'
import { filterTransactions } from '@core/transactionFilter'
import type { DataRepository } from '../storage/repository'

export type SaveFile = (suggestedName: string, content: string) => Promise<boolean>

export type TransactionService = {
  query(query: TransactionQuery): Promise<Transaction[]>
  exportCsv(query: TransactionQuery): Promise<ExportResult | null>
  setCategory(request: SetCategoryRequest): Promise<number>
}

export type TransactionServiceDependencies = {
  getRepository: () => Promise<DataRepository>
  saveFile: SaveFile
}

export function createTransactionService({
  getRepository,
  saveFile
}: TransactionServiceDependencies): TransactionService {
  const query = async (request: TransactionQuery): Promise<Transaction[]> => {
    const repository = await getRepository()
    const [transactions, categories] = await Promise.all([
      repository.getTransactions({ from: request.from, to: request.to }),
      repository.getCategories()
    ])
    return filterTransactions(transactions, request, categories)
  }

  return {
    query,
    exportCsv: async (request) => {
      const repository = await getRepository()
      const [transactions, settings, categories] = await Promise.all([
        query(request),
        repository.getSettings(),
        repository.getCategories()
      ])
      const csv = buildTransactionsCsv(transactions, settings.accounts, categories)
      const saved = await saveFile(exportFileName(request), csv)
      return saved ? { rowCount: transactions.length } : null
    },
    setCategory: async ({ refs, categoryId }) => {
      const repository = await getRepository()
      await assertCategoryCanBeAssigned(repository, categoryId)

      let updated = 0
      for (const [month, ids] of groupIdsByMonth(refs)) {
        const stored = await repository.getMonth(month)
        const matched = stored.filter((transaction) => ids.has(transaction.id))
        if (matched.length === 0) continue
        await repository.saveMonth(month, setManualCategory(stored, ids, categoryId))
        updated += matched.length
      }
      return updated
    }
  }
}

function exportFileName(query: TransactionQuery): string {
  const period = [query.from, query.to].filter(Boolean).join('-')
  return period ? `gezinsbudget-transacties-${period}.csv` : 'gezinsbudget-transacties.csv'
}

async function assertCategoryCanBeAssigned(
  repository: DataRepository,
  categoryId: string | null
): Promise<void> {
  if (categoryId === null) return
  const category = (await repository.getCategories()).find((item) => item.id === categoryId)
  if (!category) {
    throw new AppError('INVALID_CATEGORIES', 'The chosen category does not exist')
  }
}

function groupIdsByMonth(refs: SetCategoryRequest['refs']): Map<string, Set<string>> {
  const groups = new Map<string, Set<string>>()
  for (const ref of refs) {
    const month = monthKey(ref.bookingDate)
    groups.set(month, (groups.get(month) ?? new Set()).add(ref.id))
  }
  return groups
}
