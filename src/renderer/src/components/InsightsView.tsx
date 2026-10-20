// Interessant tab: notable findings about the spending of a year, in a few small sections.
import { useCallback, useState } from 'react'
import type { TopExpense } from '@shared/insightTypes'
import { yearRangeOf } from '@shared/periods'
import { api } from '../api'
import { describeError } from '../errorMessages'
import { useAsyncData } from '../hooks/useAsyncData'
import { useYearChoice } from '../hooks/useYearChoice'
import type { Filters } from './FilterBar'
import { FactsCard, MoversCard, TopCounterpartiesCard, TopExpensesCard } from './InsightCards'
import { YearAccountFilter } from './YearAccountFilter'

type InsightsViewProps = {
  dataRevision: number
  onOpenTransactions: (filters: Partial<Filters>) => void
}

export function InsightsView({
  dataRevision,
  onOpenTransactions
}: InsightsViewProps): React.JSX.Element {
  const { year, years, setYear } = useYearChoice(dataRevision)
  const [accountId, setAccountId] = useState('')

  const load = useCallback(() => {
    const range = yearRangeOf(year)
    return api.insights.get({
      from: range.from!,
      to: range.to!,
      accountIds: accountId ? [accountId] : undefined
    })
  }, [year, accountId])
  const insights = useAsyncData(load, dataRevision)
  const categories = useAsyncData(api.categories.get, dataRevision)
  const settings = useAsyncData(api.settings.get, dataRevision)

  const accounts = settings.state.status === 'ready' ? settings.state.data.accounts : []
  const categoryList = categories.state.status === 'ready' ? categories.state.data : []

  const openExpense = (expense: TopExpense): void =>
    onOpenTransactions({
      from: expense.bookingDate,
      to: expense.bookingDate,
      accountId,
      categoryId: '',
      internal: 'hide',
      search: expense.counterparty
    })

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
