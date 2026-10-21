// Recognises money moved between the user's own accounts.
import { normalizeIban } from '@shared/iban'

type TransferCandidate = {
  accountId: string
  counterpartyIban?: string
  isInternalTransfer: boolean
}

export function isInternalTransfer(
  candidate: Pick<TransferCandidate, 'accountId' | 'counterpartyIban'>,
  ownIbans: string[]
): boolean {
  const counterparty = normalizeIban(candidate.counterpartyIban)
  if (counterparty === '' || counterparty === normalizeIban(candidate.accountId)) return false
  return ownIbans.some((iban) => normalizeIban(iban) === counterparty)
}

// Returns the same object for every transaction whose flag does not change.
export function markInternalTransfers<T extends TransferCandidate>(
  transactions: T[],
  ownIbans: string[]
): T[] {
  return transactions.map((transaction) => {
    const internal = isInternalTransfer(transaction, ownIbans)
    if (internal === transaction.isInternalTransfer) return transaction
    return { ...transaction, isInternalTransfer: internal }
  })
}
