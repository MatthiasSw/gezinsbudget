// Proposes an equals rule after a manual categorisation, based on the counterparty.
import { normalizeIban } from './iban'
import type { Rule, Transaction } from './types'

export type RuleOffer = {
  field: 'counterpartyIban' | 'counterpartyName'
  value: string
  counterpartyLabel: string
  categoryId: string
}

export function proposeRule(transactions: Transaction[], categoryId: string): RuleOffer | null {
  if (transactions.length === 0) return null
  return proposeByIban(transactions, categoryId) ?? proposeByName(transactions, categoryId)
}

export function hasRuleFor(offer: RuleOffer, rules: Rule[]): boolean {
  return rules.some(
    (rule) =>
      rule.operator === 'equals' &&
      rule.field === offer.field &&
      sameValue(offer.field, rule.value, offer.value)
  )
}

export function buildRuleFromOffer(offer: RuleOffer, id: string): Rule {
  return {
    id,
    field: offer.field,
    operator: 'equals',
    value: offer.value,
    caseSensitive: false,
    categoryId: offer.categoryId,
    enabled: true
  }
}

function proposeByIban(transactions: Transaction[], categoryId: string): RuleOffer | null {
  const ibans = transactions.map((transaction) => normalizeIban(transaction.counterpartyIban))
  const [first] = ibans
  if (first === '' || ibans.some((iban) => iban !== first)) return null

  const named = transactions.find((transaction) => transaction.counterpartyName)
  return {
    field: 'counterpartyIban',
    value: first,
    counterpartyLabel: named?.counterpartyName ?? first,
    categoryId
  }
}

function proposeByName(transactions: Transaction[], categoryId: string): RuleOffer | null {
  const names = transactions.map((transaction) => (transaction.counterpartyName ?? '').trim())
  const [first] = names
  if (first === '' || names.some((name) => name.toLowerCase() !== first.toLowerCase())) return null
  return { field: 'counterpartyName', value: first, counterpartyLabel: first, categoryId }
}

function sameValue(field: Rule['field'], left: string, right: string): boolean {
  if (field === 'counterpartyIban') return normalizeIban(left) === normalizeIban(right)
  return left.trim().toLowerCase() === right.trim().toLowerCase()
}
