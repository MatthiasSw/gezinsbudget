// Recurring tab: monthly expenses found in the transactions, with their cost per month and per year.
import { useState } from 'react'
import { categoryLabel } from '@shared/categoryIcons'
import { formatBelgianDate } from '@shared/dates'
import { formatCents } from '@shared/money'
import type { RecurringSpend } from '@shared/recurringTypes'
import type { Category } from '@shared/types'
import { api } from '../api'
import { describeError } from '../errorMessages'
import { drillDownFilters, type OpenTransactions } from '../filters'
import { useAsyncData } from '../hooks/useAsyncData'
import { pluralize, pluralWord } from '../plural'
import { InfoTip } from './InfoTip'

type RecurringViewProps = {
  dataRevision: number
  onOpenTransactions: OpenTransactions
}

const recurringInfo =
  'Gezinsbudget zoekt uitgaven aan dezelfde tegenpartij die minstens drie keer, ongeveer elke maand en voor een vergelijkbaar bedrag (tot 10% verschil) terugkomen. Het getoonde bedrag is het typische bedrag. Een uitgave die al meer dan zes weken niet meer voorkwam, lijkt gestopt. Is de laatste betaling meer dan zes maanden geleden, dan wordt ze helemaal niet meer getoond. Interne overboekingen tellen niet mee.'

const loadRecurringData = (): Promise<[RecurringSpend[], Category[]]> =>
  Promise.all([api.recurring.get(), api.categories.get()])

export function RecurringView({
  dataRevision,
  onOpenTransactions
}: RecurringViewProps): React.JSX.Element {
  const [showStopped, setShowStopped] = useState(false)
  const { state } = useAsyncData(loadRecurringData, dataRevision)

  if (state.status === 'loading') return <p className="muted">Laden…</p>
  if (state.status === 'error') return <p className="errorText">{describeError(state.error)}</p>

  const [recurring, categories] = state.data
  const categoryById = new Map(categories.map((category) => [category.id, category]))
  const active = recurring.filter((item) => item.active)
  const stopped = recurring.length - active.length
  const shown = showStopped ? recurring : active
  const monthlyCents = sum(active, (item) => item.amountCents)
  const yearlyCents = sum(active, (item) => item.yearlyCents)

  const openTransactions = (item: RecurringSpend): void =>
    onOpenTransactions(drillDownFilters({ search: item.counterparty }))

  return (
    <section>
      <h2>
        Terugkerende uitgaven <InfoTip text={recurringInfo} />
      </h2>

      {recurring.length === 0 ? (
        <p className="muted">
          Nog geen terugkerende uitgaven gevonden. Daarvoor heb je minstens drie opeenvolgende
          maanden aan transacties nodig.
        </p>
      ) : (
        <>
          <p>
            <strong>{active.length}</strong> {pluralWord(active.length, 'uitgave', 'uitgaven')}{' '}
            komen nog terug, samen ongeveer <strong>{formatCents(monthlyCents)}</strong> per maand
            of <strong>{formatCents(yearlyCents)}</strong> per jaar.
          </p>
          {stopped > 0 && (
            <label className="inlineLabel">
              <input
                type="checkbox"
                checked={showStopped}
                onChange={(event) => setShowStopped(event.target.checked)}
              />
              Toon ook {pluralize(stopped, 'uitgave', 'uitgaven')} die gestopt{' '}
              {pluralWord(stopped, 'lijkt', 'lijken')}
            </label>
          )}

          <table className="recurring">
            <thead>
              <tr>
                <th>Tegenpartij</th>
                <th>Categorie</th>
                <th className="amount">Per maand</th>
                <th className="amount">Per jaar</th>
                <th>Laatste betaling</th>
                <th className="amount">Aantal keer</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((item) => {
                const category = item.categoryId ? categoryById.get(item.categoryId) : undefined
                return (
                  <tr
                    key={`${item.key}-${item.amountCents}`}
                    className={item.active ? 'clickableRow' : 'clickableRow stopped'}
                    onClick={() => openTransactions(item)}
                  >
                    <td>{item.counterparty}</td>
                    <td>{category ? categoryLabel(category) : '–'}</td>
                    <td className="amount negative">{formatCents(-item.amountCents)}</td>
                    <td className="amount negative">{formatCents(-item.yearlyCents)}</td>
                    <td className="nowrap">
                      {formatBelgianDate(item.lastDate)}
                      {!item.active && <span className="muted"> · gestopt?</span>}
                    </td>
                    <td className="amount">{item.occurrences}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <p className="muted">Klik op een rij om de transacties te bekijken.</p>
        </>
      )}
    </section>
  )
}

function sum(items: RecurringSpend[], pick: (item: RecurringSpend) => number): number {
  return items.reduce((total, item) => total + pick(item), 0)
}
