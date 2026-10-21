// Domain types stored on disk and shared between main and renderer.
export type LocalConfig = {
  schemaVersion: 1
  dataDir: string | null
}

export type Account = {
  iban: string
  name: string
}

export type AppSettings = {
  accounts: Account[]
}

export type Category = {
  id: string
  name: string
  parentId?: string
  kind: 'income' | 'expense'
  icon?: string
  // Transactions in this category (and its subcategories) are left out of income, expenses, charts and insights.
  excludedFromTotals?: boolean
}

export type RuleField = 'counterpartyName' | 'message' | 'counterpartyIban' | 'anyText'
export type RuleOperator = 'contains' | 'equals' | 'regex'

export type Rule = {
  id: string
  field: RuleField
  operator: RuleOperator
  value: string
  caseSensitive: boolean
  categoryId: string
  enabled: boolean
  isDefault?: boolean
}

export type BudgetPeriod = 'month' | 'year'

export type Budget = {
  categoryId: string
  period: BudgetPeriod
  amountCents: number
}

export type Transaction = {
  id: string
  accountId: string
  bookingDate: string
  valueDate?: string
  amountCents: number
  currency: string
  counterpartyName?: string
  counterpartyIban?: string
  message?: string
  statementNumber?: string
  transactionNumber?: string
  description?: string
  categoryId?: string
  categorySource?: 'manual' | 'rule'
  isInternalTransfer: boolean
  importedFrom: string
}

export type DataVersion = {
  counter: number
  updatedAt: string
  updatedBy: string
}
