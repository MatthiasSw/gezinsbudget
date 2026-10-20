// Charts page: pick a year and account, jump between the charts from a sticky menu and see them all.
import { useState } from 'react'
import { CategoryEvolutionChart, evolutionSectionId } from '../charts/CategoryEvolutionChart'
import { IncomeExpenseChart, incomeExpenseSectionId } from '../charts/IncomeExpenseChart'
import { SpendingByCategoryChart, spendingSectionId } from '../charts/SpendingByCategoryChart'
import { describeError } from '../errorMessages'
import { useActiveSection } from '../hooks/useActiveSection'
import { useYearChoice } from '../hooks/useYearChoice'
import { useYearOverview } from '../hooks/useYearOverview'
import { TabBar, type TabItem } from './TabBar'
import { YearAccountFilter } from './YearAccountFilter'

type ChartsViewProps = {
  dataRevision: number
}

const sections: TabItem<string>[] = [
  { id: incomeExpenseSectionId, label: 'Inkomsten en uitgaven' },
  { id: spendingSectionId, label: 'Uitgaven per categorie' },
  { id: evolutionSectionId, label: 'Evolutie per categorie' }
]
const sectionIds = sections.map((section) => section.id)

export function ChartsView({ dataRevision }: ChartsViewProps): React.JSX.Element {
  const { year, years, setYear } = useYearChoice(dataRevision)
  const [accountId, setAccountId] = useState('')
  const { overview, accounts } = useYearOverview(year, accountId, dataRevision)
  const hasCharts = overview.status === 'ready' && overview.data.rows.length > 0
  const [active, setActive] = useActiveSection(sectionIds, hasCharts)

  const jumpTo = (id: string): void => {
    setActive(id)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

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
          <IncomeExpenseChart overview={overview.data} />
          <SpendingByCategoryChart overview={overview.data} />
          <CategoryEvolutionChart overview={overview.data} />
        </>
      )}
    </>
  )
}
