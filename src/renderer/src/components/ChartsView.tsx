// Charts page: pick a year and account, jump between the charts from a sticky menu and see them all; clicking a chart opens the transactions.
import { monthSpan, yearSpan } from '@shared/periods'
import type { ChartTarget } from '../charts/ChartCard'
import { CategoryEvolutionChart, evolutionSectionId } from '../charts/CategoryEvolutionChart'
import { IncomeExpenseChart, incomeExpenseSectionId } from '../charts/IncomeExpenseChart'
import { SpendingByCategoryChart, spendingSectionId } from '../charts/SpendingByCategoryChart'
import { describeError } from '../errorMessages'
import { drillDownFilters, type OpenTransactions } from '../filters'
import { useAccounts } from '../hooks/useAccounts'
import { useActiveSection } from '../hooks/useActiveSection'
import type { YearAccountSelection } from '../hooks/useYearAccountSelection'
import { useYearChoice } from '../hooks/useYearChoice'
import { useYearOverview } from '../hooks/useYearOverview'
import { TabBar, type TabItem } from './TabBar'
import { YearAccountFilter } from './YearAccountFilter'

type ChartsViewProps = {
  dataRevision: number
  selection: YearAccountSelection
  onOpenTransactions: OpenTransactions
}

const sections: TabItem<string>[] = [
  { id: incomeExpenseSectionId, label: 'Inkomsten en uitgaven' },
  { id: spendingSectionId, label: 'Uitgaven per categorie' },
  { id: evolutionSectionId, label: 'Evolutie per categorie' }
]
const sectionIds = sections.map((section) => section.id)

export function ChartsView({
  dataRevision,
  selection,
  onOpenTransactions
}: ChartsViewProps): React.JSX.Element {
  const { year, years, setYear } = useYearChoice(dataRevision, selection)
  const { accountId, setAccountId } = selection
  const overview = useYearOverview(year, accountId, dataRevision)
  const accounts = useAccounts(dataRevision)
  const hasCharts = overview.status === 'ready' && overview.data.rows.length > 0
  const [active, setActive] = useActiveSection(sectionIds, hasCharts)

  const jumpTo = (id: string): void => {
    setActive(id)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const openTransactions = ({ month, categoryId }: ChartTarget): void =>
    onOpenTransactions(
      drillDownFilters({
        ...(month ? monthSpan(month) : yearSpan(year)),
        accountId,
        categoryId: categoryId ?? ''
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
          info="Interne overboekingen tellen niet mee."
        />
        {overview.status === 'error' && (
          <p className="errorText">{describeError(overview.error)}</p>
        )}
        {overview.status === 'ready' && overview.data.rows.length === 0 && (
          <p className="muted">Geen transacties in {year}.</p>
        )}
      </section>
      {hasCharts && (
        <>
          <TabBar items={sections} current={active} label="Grafieken" sticky onSelect={jumpTo} />
          <IncomeExpenseChart overview={overview.data} onOpen={openTransactions} />
          <SpendingByCategoryChart overview={overview.data} onOpen={openTransactions} />
          <CategoryEvolutionChart key={year} overview={overview.data} onOpen={openTransactions} />
        </>
      )}
    </>
  )
}
