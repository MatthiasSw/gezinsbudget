// Dutch labels for rule fields and operators.
import type { RuleField, RuleOperator } from '@shared/types'

export const ruleFieldLabels: Record<RuleField, string> = {
  anyText: 'Tegenpartij of mededeling',
  counterpartyName: 'Tegenpartij',
  message: 'Mededeling',
  counterpartyIban: 'IBAN tegenpartij'
}

export const ruleOperatorLabels: Record<RuleOperator, string> = {
  contains: 'bevat',
  equals: 'is gelijk aan',
  regex: 'regex'
}
