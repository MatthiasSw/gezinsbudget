// The cards on the Interessant page: facts, biggest expenses, top counterparties and category changes.
import { formatBelgianDate } from '@shared/dates'
import type { CategoryMover, InsightFact, TopCounterparty, TopExpense } from '@shared/insightTypes'
import { formatCents } from '@shared/money'
import type { Category } from '@shared/types'
import { categoryName, describeFact } from '../insightText'
import { pluralize } from '../plural'

type FactsCardProps = {
  facts: InsightFact[]
  categories: Category[]
}

type TopExpensesCardProps = {
  expenses: TopExpense[]
  categories: Category[]
  onOpen: (expense: TopExpense) => void
}

type TopCounterpartiesCardProps = {
  counterparties: TopCounterparty[]
}

type MoversCardProps = {
  risers: CategoryMover[]
  fallers: CategoryMover[]
  hasPreviousPeriod: boolean
  categories: Category[]
}

export function FactsCard({ facts, categories }: FactsCardProps): React.JSX.Element {
  return (
    <section className="panel insightCard wide">
      <h2>Wist je dat…</h2>
      {facts.length === 0 ? (
        <p className="muted">Nog te weinig uitgaven in deze periode om iets op te merken.</p>
      ) : (
        <ul className="factList">
          {facts.map((fact) => (
            <li key={fact.kind}>{describeFact(fact, categories)}</li>
          ))}
        </ul>
      )}
    </section>
  )
}

export function TopExpensesCard({
  expenses,
  categories,
  onOpen
}: TopExpensesCardProps): React.JSX.Element {
  return (
    <section className="panel insightCard">
      <h2>Top uitgaven</h2>
      {expenses.length === 0 ? (
        <p className="muted">Geen uitgaven in deze periode.</p>
      ) : (
        <table className="insightTable">
          <tbody>
            {expenses.map((expense, index) => (
              <tr key={expense.id} className="clickableRow" onClick={() => onOpen(expense)}>
                <td className="rank">{index + 1}</td>
                <td>
                  {expense.counterparty || '–'}
                  <span className="muted detail">
                    {expense.count > 1 &&
                      `${pluralize(expense.count, 'betaling', 'betalingen')}, grootste van `}
                    {formatBelgianDate(expense.bookingDate)}
                    {expense.categoryId && ` · ${categoryName(expense.categoryId, categories)}`}
                  </span>
                </td>
                <td className="amount negative">{formatCents(-expense.amountCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}

export function TopCounterpartiesCard({
  counterparties
}: TopCounterpartiesCardProps): React.JSX.Element {
  return (
    <section className="panel insightCard">
      <h2>Waar ging het meeste geld naartoe?</h2>
      {counterparties.length === 0 ? (
        <p className="muted">Geen uitgaven in deze periode.</p>
      ) : (
        <table className="insightTable">
          <tbody>
            {counterparties.map((item, index) => (
              <tr key={item.name}>
                <td className="rank">{index + 1}</td>
                <td>
                  {item.name}
                  <span className="muted detail">
                    {pluralize(item.count, 'betaling', 'betalingen')}
                  </span>
                </td>
                <td className="amount negative">{formatCents(-item.totalCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}

export function MoversCard({
  risers,
  fallers,
  hasPreviousPeriod,
  categories
}: MoversCardProps): React.JSX.Element {
  return (
    <section className="panel insightCard wide">
      <h2>Stijgers en dalers</h2>
      <p className="muted">Hoofdcategorieën vergeleken met dezelfde periode een jaar eerder.</p>
      {!hasPreviousPeriod ? (
        <p className="muted">
          Er zijn nog geen uitgaven van een jaar eerder om mee te vergelijken.
        </p>
      ) : (
        <div className="moverColumns">
          <MoverList title="▲ Meer uitgegeven" movers={risers} categories={categories} />
          <MoverList title="▼ Minder uitgegeven" movers={fallers} categories={categories} />
        </div>
      )}
    </section>
  )
}

function MoverList({
  title,
  movers,
  categories
}: {
  title: string
  movers: CategoryMover[]
  categories: Category[]
}): React.JSX.Element {
  return (
    <div>
      <h3>{title}</h3>
      {movers.length === 0 ? (
        <p className="muted">Geen noemenswaardige verschillen.</p>
      ) : (
        <ul className="moverList">
          {movers.map((mover) => (
            <li key={mover.categoryId}>
              <strong>{categoryName(mover.categoryId, categories)}</strong>
              <span>
                {formatCents(mover.currentCents)} tegenover {formatCents(mover.previousCents)}
              </span>
              <span className={mover.changeCents > 0 ? 'negative' : 'positive'}>
                {mover.changeCents > 0 ? '+' : '−'}
                {formatCents(Math.abs(mover.changeCents))}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
