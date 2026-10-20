// Builds every path inside the data folder in one place.
import { join } from 'path'
import { AppError } from '@shared/errors'

const monthKeyPattern = /^\d{4}-(0[1-9]|1[0-2])$/
const monthFilePattern = /^(\d{4}-(0[1-9]|1[0-2]))\.json$/

export type DataPaths = {
  root: string
  settings: string
  categories: string
  rules: string
  budgets: string
  dataVersion: string
  writerLock: string
  transactionsDir: string
  importsDir: string
  monthFile(monthKey: string): string
}

export function createDataPaths(root: string): DataPaths {
  const transactionsDir = join(root, 'transactions')
  return {
    root,
    settings: join(root, 'settings.json'),
    categories: join(root, 'categories.json'),
    rules: join(root, 'rules.json'),
    budgets: join(root, 'budgets.json'),
    dataVersion: join(root, 'data-version.json'),
    writerLock: join(root, 'writer.lock'),
    transactionsDir,
    importsDir: join(root, 'imports'),
    monthFile: (monthKey) => {
      assertValidMonthKey(monthKey)
      return join(transactionsDir, `${monthKey}.json`)
    }
  }
}

export function assertValidMonthKey(monthKey: string): void {
  if (!monthKeyPattern.test(monthKey)) {
    throw new AppError('UNKNOWN', `Invalid month key: ${monthKey}`)
  }
}

export function monthKeyFromFileName(fileName: string): string | undefined {
  return monthFilePattern.exec(fileName)?.[1]
}
