// Builds one stable key per counterparty, ignoring case, accents and spacing.
import type { Transaction } from '@shared/types'
import { normalizeSearchText } from './transactionFilter'

export function counterpartyKey(transaction: Transaction): string {
  const name = normalizeSearchText(transaction.counterpartyName ?? '')
    .replace(/\s+/g, ' ')
    .trim()
  return name || (transaction.counterpartyIban ?? '')
}
