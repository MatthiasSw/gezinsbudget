// Describes how the transaction list is filtered; shared by the UI and the main process.
export const uncategorizedFilter = 'uncategorized'

export type InternalTransferFilter = 'hide' | 'show' | 'only'

export type TransactionQuery = {
  accountIds?: string[]
  from?: string
  to?: string
  categoryId?: string
  search?: string
  internal: InternalTransferFilter
}

export type TransactionRef = {
  id: string
  bookingDate: string
}

export type ExportResult = {
  rowCount: number
}

export type SetCategoryRequest = {
  refs: TransactionRef[]
  categoryId: string | null
}
