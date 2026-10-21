// Finds notable things in the spending of a period: facts, biggest expenses (recurring ones once), counterparties and movers.
import { lastDayOfMonth, monthKey, monthKeysBetween } from '@shared/dates'
import type {
  CategoryMover,
  InsightFact,
  Insights,
  TopCounterparty,
  TopExpense
} from '@shared/insightTypes'
import type { DateSpan } from '@shared/periods'
import type { Category, Transaction } from '@shared/types'
import { countedTransactions, withoutExcludedCategories } from './countedTransactions'
import { counterpartyKey } from './counterpartyKey'
import { findRecurringSeries, type RecurringSeries } from './recurring'

const topExpenseCount = 10
const topCounterpartyCount = 5
const moverCount = 3
const minMoverChangeCents = 500
const minCompleteMonths = 3
const minVisits = 3
const minTransactionsForWeekday = 20

export type InsightPeriod = DateSpan

export type InsightRequest = {
  period: InsightPeriod
  previous: InsightPeriod
  accountIds?: string[]
}

type Spend = {
  transaction: Transaction
  cents: number
}

export function computeInsights(
  transactions: Transaction[],
  categories: Category[],
  request: InsightRequest
): Insights {
  const current = countedTransactions(transactions, categories, request.period, request.accountIds)
  const previous = countedTransactions(
    transactions,
    categories,
    request.previous,
    request.accountIds
  )
  const spends = toSpends(current)
  const rootOf = rootCategoryFinder(categories)
  const currentByCategory = sumByRootCategory(spends, rootOf)
  const previousByCategory = sumByRootCategory(toSpends(previous), rootOf)
  const movers = findMovers(currentByCategory, previousByCategory)

  return {
    facts: buildFacts(current, spends, currentByCategory, request.period),
    topExpenses: topExpenses(
      spends,
      recurringSeriesByTransaction(withoutExcludedCategories(transactions, categories))
    ),
    topCounterparties: topCounterparties(spends),
    risers: movers.filter((mover) => mover.changeCents > 0).slice(0, moverCount),
    fallers: movers
      .filter((mover) => mover.changeCents < 0)
      .reverse()
      .slice(0, moverCount),
    hasPreviousPeriod: previous.some((transaction) => transaction.amountCents < 0)
  }
}

function toSpends(transactions: Transaction[]): Spend[] {
  return transactions
    .filter((transaction) => transaction.amountCents < 0)
    .map((transaction) => ({ transaction, cents: -transaction.amountCents }))
}

function rootCategoryFinder(categories: Category[]): (categoryId: string) => string | undefined {
  const byId = new Map(categories.map((category) => [category.id, category]))
  return (categoryId) => {
    let current = byId.get(categoryId)
    while (current?.parentId !== undefined && byId.has(current.parentId)) {
      current = byId.get(current.parentId)
    }
    return current?.id
  }
}

function sumByRootCategory(
  spends: Spend[],
  rootOf: (categoryId: string) => string | undefined
): Map<string, number> {
  const sums = new Map<string, number>()
  for (const { transaction, cents } of spends) {
    const root = transaction.categoryId ? rootOf(transaction.categoryId) : undefined
    if (root) sums.set(root, (sums.get(root) ?? 0) + cents)
  }
  return sums
}

function findMovers(current: Map<string, number>, previous: Map<string, number>): CategoryMover[] {
  const ids = new Set([...current.keys(), ...previous.keys()])
  return [...ids]
    .map((categoryId) => {
      const currentCents = current.get(categoryId) ?? 0
      const previousCents = previous.get(categoryId) ?? 0
      return { categoryId, currentCents, previousCents, changeCents: currentCents - previousCents }
    })
    .filter((mover) => Math.abs(mover.changeCents) >= minMoverChangeCents)
    .sort((a, b) => b.changeCents - a.changeCents || a.categoryId.localeCompare(b.categoryId))
}

// A recurring payment takes one place in the list: its biggest occurrence, with how often it occurred.
function topExpenses(spends: Spend[], seriesOf: Map<string, RecurringSeries>): TopExpense[] {
  return groupRecurring(spends, seriesOf)
    .map((group) => ({ biggest: [...group].sort(biggestFirst)[0], count: group.length }))
    .sort((a, b) => biggestFirst(a.biggest, b.biggest))
    .slice(0, topExpenseCount)
    .map(({ biggest: { transaction, cents }, count }) => ({
      id: transaction.id,
      bookingDate: transaction.bookingDate,
      counterparty: transaction.counterpartyName ?? transaction.counterpartyIban ?? '',
      categoryId: transaction.categoryId,
      amountCents: cents,
      count
    }))
}

function groupRecurring(spends: Spend[], seriesOf: Map<string, RecurringSeries>): Spend[][] {
  const groups = new Map<RecurringSeries | string, Spend[]>()
  for (const spend of spends) {
    const key = seriesOf.get(spend.transaction.id) ?? spend.transaction.id
    groups.set(key, [...(groups.get(key) ?? []), spend])
  }
  return [...groups.values()]
}

function biggestFirst(a: Spend, b: Spend): number {
  return (
    b.cents - a.cents ||
    b.transaction.bookingDate.localeCompare(a.transaction.bookingDate) ||
    a.transaction.id.localeCompare(b.transaction.id)
  )
}

function recurringSeriesByTransaction(transactions: Transaction[]): Map<string, RecurringSeries> {
  const seriesOf = new Map<string, RecurringSeries>()
  for (const series of findRecurringSeries(transactions)) {
    for (const transaction of series.transactions) seriesOf.set(transaction.id, series)
  }
  return seriesOf
}

function groupByCounterparty(spends: Spend[]): TopCounterparty[] {
  const groups = new Map<string, TopCounterparty>()
  for (const { transaction, cents } of spends) {
    const key = counterpartyKey(transaction)
    if (key === '') continue
    const name = transaction.counterpartyName ?? transaction.counterpartyIban ?? key
    const group = groups.get(key) ?? { name, totalCents: 0, count: 0 }
    groups.set(key, { name, totalCents: group.totalCents + cents, count: group.count + 1 })
  }
  return [...groups.values()]
}

function topCounterparties(spends: Spend[]): TopCounterparty[] {
  return groupByCounterparty(spends)
    .sort((a, b) => b.totalCents - a.totalCents || a.name.localeCompare(b.name))
    .slice(0, topCounterpartyCount)
}

function buildFacts(
  current: Transaction[],
  spends: Spend[],
  byCategory: Map<string, number>,
  period: InsightPeriod
): InsightFact[] {
  const totalCents = sumCents(spends)
  if (totalCents === 0) return []

  const facts: Array<InsightFact | undefined> = [
    averagePerMonth(totalCents, period),
    ...extremeMonths(spends, period),
    biggestCategory(byCategory, totalCents),
    mostVisitedCounterparty(spends),
    busiestWeekday(spends),
    savingsRate(current, totalCents),
    uncategorized(spends)
  ]
  return facts.filter((fact): fact is InsightFact => fact !== undefined)
}

function sumCents(spends: Spend[]): number {
  return spends.reduce((total, spend) => total + spend.cents, 0)
}

function averagePerMonth(totalCents: number, period: InsightPeriod): InsightFact {
  const months = monthKeysBetween(period.from, period.to).length
  return { kind: 'averagePerMonth', cents: Math.round(totalCents / months), months }
}

function extremeMonths(spends: Spend[], period: InsightPeriod): InsightFact[] {
  const perMonth = new Map<string, number>()
  for (const { transaction, cents } of spends) {
    const key = monthKey(transaction.bookingDate)
    perMonth.set(key, (perMonth.get(key) ?? 0) + cents)
  }
  const complete = monthKeysBetween(period.from, period.to).filter(
    (key) => `${key}-01` >= period.from && lastDayOfMonth(key) <= period.to
  )
  const totals = complete
    .filter((key) => perMonth.has(key))
    .map((month) => ({ month, cents: perMonth.get(month)! }))
  if (totals.length < minCompleteMonths) return []

  const sorted = [...totals].sort((a, b) => b.cents - a.cents || a.month.localeCompare(b.month))
  const priciest = sorted[0]
  const cheapest = sorted[sorted.length - 1]
  if (priciest.cents === cheapest.cents) return []
  return [
    { kind: 'priciestMonth', ...priciest },
    { kind: 'cheapestMonth', ...cheapest }
  ]
}

function biggestCategory(
  byCategory: Map<string, number>,
  totalCents: number
): InsightFact | undefined {
  const [categoryId, cents] =
    [...byCategory.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0] ?? []
  if (categoryId === undefined || cents === undefined) return undefined
  return {
    kind: 'biggestCategory',
    categoryId,
    cents,
    percent: Math.round((cents / totalCents) * 100)
  }
}

function mostVisitedCounterparty(spends: Spend[]): InsightFact | undefined {
  const top = groupByCounterparty(spends).sort(
    (a, b) => b.count - a.count || b.totalCents - a.totalCents || a.name.localeCompare(b.name)
  )[0]
  if (!top || top.count < minVisits) return undefined
  return {
    kind: 'mostVisitedCounterparty',
    name: top.name,
    count: top.count,
    totalCents: top.totalCents
  }
}

function busiestWeekday(spends: Spend[]): InsightFact | undefined {
  if (spends.length < minTransactionsForWeekday) return undefined
  const perWeekday = new Map<number, number>()
  for (const { transaction, cents } of spends) {
    const weekday = new Date(`${transaction.bookingDate}T00:00:00Z`).getUTCDay()
    perWeekday.set(weekday, (perWeekday.get(weekday) ?? 0) + cents)
  }
  const [weekday, cents] = [...perWeekday.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0]
  return { kind: 'busiestWeekday', weekday, cents }
}

function savingsRate(current: Transaction[], spentCents: number): InsightFact | undefined {
  const incomeCents = current
    .filter((transaction) => transaction.amountCents > 0)
    .reduce((total, transaction) => total + transaction.amountCents, 0)
  if (incomeCents === 0) return undefined
  const savedCents = incomeCents - spentCents
  return { kind: 'savingsRate', percent: Math.round((savedCents / incomeCents) * 100), savedCents }
}

function uncategorized(spends: Spend[]): InsightFact | undefined {
  const count = spends.filter(({ transaction }) => !transaction.categoryId).length
  return count > 0 ? { kind: 'uncategorized', count } : undefined
}
