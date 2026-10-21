// Builds one stable key per counterparty, ignoring case, accents and spacing.
import { normalizeText } from '@shared/text'
import type { Transaction } from '@shared/types'

export function counterpartyKey(transaction: Transaction): string {
  const name = normalizeText(transaction.counterpartyName ?? '')
    .replace(/\s+/g, ' ')
    .trim()
  return name || (transaction.counterpartyIban ?? '')
}
