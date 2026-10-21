// Selects the transactions that count as income or expense: inside the period, on the chosen accounts and no internal transfers.
import { normalizeIban } from '@shared/iban'
import type { DateSpan } from '@shared/periods'
import type { Transaction } from '@shared/types'

export type AccountMatcher = (transaction: Transaction) => boolean

export function countedTransactions(
  transactions: Transaction[],
  period: DateSpan,
  accountIds: string[] | undefined
): Transaction[] {
  const isOnChosenAccount = createAccountMatcher(accountIds)
  return transactions.filter(
    (transaction) =>
      !transaction.isInternalTransfer &&
      transaction.bookingDate >= period.from &&
      transaction.bookingDate <= period.to &&
      isOnChosenAccount(transaction)
  )
}

// No account ids, or an empty list, means all accounts.
export function createAccountMatcher(accountIds: string[] | undefined): AccountMatcher {
  const wanted = accountIds?.map(normalizeIban) ?? []
  if (wanted.length === 0) return () => true
  return (transaction) => wanted.includes(transaction.accountId)
}
