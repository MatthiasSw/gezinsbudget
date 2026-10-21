// Runs the import flow: pick and parse a file, preview what is new, then store it idempotently.
import { AppError } from '@shared/errors'
import { monthKey } from '@shared/dates'
import type { ImportPickResult, ImportPreview, ImportResult } from '@shared/importTypes'
import type { Transaction } from '@shared/types'
import { splitDuplicates, type DuplicateSplit } from '@core/dedupe'
import { buildTransactions } from '@core/import/buildTransactions'
import { assertKnownAccounts, findUnknownAccounts } from '@core/import/knownAccounts'
import { parseImportFile } from '@core/import/parseImportFile'
import type { ParsedRow } from '@core/import/profile'
import { markInternalTransfers } from '@core/internalTransfers'
import { withRuleCategories } from '@core/rules'
import type { DataRepository, GetRepository } from '../storage/repository'
import { createPendingImports, type PendingImportsOptions } from './pendingImports'

const previewRowLimit = 20

export type PickedFile = {
  name: string
  content: Uint8Array
}

export type ImportServiceDependencies = {
  getRepository: GetRepository
  chooseFile: () => Promise<PickedFile | null>
  pendingOptions?: PendingImportsOptions
}

export type ImportService = {
  pick(): Promise<ImportPickResult | null>
  resume(token: string): Promise<ImportPickResult>
  confirm(token: string): Promise<ImportResult>
  cancel(token: string): void
}

type PendingImport = {
  file: PickedFile
  profileLabel: string
  encoding: string
  rows: ParsedRow[]
}

export function createImportService(dependencies: ImportServiceDependencies): ImportService {
  const pending = createPendingImports<PendingImport>(dependencies.pendingOptions)

  const evaluate = async (token: string): Promise<ImportPickResult> => {
    const entry = pending.get(token)
    const repository = await dependencies.getRepository()
    const ownIbans = await readOwnIbans(repository)
    const unknownIbans = findUnknownAccounts(entry.rows, ownIbans)
    if (unknownIbans.length > 0) return { kind: 'unknownAccounts', token, ibans: unknownIbans }

    const candidates = await buildCandidates(repository, entry, ownIbans)
    const { fresh, duplicates } = await splitAgainstStored(repository, candidates)
    return {
      kind: 'preview',
      preview: buildPreview(token, entry, candidates, fresh, duplicates.length)
    }
  }

  return {
    pick: async () => {
      const file = await dependencies.chooseFile()
      if (!file) return null

      const parsed = parseImportFile(file.content)
      const token = pending.add({
        file,
        profileLabel: parsed.profileLabel,
        encoding: parsed.encoding,
        rows: parsed.rows
      })
      return evaluate(token)
    },
    resume: (token) => evaluate(token),
    confirm: async (token) => {
      const entry = pending.get(token)
      const repository = await dependencies.getRepository()
      const result = await storeImport(repository, entry)
      pending.remove(token)
      return result
    },
    cancel: (token) => pending.remove(token)
  }
}

async function readOwnIbans(repository: DataRepository): Promise<string[]> {
  return (await repository.getSettings()).accounts.map((account) => account.iban)
}

// The transactions as they would be stored: with stable ids, transfer flags and rule categories.
async function buildCandidates(
  repository: DataRepository,
  entry: PendingImport,
  ownIbans: string[]
): Promise<Transaction[]> {
  const built = buildTransactions(entry.rows, entry.file.name)
  const marked = markInternalTransfers(built, ownIbans)
  return withRuleCategories(marked, await repository.getRules())
}

// Everything is checked again here, because the data may have changed since the preview.
async function storeImport(
  repository: DataRepository,
  entry: PendingImport
): Promise<ImportResult> {
  const ownIbans = await readOwnIbans(repository)
  assertKnownAccounts(entry.rows, ownIbans)

  const candidates = await buildCandidates(repository, entry, ownIbans)
  const { fresh, duplicates } = await splitAgainstStored(repository, candidates)
  if (fresh.length === 0) return { addedCount: 0, duplicateCount: duplicates.length, months: [] }

  const storedName = await repository.storeImportFile(entry.file.name, entry.file.content)
  const toStore = fresh.map((transaction) => ({ ...transaction, importedFrom: storedName }))
  const months = await appendToMonths(repository, toStore)
  return { addedCount: toStore.length, duplicateCount: duplicates.length, months }
}

async function splitAgainstStored(
  repository: DataRepository,
  transactions: Transaction[]
): Promise<DuplicateSplit<Transaction>> {
  const existingIds = new Set<string>()
  for (const key of uniqueMonths(transactions)) {
    for (const stored of await repository.getMonth(key)) existingIds.add(stored.id)
  }
  return splitDuplicates(transactions, existingIds)
}

async function appendToMonths(
  repository: DataRepository,
  transactions: Transaction[]
): Promise<string[]> {
  const written: string[] = []
  try {
    for (const key of uniqueMonths(transactions)) {
      const existing = await repository.getMonth(key)
      const additions = transactions.filter(
        (transaction) => monthKey(transaction.bookingDate) === key
      )
      await repository.saveMonth(key, [...existing, ...additions])
      written.push(key)
    }
  } catch (error) {
    if (written.length === 0) throw error
    throw new AppError('WRITE_FAILED', 'The import is incomplete, import the file again', {
      incompleteImport: true,
      writtenMonths: written
    })
  }
  return written
}

function uniqueMonths(transactions: Transaction[]): string[] {
  return [...new Set(transactions.map((transaction) => monthKey(transaction.bookingDate)))].sort()
}

function buildPreview(
  token: string,
  entry: PendingImport,
  all: Transaction[],
  fresh: Transaction[],
  duplicateCount: number
): ImportPreview {
  const dates = all.map((transaction) => transaction.bookingDate).sort()
  const counted = fresh.filter((transaction) => !transaction.isInternalTransfer)
  return {
    token,
    fileName: entry.file.name,
    profileLabel: entry.profileLabel,
    encoding: entry.encoding,
    accounts: [...new Set(all.map((transaction) => transaction.accountId))],
    periodFrom: dates[0] ?? '',
    periodTo: dates[dates.length - 1] ?? '',
    newCount: fresh.length,
    duplicateCount,
    incomeCents: sum(counted.filter((transaction) => transaction.amountCents > 0)),
    expenseCents: -sum(counted.filter((transaction) => transaction.amountCents < 0)),
    previewRows: fresh.slice(0, previewRowLimit)
  }
}

function sum(transactions: Transaction[]): number {
  return transactions.reduce((total, transaction) => total + transaction.amountCents, 0)
}
