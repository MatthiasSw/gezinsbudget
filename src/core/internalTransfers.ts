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

export function markInternalTransfers<T extends TransferCandidate>(
  transactions: T[],
  ownIbans: string[]
): T[] {
  return transactions.map((transaction) => ({
    ...transaction,
    isInternalTransfer: isInternalTransfer(transaction, ownIbans)
  }))
}
