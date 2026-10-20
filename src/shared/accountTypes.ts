// Response type of saving the own accounts.
import type { AppSettings } from './types'

export type SaveAccountsResult = {
  settings: AppSettings
  changedTransactions: number
}
