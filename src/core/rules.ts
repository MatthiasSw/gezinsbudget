// Matches categorisation rules against transactions and applies the first matching rule.
import { normalizeIban } from '@shared/iban'
import type { Rule, Transaction } from '@shared/types'

export type TransactionMatcher = (transaction: Transaction) => boolean

export function createRuleMatcher(rule: Rule): TransactionMatcher {
  const test = createTextTest(rule)
  return (transaction) => readFields(transaction, rule.field).some(test)
}

export function matchRule(rule: Rule, transaction: Transaction): boolean {
  return createRuleMatcher(rule)(transaction)
}

export function applyRules(transactions: Transaction[], rules: Rule[]): Transaction[] {
  return withRuleCategories(transactions, rules).filter(
    (transaction, index) => transaction !== transactions[index]
  )
}

export function withRuleCategories(transactions: Transaction[], rules: Rule[]): Transaction[] {
  const matchers = rules
    .filter((rule) => rule.enabled)
    .map((rule) => ({ rule, matches: createRuleMatcher(rule) }))

  return transactions.map((transaction) => {
    if (transaction.categorySource === 'manual') return transaction
    const match = matchers.find(({ matches }) => matches(transaction))
    return match ? withRuleCategory(transaction, match.rule) : withoutRuleCategory(transaction)
  })
}

function withRuleCategory(transaction: Transaction, rule: Rule): Transaction {
  if (transaction.categoryId === rule.categoryId && transaction.categorySource === 'rule') {
    return transaction
  }
  return { ...transaction, categoryId: rule.categoryId, categorySource: 'rule' }
}

function withoutRuleCategory(transaction: Transaction): Transaction {
  if (transaction.categorySource !== 'rule') return transaction
  const { categoryId: removedCategory, categorySource: removedSource, ...rest } = transaction
  void removedCategory
  void removedSource
  return rest
}

function readFields(transaction: Transaction, field: Rule['field']): string[] {
  if (field === 'counterpartyIban') {
    return transaction.counterpartyIban ? [normalizeIban(transaction.counterpartyIban)] : []
  }
  if (field === 'anyText') {
    return [transaction.counterpartyName, transaction.message, transaction.description].filter(
      (text): text is string => text !== undefined && text !== ''
    )
  }
  const text = transaction[field]
  return text === undefined ? [] : [text]
}

function createTextTest(rule: Rule): (text: string) => boolean {
  if (rule.operator === 'regex') return createRegexTest(rule)

  const normalize = createNormalizer(rule)
  const wanted = normalize(rule.value)
  if (rule.operator === 'equals') return (text) => normalize(text) === wanted
  return (text) => normalize(text).includes(wanted)
}

function createNormalizer(rule: Rule): (text: string) => string {
  if (rule.field === 'counterpartyIban') return normalizeIban
  return rule.caseSensitive ? (text) => text : (text) => text.toLowerCase()
}

function createRegexTest(rule: Rule): (text: string) => boolean {
  try {
    const expression = new RegExp(rule.value, rule.caseSensitive ? '' : 'i')
    return (text) => expression.test(text)
  } catch {
    return () => false
  }
}
