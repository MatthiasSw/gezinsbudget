// Finds rows for accounts the user has not registered as their own.
import { AppError } from '@shared/errors'
import { normalizeIban } from '@shared/iban'

export function findUnknownAccounts(rows: { accountId: string }[], knownIbans: string[]): string[] {
  const known = new Set(knownIbans.map(normalizeIban))
  return [...new Set(rows.map((row) => row.accountId))].filter((iban) => !known.has(iban))
}

export function assertKnownAccounts(rows: { accountId: string }[], knownIbans: string[]): void {
  const unknown = findUnknownAccounts(rows, knownIbans)
  if (unknown.length > 0) {
    throw new AppError('IMPORT_UNKNOWN_ACCOUNT', `Unknown account(s): ${unknown.join(', ')}`, {
      ibans: unknown
    })
  }
}
