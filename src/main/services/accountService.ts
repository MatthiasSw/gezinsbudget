// Saves the own accounts and recomputes which stored transactions are internal transfers.
import { AppError } from '@shared/errors'
import { isValidIban, normalizeIban } from '@shared/iban'
import type { SaveAccountsResult } from '@shared/accountTypes'
import type { Account, AppSettings } from '@shared/types'
import { markInternalTransfers } from '@core/internalTransfers'
import type { DataRepository } from '../storage/repository'

export type AccountService = {
  get(): Promise<AppSettings>
  save(accounts: Account[]): Promise<SaveAccountsResult>
}

export type AccountServiceDependencies = {
  getRepository: () => Promise<DataRepository>
}

export function createAccountService({
  getRepository
}: AccountServiceDependencies): AccountService {
  return {
    get: async () => (await getRepository()).getSettings(),
    save: async (accounts) => {
      const repository = await getRepository()
      const cleaned = cleanAccounts(accounts)
      const settings = { ...(await repository.getSettings()), accounts: cleaned }
      await repository.saveSettings(settings)
      const ownIbans = cleaned.map((account) => account.iban)
      return { settings, changedTransactions: await recomputeTransfers(repository, ownIbans) }
    }
  }
}

function cleanAccounts(accounts: Account[]): Account[] {
  const seen = new Set<string>()
  const cleaned: Account[] = []
  for (const account of accounts) {
    const iban = normalizeIban(account.iban)
    if (iban === '' || seen.has(iban)) continue
    if (!isValidIban(iban)) throw invalid('The IBAN is not valid', iban)
    if (account.name.trim() === '') throw invalid('An account needs a name', iban)
    seen.add(iban)
    cleaned.push({ iban, name: account.name.trim() })
  }
  return cleaned
}

async function recomputeTransfers(repository: DataRepository, ownIbans: string[]): Promise<number> {
  let changedTransactions = 0
  for (const month of await repository.listMonths()) {
    const stored = await repository.getMonth(month)
    const next = markInternalTransfers(stored, ownIbans)
    const changed = next.filter(
      (transaction, index) => transaction.isInternalTransfer !== stored[index].isInternalTransfer
    ).length
    if (changed === 0) continue
    changedTransactions += changed
    await repository.saveMonth(month, next)
  }
  return changedTransactions
}

function invalid(message: string, iban: string): AppError {
  return new AppError('INVALID_ACCOUNTS', message, { iban })
}
