// Types describing the import preview and result shown to the user.
import type { Transaction } from './types'

export type ImportPreview = {
  token: string
  fileName: string
  profileLabel: string
  encoding: string
  accounts: string[]
  periodFrom: string
  periodTo: string
  newCount: number
  duplicateCount: number
  incomeCents: number
  expenseCents: number
  previewRows: Transaction[]
}

export type ImportPickResult =
  | { kind: 'preview'; preview: ImportPreview }
  | { kind: 'unknownAccounts'; token: string; ibans: string[] }

export type ImportResult = {
  addedCount: number
  duplicateCount: number
  months: string[]
}
