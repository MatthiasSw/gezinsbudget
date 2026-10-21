// Builds stable keys and readable labels for the other party of a transaction.
import { normalizeText } from '@shared/text'
import type { Transaction } from '@shared/types'

const maxLabelWords = 8

// One stable key per counterparty, ignoring case, accents and spacing. Empty without name and IBAN.
export function counterpartyKey(transaction: Transaction): string {
  const name = normalizeText(transaction.counterpartyName ?? '')
    .replace(/\s+/g, ' ')
    .trim()
  return name || (transaction.counterpartyIban ?? '')
}

// Like counterpartyKey, but a payment without name and IBAN (a loan repayment, for example) is
// recognised by its description without numbers, because only references and dates change.
export function recurrenceKey(transaction: Transaction): string {
  return counterpartyKey(transaction) || textWithoutNumbers(descriptionOf(transaction))
}

// What to show for the other party: name, IBAN, or else the start of the description up to the first number.
export function counterpartyLabel(transaction: Transaction): string {
  const named = transaction.counterpartyName ?? transaction.counterpartyIban
  if (named) return named
  const words = descriptionOf(transaction).split(/\s+/).filter(Boolean)
  const firstNumber = words.findIndex((word) => /\d/.test(word))
  return words
    .slice(0, firstNumber === -1 ? maxLabelWords : firstNumber)
    .slice(0, maxLabelWords)
    .join(' ')
}

function descriptionOf(transaction: Transaction): string {
  return transaction.description ?? transaction.message ?? ''
}

function textWithoutNumbers(text: string): string {
  return normalizeText(text)
    .replace(/[^\p{L}]+/gu, ' ')
    .trim()
}
