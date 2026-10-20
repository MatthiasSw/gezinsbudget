// Filters and sorts transactions for the list view.
import { descendantIds } from '@shared/categoryTree'
import { formatCents } from '@shared/money'
import { normalizeIban } from '@shared/iban'
import { normalizeText } from '@shared/text'
import { uncategorizedFilter, type TransactionQuery } from '@shared/transactionQuery'
import type { Category, Transaction } from '@shared/types'

export function filterTransactions(
  transactions: Transaction[],
  query: TransactionQuery,
  categories: Category[]
): Transaction[] {
  const accountIds = query.accountIds?.map(normalizeIban)
  const categoryIds = categoryIdsFor(query.categoryId, categories)
  const words = splitWords(query.search ?? '')

  return transactions
    .filter((transaction) => matchesInternal(transaction, query.internal))
    .filter((transaction) => !accountIds?.length || accountIds.includes(transaction.accountId))
    .filter((transaction) => !query.from || transaction.bookingDate >= query.from)
    .filter((transaction) => !query.to || transaction.bookingDate <= query.to)
    .filter((transaction) => matchesCategory(transaction, query.categoryId, categoryIds))
    .filter((transaction) => matchesSearch(transaction, words))
    .sort(newestFirst)
}

function matchesInternal(transaction: Transaction, mode: TransactionQuery['internal']): boolean {
  if (mode === 'show') return true
  return mode === 'only' ? transaction.isInternalTransfer : !transaction.isInternalTransfer
}

function categoryIdsFor(categoryId: string | undefined, categories: Category[]): string[] {
  if (!categoryId || categoryId === uncategorizedFilter) return []
  return descendantIds(categories, categoryId)
}

function matchesCategory(
  transaction: Transaction,
  categoryId: string | undefined,
  categoryIds: string[]
): boolean {
  if (!categoryId) return true
  if (categoryId === uncategorizedFilter) return !transaction.categoryId
  return transaction.categoryId !== undefined && categoryIds.includes(transaction.categoryId)
}

function matchesSearch(transaction: Transaction, words: string[]): boolean {
  if (words.length === 0) return true
  const haystack = normalizeSearchText(searchableText(transaction))
  return words.every((word) => haystack.includes(word))
}

function searchableText(transaction: Transaction): string {
  const amount = formatCents(transaction.amountCents).replace(/\s*€$/, '')
  return [
    transaction.counterpartyName,
    transaction.message,
    transaction.description,
    transaction.counterpartyIban,
    transaction.accountId,
    amount,
    amount.replace('-', ''),
    amount.replace(/\./g, ''),
    amount.replace(/[-.]/g, '')
  ]
    .filter(Boolean)
    .join(' ')
}

function splitWords(search: string): string[] {
  return normalizeSearchText(search).split(/\s+/).filter(Boolean)
}

export const normalizeSearchText = normalizeText

function newestFirst(a: Transaction, b: Transaction): number {
  return b.bookingDate.localeCompare(a.bookingDate) || a.id.localeCompare(b.id)
}
