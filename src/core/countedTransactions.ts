// Selects the transactions that count as income or expense: inside the period, on the chosen accounts, no internal transfers and no categories that are left out of the totals.
import { excludedCategoryIds } from '@shared/categoryTree'
import { normalizeIban } from '@shared/iban'
import type { DateSpan } from '@shared/periods'
import type { Category, Transaction } from '@shared/types'

export type AccountMatcher = (transaction: Transaction) => boolean

export function countedTransactions(
  transactions: Transaction[],
  categories: Category[],
  period: DateSpan,
  accountIds: string[] | undefined
): Transaction[] {
  const isOnChosenAccount = createAccountMatcher(accountIds)
  return withoutExcludedCategories(transactions, categories).filter(
    (transaction) =>
      !transaction.isInternalTransfer &&
      transaction.bookingDate >= period.from &&
      transaction.bookingDate <= period.to &&
      isOnChosenAccount(transaction)
  )
}

export function withoutExcludedCategories(
  transactions: Transaction[],
  categories: Category[]
): Transaction[] {
  const excluded = excludedCategoryIds(categories)
  if (excluded.size === 0) return transactions
  return transactions.filter(
    (transaction) => !transaction.categoryId || !excluded.has(transaction.categoryId)
  )
}

// No account ids, or an empty list, means all accounts.
export function createAccountMatcher(accountIds: string[] | undefined): AccountMatcher {
  const wanted = accountIds?.map(normalizeIban) ?? []
  if (wanted.length === 0) return () => true
  return (transaction) => wanted.includes(transaction.accountId)
}
