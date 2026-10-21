// Overview tab: pick a year and account, see totals per category and month, click through to details.
import { useState } from 'react'
import { monthSpan, yearSpan } from '@shared/periods'
import type { OverviewRow } from '@shared/overview'
import { uncategorizedFilter } from '@shared/transactionQuery'
import { api } from '../api'
import { describeError } from '../errorMessages'
import { drillDownFilters, type OpenTransactions } from '../filters'
import { useAccounts } from '../hooks/useAccounts'
import { useAsyncData } from '../hooks/useAsyncData'
import { useYearChoice } from '../hooks/useYearChoice'
import { useYearOverview } from '../hooks/useYearOverview'
import { OverviewTable } from './OverviewTable'
import { YearAccountFilter } from './YearAccountFilter'

const filterInfo =
  'Interne overboekingen tellen niet mee. Klik op een bedrag om de transacties te bekijken.'

type OverviewViewProps = {
  dataRevision: number
  onOpenTransactions: OpenTransactions
}

export function OverviewView({
  dataRevision,
  onOpenTransactions
}: OverviewViewProps): React.JSX.Element {
  const { year, years, setYear } = useYearChoice(dataRevision)
  const [accountId, setAccountId] = useState('')
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set())
  const overview = useYearOverview(year, accountId, dataRevision)
  const accounts = useAccounts(dataRevision)
  const budgets = useAsyncData(api.budgets.get, dataRevision)

  const toggle = (categoryId: string): void => {
    const next = new Set(expanded)
    if (!next.delete(categoryId)) next.add(categoryId)
    setExpanded(next)
  }

  const openCell = (row: OverviewRow, month: string | null): void => {
    const period = month ? monthSpan(month) : yearSpan(year)
    onOpenTransactions(
      drillDownFilters({ ...period, accountId, categoryId: row.categoryId ?? uncategorizedFilter })
    )
  }

  return (
    <section className="scrollX">
      <YearAccountFilter
        year={year}
        years={years}
        accountId={accountId}
        accounts={accounts}
        onYearChange={setYear}
        onAccountChange={setAccountId}
        info={filterInfo}
      />

      {overview.status === 'error' && <p className="errorText">{describeError(overview.error)}</p>}
      {overview.status === 'ready' && overview.data.rows.length === 0 && (
        <p className="muted">Geen transacties in {year}.</p>
      )}
      {overview.status === 'ready' && overview.data.rows.length > 0 && (
        <OverviewTable
          overview={overview.data}
          budgets={budgets.state.status === 'ready' ? budgets.state.data : []}
          expanded={expanded}
          uncategorizedLabel="Zonder categorie"
          onToggle={toggle}
          onCellClick={openCell}
        />
      )}
    </section>
  )
}
