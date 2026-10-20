// Overview tab: pick a year and account, see totals per category and month, click through to details.
import { useState } from 'react'
import { monthKeyRange, yearRangeOf } from '@shared/periods'
import type { OverviewRow } from '@shared/overview'
import { uncategorizedFilter } from '@shared/transactionQuery'
import { api } from '../api'
import { describeError } from '../errorMessages'
import { useAsyncData } from '../hooks/useAsyncData'
import { useYearChoice } from '../hooks/useYearChoice'
import { useYearOverview } from '../hooks/useYearOverview'
import type { Filters } from './FilterBar'
import { OverviewTable } from './OverviewTable'
import { YearAccountFilter } from './YearAccountFilter'

const filterInfo =
  'Interne overboekingen tellen niet mee. Klik op een bedrag om de transacties te bekijken.'

type OverviewViewProps = {
  dataRevision: number
  onOpenTransactions: (filters: Partial<Filters>) => void
}

export function OverviewView({
  dataRevision,
  onOpenTransactions
}: OverviewViewProps): React.JSX.Element {
  const { year, years, setYear } = useYearChoice(dataRevision)
  const [accountId, setAccountId] = useState('')
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set())
  const { overview, accounts } = useYearOverview(year, accountId, dataRevision)
  const budgets = useAsyncData(api.budgets.get, dataRevision)

  const toggle = (categoryId: string): void => {
    const next = new Set(expanded)
    if (!next.delete(categoryId)) next.add(categoryId)
    setExpanded(next)
  }

  const openCell = (row: OverviewRow, month: string | null): void => {
    const range = month ? monthKeyRange(month) : yearRangeOf(year)
    onOpenTransactions({
      from: range.from ?? '',
      to: range.to ?? '',
      accountId,
      categoryId: row.categoryId ?? uncategorizedFilter,
      internal: 'hide',
      search: ''
    })
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
