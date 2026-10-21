// Notable findings about the spending in a period, shared by main and renderer.
export type InsightFact =
  | { kind: 'averagePerMonth'; cents: number; months: number }
  | { kind: 'priciestMonth'; month: string; cents: number }
  | { kind: 'cheapestMonth'; month: string; cents: number }
  | { kind: 'biggestCategory'; categoryId: string; cents: number; percent: number }
  | { kind: 'mostVisitedCounterparty'; name: string; count: number; totalCents: number }
  | { kind: 'busiestWeekday'; weekday: number; cents: number }
  | { kind: 'savingsRate'; percent: number; savedCents: number }
  | { kind: 'uncategorized'; count: number }

export type TopExpense = {
  id: string
  bookingDate: string
  counterparty: string
  categoryId?: string
  amountCents: number
  // How often this payment occurred in the period; more than 1 for a recurring payment, shown once.
  count: number
}

export type TopCounterparty = {
  name: string
  totalCents: number
  count: number
}

export type CategoryMover = {
  categoryId: string
  currentCents: number
  previousCents: number
  changeCents: number
}

export type Insights = {
  facts: InsightFact[]
  topExpenses: TopExpense[]
  topCounterparties: TopCounterparty[]
  risers: CategoryMover[]
  fallers: CategoryMover[]
  hasPreviousPeriod: boolean
}
