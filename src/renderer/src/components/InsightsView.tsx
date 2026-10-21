// Interessant tab: notable findings about the spending of a year, in a few small sections.
import { useCallback, useState } from 'react'
import type { TopExpense } from '@shared/insightTypes'
import { api } from '../api'
import { describeError } from '../errorMessages'
import { drillDownFilters, type OpenTransactions } from '../filters'
import { useAccounts } from '../hooks/useAccounts'
import { useAsyncData } from '../hooks/useAsyncData'
import { useCategories } from '../hooks/useCategories'
import { useYearChoice } from '../hooks/useYearChoice'
import { yearRequest } from '../hooks/useYearOverview'
import { FactsCard, MoversCard, TopCounterpartiesCard, TopExpensesCard } from './InsightCards'
import { YearAccountFilter } from './YearAccountFilter'

type InsightsViewProps = {
  dataRevision: number
  onOpenTransactions: OpenTransactions
}

export function InsightsView({
  dataRevision,
  onOpenTransactions
}: InsightsViewProps): React.JSX.Element {
  const { year, years, setYear } = useYearChoice(dataRevision)
  const [accountId, setAccountId] = useState('')

  const load = useCallback(() => api.insights.get(yearRequest(year, accountId)), [year, accountId])
  const insights = useAsyncData(load, dataRevision)
  const categoryList = useCategories(dataRevision)
  const accounts = useAccounts(dataRevision)

  const openExpense = (expense: TopExpense): void =>
    onOpenTransactions(
      drillDownFilters({
        from: expense.bookingDate,
        to: expense.bookingDate,
        accountId,
        search: expense.counterparty
      })
    )

  return (
    <>
      <section>
        <YearAccountFilter
          year={year}
          years={years}
          accountId={accountId}
          accounts={accounts}
          onYearChange={setYear}
          onAccountChange={setAccountId}
          info="Interne overboekingen tellen niet mee. Een lopend jaar wordt tot vandaag bekeken."
        />
      </section>

      {insights.state.status === 'error' && (
        <p className="errorText">{describeError(insights.state.error)}</p>
      )}
      {insights.state.status === 'ready' && (
        <div className="insightGrid">
          <FactsCard facts={insights.state.data.facts} categories={categoryList} />
          <TopExpensesCard
            expenses={insights.state.data.topExpenses}
            categories={categoryList}
            onOpen={openExpense}
          />
          <TopCounterpartiesCard counterparties={insights.state.data.topCounterparties} />
          <MoversCard
            risers={insights.state.data.risers}
            fallers={insights.state.data.fallers}
            hasPreviousPeriod={insights.state.data.hasPreviousPeriod}
            categories={categoryList}
          />
        </div>
      )}
    </>
  )
}
