// A detected monthly expense, shared by main and renderer.
export type RecurringSpend = {
  key: string
  counterparty: string
  amountCents: number
  yearlyCents: number
  occurrences: number
  firstDate: string
  lastDate: string
  categoryId?: string
  active: boolean
}
