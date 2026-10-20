// Sums transactions per category and month; internal transfers never count.
import { categoryIcon } from '@shared/categoryIcons'
import { flattenTree } from '@shared/categoryTree'
import { monthKey, monthKeysBetween } from '@shared/dates'
import { normalizeIban } from '@shared/iban'
import type { MonthTotals, OverviewRequest, OverviewRow, OverviewTable } from '@shared/overview'
import type { Category, Transaction } from '@shared/types'

type Bucket = {
  perMonth: Record<string, number>
  count: number
}

export function totalsByCategoryAndMonth(
  transactions: Transaction[],
  categories: Category[],
  request: OverviewRequest
): OverviewTable {
  const months = monthKeysBetween(request.from, request.to)
  const included = selectTransactions(transactions, request)
  const knownIds = new Set(categories.map((category) => category.id))

  const own = new Map<string | null, Bucket>()
  for (const transaction of included) {
    const key =
      transaction.categoryId && knownIds.has(transaction.categoryId) ? transaction.categoryId : null
    addToBucket(own, key, transaction, months)
  }

  const subtree = sumSubtrees(own, categories, months)
  const rows = buildRows(categories, subtree, own.get(null), months)
  return { months, rows, ...buildTotals(included, months) }
}

function selectTransactions(transactions: Transaction[], request: OverviewRequest): Transaction[] {
  const accountIds = request.accountIds?.map(normalizeIban)
  return transactions.filter(
    (transaction) =>
      !transaction.isInternalTransfer &&
      transaction.bookingDate >= request.from &&
      transaction.bookingDate <= request.to &&
      (!accountIds?.length || accountIds.includes(transaction.accountId))
  )
}

function addToBucket(
  buckets: Map<string | null, Bucket>,
  key: string | null,
  transaction: Transaction,
  months: string[]
): void {
  const bucket = buckets.get(key) ?? emptyBucket(months)
  const month = monthKey(transaction.bookingDate)
  bucket.perMonth[month] += transaction.amountCents
  bucket.count += 1
  buckets.set(key, bucket)
}

function sumSubtrees(
  own: Map<string | null, Bucket>,
  categories: Category[],
  months: string[]
): Map<string, Bucket> {
  const byId = new Map(categories.map((category) => [category.id, category]))
  const subtree = new Map<string, Bucket>()

  for (const [categoryId, bucket] of own) {
    for (let id = categoryId; id !== null; id = byId.get(id)?.parentId ?? null) {
      const target = subtree.get(id) ?? emptyBucket(months)
      for (const month of months) target.perMonth[month] += bucket.perMonth[month]
      target.count += bucket.count
      subtree.set(id, target)
    }
  }
  return subtree
}

function buildRows(
  categories: Category[],
  subtree: Map<string, Bucket>,
  uncategorized: Bucket | undefined,
  months: string[]
): OverviewRow[] {
  const rows: OverviewRow[] = flattenTree(categories, true)
    .filter(({ category }) => (subtree.get(category.id)?.count ?? 0) > 0)
    .map(({ category, depth }) =>
      toRow(
        category.id,
        category.name,
        categoryIcon(category),
        category.parentId ?? null,
        depth,
        subtree.get(category.id)!,
        months
      )
    )
  if (uncategorized) rows.push(toRow(null, '', '', null, 0, uncategorized, months))
  return rows
}

function toRow(
  categoryId: string | null,
  name: string,
  icon: string,
  parentId: string | null,
  depth: number,
  bucket: Bucket,
  months: string[]
): OverviewRow {
  const totalCents = months.reduce((sum, month) => sum + bucket.perMonth[month], 0)
  return { categoryId, name, icon, parentId, depth, perMonth: bucket.perMonth, totalCents }
}

function buildTotals(
  included: Transaction[],
  months: string[]
): Pick<OverviewTable, 'perMonthTotals' | 'totals'> {
  const perMonthTotals: Record<string, MonthTotals> = {}
  for (const month of months)
    perMonthTotals[month] = { incomeCents: 0, expenseCents: 0, netCents: 0 }
  const totals: MonthTotals = { incomeCents: 0, expenseCents: 0, netCents: 0 }

  for (const transaction of included) {
    const month = perMonthTotals[monthKey(transaction.bookingDate)]
    for (const target of [month, totals]) {
      if (transaction.amountCents > 0) target.incomeCents += transaction.amountCents
      else target.expenseCents -= transaction.amountCents
      target.netCents += transaction.amountCents
    }
  }
  return { perMonthTotals, totals }
}

function emptyBucket(months: string[]): Bucket {
  return { perMonth: Object.fromEntries(months.map((month) => [month, 0])), count: 0 }
}
