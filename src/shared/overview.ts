// Types for the category-by-month overview shared by main and renderer.
import type { DateSpan } from './periods'

export type OverviewRequest = DateSpan & {
  accountIds?: string[]
}

export type OverviewRow = {
  categoryId: string | null
  name: string
  icon: string
  parentId: string | null
  depth: number
  perMonth: Record<string, number>
  totalCents: number
}

export type MonthTotals = {
  incomeCents: number
  expenseCents: number
  netCents: number
}

export type OverviewTable = {
  months: string[]
  rows: OverviewRow[]
  perMonthTotals: Record<string, MonthTotals>
  totals: MonthTotals
}
