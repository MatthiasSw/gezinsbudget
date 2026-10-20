// Table with categories as rows and months as columns; parents expand to show subcategories.
import { budgetProgress } from '@shared/budgets'
import { categoryLabel } from '@shared/categoryIcons'
import { shortMonthName } from '@shared/dates'
import { formatCents } from '@shared/money'
import type { OverviewRow, OverviewTable as OverviewData } from '@shared/overview'
import type { Budget } from '@shared/types'
import { BudgetBar } from './BudgetBar'

type OverviewTableProps = {
  overview: OverviewData
  budgets: Budget[]
  expanded: ReadonlySet<string>
  uncategorizedLabel: string
  onToggle: (categoryId: string) => void
  onCellClick: (row: OverviewRow, month: string | null) => void
}

function cellText(cents: number): string {
  return cents === 0 ? '–' : formatCents(cents)
}

function amountClass(cents: number): string {
  if (cents === 0) return 'amount muted'
  return cents < 0 ? 'amount negative' : 'amount positive'
}

function isVisible(
  row: OverviewRow,
  parents: Map<string, string | null>,
  expanded: ReadonlySet<string>
): boolean {
  for (let parentId = row.parentId; parentId; parentId = parents.get(parentId) ?? null) {
    if (!expanded.has(parentId)) return false
  }
  return true
}

export function OverviewTable({
  overview,
  budgets,
  expanded,
  uncategorizedLabel,
  onToggle,
  onCellClick
}: OverviewTableProps): React.JSX.Element {
  const parents = new Map(
    overview.rows.filter((row) => row.categoryId).map((row) => [row.categoryId!, row.parentId])
  )
  const parentIds = new Set(overview.rows.map((row) => row.parentId).filter(Boolean))
  const budgetsById = new Map(budgets.map((budget) => [budget.categoryId, budget]))
  const showBudgets = overview.rows.some((row) => row.categoryId && budgetsById.has(row.categoryId))

  return (
    <table className="overview">
      <thead>
        <tr>
          <th>Categorie</th>
          {overview.months.map((month) => (
            <th key={month} className="amount">
              {shortMonthName(month)}
            </th>
          ))}
          <th className="amount">Totaal</th>
          {showBudgets && <th>Budget (jaar)</th>}
        </tr>
      </thead>
      <tbody>
        {overview.rows
          .filter((row) => isVisible(row, parents, expanded))
          .map((row) => (
            <tr key={row.categoryId ?? 'uncategorized'}>
              <td style={{ paddingLeft: `${8 + row.depth * 20}px` }}>
                {row.categoryId && parentIds.has(row.categoryId) ? (
                  <button
                    className="toggle"
                    aria-label="Uitklappen"
                    onClick={() => onToggle(row.categoryId!)}
                  >
                    {expanded.has(row.categoryId) ? '▾' : '▸'}
                  </button>
                ) : (
                  <span className="toggleSpace" />
                )}
                {row.categoryId ? categoryLabel(row) : uncategorizedLabel}
              </td>
              {overview.months.map((month) => (
                <td
                  key={month}
                  className={`${amountClass(row.perMonth[month])} clickable`}
                  onClick={() => onCellClick(row, month)}
                >
                  {cellText(row.perMonth[month])}
                </td>
              ))}
              <td
                className={`${amountClass(row.totalCents)} clickable total`}
                onClick={() => onCellClick(row, null)}
              >
                {cellText(row.totalCents)}
              </td>
              {showBudgets && (
                <td>
                  {row.categoryId && budgetsById.has(row.categoryId) && (
                    <BudgetBar
                      progress={budgetProgress(budgetsById.get(row.categoryId)!, -row.totalCents)}
                    />
                  )}
                </td>
              )}
            </tr>
          ))}
      </tbody>
      <tfoot>
        <tr>
          <th>Inkomsten</th>
          {overview.months.map((month) => (
            <td key={month} className={amountClass(overview.perMonthTotals[month].incomeCents)}>
              {cellText(overview.perMonthTotals[month].incomeCents)}
            </td>
          ))}
          <td className={`${amountClass(overview.totals.incomeCents)} total`}>
            {cellText(overview.totals.incomeCents)}
          </td>
          {showBudgets && <td />}
        </tr>
        <tr>
          <th>Uitgaven</th>
          {overview.months.map((month) => (
            <td key={month} className={amountClass(-overview.perMonthTotals[month].expenseCents)}>
              {cellText(-overview.perMonthTotals[month].expenseCents)}
            </td>
          ))}
          <td className={`${amountClass(-overview.totals.expenseCents)} total`}>
            {cellText(-overview.totals.expenseCents)}
          </td>
          {showBudgets && <td />}
        </tr>
        <tr>
          <th>Netto</th>
          {overview.months.map((month) => (
            <td key={month} className={amountClass(overview.perMonthTotals[month].netCents)}>
              {cellText(overview.perMonthTotals[month].netCents)}
            </td>
          ))}
          <td className={`${amountClass(overview.totals.netCents)} total`}>
            {cellText(overview.totals.netCents)}
          </td>
          {showBudgets && <td />}
        </tr>
      </tfoot>
    </table>
  )
}
