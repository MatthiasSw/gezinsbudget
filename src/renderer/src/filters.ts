// The filters of the transaction list, and how other pages open that list with some filters set.
import { presetRange, todayAsIso } from '@shared/periods'
import type { InternalTransferFilter } from '@shared/transactionQuery'

export type Filters = {
  from: string
  to: string
  accountId: string
  categoryId: string
  internal: InternalTransferFilter
  search: string
}

export type OpenTransactions = (filters: Filters) => void

// What the list shows when the user opens it: this year, every account and category.
export function defaultFilters(): Filters {
  const year = presetRange('thisYear', todayAsIso())
  return drillDownFilters({ from: year.from, to: year.to })
}

// Starts from "show everything", so only the given filters narrow the list.
export function drillDownFilters(filters: Partial<Filters>): Filters {
  return {
    from: '',
    to: '',
    accountId: '',
    categoryId: '',
    internal: 'hide',
    search: '',
    ...filters
  }
}
