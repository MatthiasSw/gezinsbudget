// Reads and writes all budget data in the data folder; the only place that knows the folder layout.
import { access, mkdir, readdir } from 'fs/promises'
import type { AppSettings, Budget, Category, DataVersion, Rule, Transaction } from '@shared/types'
import { completeStarterSet } from '@core/starterSet'
import { bumpDataVersion, readDataVersion } from './dataVersion'
import { createDataPaths, monthKeyFromFileName } from './dataPaths'
import type { FileKind } from './migrations'
import { assertDirectoryAvailable, toAvailabilityError } from './storageAvailability'
import { storeImportFile } from './importFileStore'
import { removeStaleTemporaryFiles } from './temporaryFileCleanup'
import { storageMigrations } from './ruleMigrations'
import { readVersionedFile, writeVersionedFile } from './versionedFile'

export type RepositoryOptions = {
  root: string
  updatedBy: string
  now?: () => Date
}

export type TransactionRange = {
  from?: string
  to?: string
}

export type DataRepository = {
  init(): Promise<void>
  getSettings(): Promise<AppSettings>
  saveSettings(settings: AppSettings): Promise<void>
  getCategories(): Promise<Category[]>
  saveCategories(categories: Category[]): Promise<void>
  getRules(): Promise<Rule[]>
  saveRules(rules: Rule[]): Promise<void>
  getBudgets(): Promise<Budget[]>
  saveBudgets(budgets: Budget[]): Promise<void>
  listMonths(): Promise<string[]>
  listUnrecognizedTransactionFiles(): Promise<string[]>
  getMonth(monthKey: string): Promise<Transaction[]>
  saveMonth(monthKey: string, transactions: Transaction[]): Promise<void>
  getTransactions(range?: TransactionRange): Promise<Transaction[]>
  getDataVersion(): Promise<DataVersion | undefined>
  storeImportFile(originalName: string, content: Uint8Array): Promise<string>
}

const emptySettings = (): AppSettings => ({ accounts: [] })

export function createDataRepository(options: RepositoryOptions): DataRepository {
  const paths = createDataPaths(options.root)
  const now = options.now ?? (() => new Date())

  const available = async <T>(operation: () => Promise<T>): Promise<T> => {
    await assertDirectoryAvailable(paths.root)
    try {
      return await operation()
    } catch (error) {
      throw toAvailabilityError(error)
    }
  }

  const recordChange = async (): Promise<void> => {
    await bumpDataVersion(paths.dataVersion, options.updatedBy, now)
  }

  const saveAndRecord = async (path: string, kind: FileKind, data: unknown): Promise<void> => {
    await writeVersionedFile(path, kind, data)
    await recordChange()
  }

  const createMissingFile = async (
    path: string,
    kind: FileKind,
    createContent: () => unknown
  ): Promise<boolean> => {
    if (await fileExists(path)) return false
    await writeVersionedFile(path, kind, createContent())
    return true
  }

  const initialize = async (): Promise<void> => {
    await mkdir(paths.transactionsDir, { recursive: true })
    await mkdir(paths.importsDir, { recursive: true })
    await removeStaleTemporaryFiles(paths.root)
    await removeStaleTemporaryFiles(paths.transactionsDir)

    const starter = completeStarterSet([], [])
    const created = await Promise.all([
      createMissingFile(paths.settings, 'settings', emptySettings),
      createMissingFile(paths.categories, 'categories', () => starter.categories),
      createMissingFile(paths.rules, 'rules', () => starter.rules)
    ])
    if (created.some(Boolean)) await recordChange()
  }

  const readMonthKeys = async (): Promise<string[]> => {
    const names = await listFileNames(paths.transactionsDir)
    return names
      .map(monthKeyFromFileName)
      .filter((key): key is string => key !== undefined)
      .sort()
  }

  const readUnrecognizedFiles = async (): Promise<string[]> => {
    const names = await listFileNames(paths.transactionsDir)
    return names.filter(
      (name) => name.endsWith('.json') && !name.startsWith('.') && !monthKeyFromFileName(name)
    )
  }

  const readMonth = (monthKey: string): Promise<Transaction[]> =>
    readVersionedFile<Transaction[]>(paths.monthFile(monthKey), 'transactions', () => [])

  const readRange = async (range: TransactionRange): Promise<Transaction[]> => {
    const monthKeys = (await readMonthKeys()).filter((key) => isMonthInRange(key, range))
    const months = await Promise.all(monthKeys.map(readMonth))
    return months.flat().filter((transaction) => isDateInRange(transaction.bookingDate, range))
  }

  return {
    init: () => available(initialize),
    getSettings: () =>
      available(() => readVersionedFile(paths.settings, 'settings', emptySettings)),
    saveSettings: (settings) =>
      available(() => saveAndRecord(paths.settings, 'settings', settings)),
    getCategories: () =>
      available(() => readVersionedFile(paths.categories, 'categories', () => [])),
    saveCategories: (categories) =>
      available(() => saveAndRecord(paths.categories, 'categories', categories)),
    getRules: () =>
      available(() => readVersionedFile(paths.rules, 'rules', () => [], storageMigrations)),
    saveRules: (rules) => available(() => saveAndRecord(paths.rules, 'rules', rules)),
    getBudgets: () => available(() => readVersionedFile(paths.budgets, 'budgets', () => [])),
    saveBudgets: (budgets) => available(() => saveAndRecord(paths.budgets, 'budgets', budgets)),
    listMonths: () => available(readMonthKeys),
    listUnrecognizedTransactionFiles: () => available(readUnrecognizedFiles),
    getMonth: (monthKey) => available(() => readMonth(monthKey)),
    saveMonth: (monthKey, transactions) =>
      available(async () => {
        await mkdir(paths.transactionsDir, { recursive: true })
        await saveAndRecord(
          paths.monthFile(monthKey),
          'transactions',
          sortTransactions(transactions)
        )
      }),
    getTransactions: (range = {}) => available(() => readRange(range)),
    getDataVersion: () => available(() => readDataVersion(paths.dataVersion)),
    storeImportFile: (originalName, content) =>
      available(() => storeImportFile(paths.importsDir, originalName, content, now))
  }
}

function sortTransactions(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort(
    (a, b) => a.bookingDate.localeCompare(b.bookingDate) || a.id.localeCompare(b.id)
  )
}

function isMonthInRange(monthKey: string, range: TransactionRange): boolean {
  if (range.from && monthKey < range.from.slice(0, 7)) return false
  if (range.to && monthKey > range.to.slice(0, 7)) return false
  return true
}

function isDateInRange(date: string, range: TransactionRange): boolean {
  if (range.from && date < range.from) return false
  if (range.to && date > range.to) return false
  return true
}

async function fileExists(path: string): Promise<boolean> {
  return access(path).then(
    () => true,
    () => false
  )
}

async function listFileNames(directory: string): Promise<string[]> {
  try {
    return await readdir(directory)
  } catch (error) {
    if ((error as { code?: string }).code === 'ENOENT') return []
    throw error
  }
}
