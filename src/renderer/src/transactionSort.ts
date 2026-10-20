// Sorts the transaction list by one of the sortable columns.
import type { Account, Category, Transaction } from '@shared/types'

export type SortKey = 'date' | 'account' | 'counterparty' | 'amount' | 'category'
export type SortDirection = 'asc' | 'desc'
export type TransactionSort = { key: SortKey; direction: SortDirection }

export const defaultSort: TransactionSort = { key: 'date', direction: 'desc' }

const descendingFirst: SortKey[] = ['date', 'amount']

export function nextSort(current: TransactionSort, key: SortKey): TransactionSort {
  if (current.key === key) {
    return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
  }
  return { key, direction: descendingFirst.includes(key) ? 'desc' : 'asc' }
}

export function sortTransactions(
  transactions: Transaction[],
  sort: TransactionSort,
  accounts: Account[],
  categories: Category[]
): Transaction[] {
  const accountNames = new Map(accounts.map((account) => [account.iban, account.name]))
  const categoryNames = new Map(categories.map((category) => [category.id, category.name]))
  const sign = sort.direction === 'asc' ? 1 : -1

  const textOf = (transaction: Transaction): string => {
    if (sort.key === 'account') {
      return accountNames.get(transaction.accountId) ?? transaction.accountId
    }
    if (sort.key === 'counterparty') return transaction.counterpartyName ?? ''
    return categoryNames.get(transaction.categoryId ?? '') ?? ''
  }

  const compare = (left: Transaction, right: Transaction): number => {
    if (sort.key === 'date') return left.bookingDate.localeCompare(right.bookingDate)
    if (sort.key === 'amount') return left.amountCents - right.amountCents
    return compareText(textOf(left), textOf(right))
  }

  const isBlank = (transaction: Transaction): boolean =>
    sort.key === 'category' && textOf(transaction) === ''

  return [...transactions].sort((left, right) => {
    if (isBlank(left) !== isBlank(right)) return isBlank(left) ? 1 : -1
    return sign * compare(left, right) || left.id.localeCompare(right.id)
  })
}

function compareText(left: string, right: string): number {
  return left.localeCompare(right, 'nl', { sensitivity: 'base' })
}
