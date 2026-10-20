// Turns the overview table into the series the charts plot, so charts and table share one source.
import { categoryLabel } from '@shared/categoryIcons'
import { formatMonthLabel } from '@shared/dates'
import type { OverviewRow, OverviewTable } from '@shared/overview'

export type MonthlyTotalsPoint = {
  month: string
  label: string
  incomeCents: number
  expenseCents: number
  netCents: number
}

export type CategoryEvolutionPoint = {
  month: string
  label: string
  centsByCategory: Record<string, number>
}

export type SpendingEntry = {
  categoryId: string
  name: string
  depth: number
  cents: number
}

export type SpendingPeriod = 'year' | string

export function monthlyTotalsSeries(overview: OverviewTable): MonthlyTotalsPoint[] {
  return activeMonths(overview).map((month) => ({
    month,
    label: formatMonthLabel(month),
    ...overview.perMonthTotals[month]
  }))
}

export function categoryEvolution(
  overview: OverviewTable,
  categoryIds: string[]
): CategoryEvolutionPoint[] {
  const rows = categoryIds
    .map((id) => overview.rows.find((row) => row.categoryId === id))
    .filter((row): row is OverviewRow => row !== undefined)

  return activeMonths(overview).map((month) => ({
    month,
    label: formatMonthLabel(month),
    centsByCategory: Object.fromEntries(
      rows.map((row) => [row.categoryId, Math.abs(row.perMonth[month] ?? 0)])
    )
  }))
}

export function spendingByCategory(
  overview: OverviewTable,
  period: SpendingPeriod,
  includeSubcategories: boolean
): SpendingEntry[] {
  const spendingOf = (parentId: string | null, depth: number): SpendingEntry[] =>
    overview.rows
      .filter((row) => row.categoryId !== null && row.parentId === parentId)
      .map((row) => ({
        categoryId: row.categoryId as string,
        name: indentedLabel(row, depth),
        depth,
        cents: -periodCents(row, period)
      }))
      .filter((entry) => entry.cents > 0)
      .sort((left, right) => right.cents - left.cents)
      .flatMap((entry) => [
        entry,
        ...(includeSubcategories ? spendingOf(entry.categoryId, depth + 1) : [])
      ])

  return spendingOf(null, 0)
}

function indentedLabel(row: OverviewRow, depth: number): string {
  return depth === 0 ? categoryLabel(row) : `${'  '.repeat(depth)}↳ ${categoryLabel(row)}`
}

function periodCents(row: OverviewRow, period: SpendingPeriod): number {
  return period === 'year' ? row.totalCents : (row.perMonth[period] ?? 0)
}

export function activeMonths(overview: OverviewTable): string[] {
  const hasData = (month: string): boolean => {
    const totals = overview.perMonthTotals[month]
    return totals.incomeCents !== 0 || totals.expenseCents !== 0
  }
  const lastActive = overview.months.findLastIndex(hasData)
  return overview.months.slice(0, lastActive + 1)
}
