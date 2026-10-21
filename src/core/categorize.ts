// Applies a manual category choice to transactions and clears categories that no longer exist.
import type { Transaction } from '@shared/types'

export function setManualCategory(
  transactions: Transaction[],
  ids: ReadonlySet<string>,
  categoryId: string | null
): Transaction[] {
  return transactions.map((transaction) => {
    if (!ids.has(transaction.id)) return transaction
    if (categoryId === null) return withoutCategory(transaction)
    return { ...transaction, categoryId, categorySource: 'manual' }
  })
}

export function clearCategories(
  transactions: Transaction[],
  categoryIds: ReadonlySet<string>
): Transaction[] {
  return transactions.map((transaction) =>
    transaction.categoryId !== undefined && categoryIds.has(transaction.categoryId)
      ? withoutCategory(transaction)
      : transaction
  )
}

export function withoutCategory(transaction: Transaction): Transaction {
  const { categoryId: removedCategory, categorySource: removedSource, ...rest } = transaction
  void removedCategory
  void removedSource
  return rest
}
