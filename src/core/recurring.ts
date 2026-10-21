// Detects monthly recurring expenses: same counterparty, amounts within 10 percent, about a month apart; long-stopped ones are dropped.
import type { RecurringSpend } from '@shared/recurringTypes'
import type { Transaction } from '@shared/types'
import { counterpartyLabel, recurrenceKey } from './counterpartyKey'

const minOccurrences = 3
const amountSpreadRatio = 11 / 9
const minGapDays = 25
const maxGapDays = 36
const monthlyGapShare = 0.75
const activeWithinDays = 45
const forgottenAfterDays = 180
const millisecondsPerDay = 24 * 60 * 60 * 1000

// One run of monthly payments to the same counterparty for about the same amount, oldest first.
export type RecurringSeries = {
  key: string
  transactions: Transaction[]
}

export function detectRecurringSpend(transactions: Transaction[], today: string): RecurringSpend[] {
  return findRecurringSeries(transactions)
    .map((series) => toRecurringSpend(series.key, series.transactions, today))
    .filter((spend) => daysBetweenDates(spend.lastDate, today) <= forgottenAfterDays)
    .sort((a, b) => b.yearlyCents - a.yearlyCents || a.key.localeCompare(b.key))
}

export function findRecurringSeries(transactions: Transaction[]): RecurringSeries[] {
  const found: RecurringSeries[] = []
  for (const [key, group] of groupByCounterparty(transactions)) {
    for (const cluster of clusterByAmount(group)) {
      const sorted = [...cluster].sort(byDate)
      if (sorted.length >= minOccurrences && isMonthly(sorted)) {
        found.push({ key, transactions: sorted })
      }
    }
  }
  return found
}

function groupByCounterparty(transactions: Transaction[]): Map<string, Transaction[]> {
  const groups = new Map<string, Transaction[]>()
  for (const transaction of transactions) {
    if (transaction.amountCents >= 0 || transaction.isInternalTransfer) continue
    const key = recurrenceKey(transaction)
    if (key === '') continue
    const group = groups.get(key)
    if (group) group.push(transaction)
    else groups.set(key, [transaction])
  }
  return groups
}

function clusterByAmount(group: Transaction[]): Transaction[][] {
  const clusters: Transaction[][] = []
  const smallestExpenseFirst = [...group].sort((a, b) => b.amountCents - a.amountCents)
  for (const transaction of smallestExpenseFirst) {
    const current = clusters[clusters.length - 1]
    const smallest = current ? Math.abs(current[0].amountCents) : 0
    if (current && Math.abs(transaction.amountCents) <= smallest * amountSpreadRatio) {
      current.push(transaction)
    } else {
      clusters.push([transaction])
    }
  }
  return clusters
}

function isMonthly(sorted: Transaction[]): boolean {
  const gaps = sorted.slice(1).map((transaction, index) => daysBetween(sorted[index], transaction))
  const monthly = gaps.filter((gap) => gap >= minGapDays && gap <= maxGapDays)
  return monthly.length >= gaps.length * monthlyGapShare
}

function toRecurringSpend(key: string, sorted: Transaction[], today: string): RecurringSpend {
  const last = sorted[sorted.length - 1]
  const amountCents = medianAmount(sorted)
  return {
    key,
    counterparty: counterpartyLabel(last) || key,
    amountCents,
    yearlyCents: amountCents * 12,
    occurrences: sorted.length,
    firstDate: sorted[0].bookingDate,
    lastDate: last.bookingDate,
    categoryId: mostCommonCategory(sorted),
    active: daysBetweenDates(last.bookingDate, today) <= activeWithinDays
  }
}

function medianAmount(sorted: Transaction[]): number {
  const amounts = sorted
    .map((transaction) => Math.abs(transaction.amountCents))
    .sort((a, b) => a - b)
  const middle = Math.floor(amounts.length / 2)
  return amounts.length % 2 === 1
    ? amounts[middle]
    : Math.round((amounts[middle - 1] + amounts[middle]) / 2)
}

function mostCommonCategory(transactions: Transaction[]): string | undefined {
  const counts = new Map<string, number>()
  for (const { categoryId } of transactions) {
    if (categoryId) counts.set(categoryId, (counts.get(categoryId) ?? 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
}

function byDate(a: Transaction, b: Transaction): number {
  return a.bookingDate.localeCompare(b.bookingDate) || a.id.localeCompare(b.id)
}

function daysBetween(earlier: Transaction, later: Transaction): number {
  return daysBetweenDates(earlier.bookingDate, later.bookingDate)
}

function daysBetweenDates(earlier: string, later: string): number {
  return Math.round((Date.parse(later) - Date.parse(earlier)) / millisecondsPerDay)
}
