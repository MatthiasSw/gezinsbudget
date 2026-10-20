// Tests which rule is proposed after a manual categorisation and when none is.
import { describe, expect, it } from 'vitest'
import { buildRuleFromOffer, hasRuleFor, proposeRule } from './ruleOffer'
import type { Rule, Transaction } from './types'

function transaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'tx1',
    accountId: 'BE68539007547034',
    bookingDate: '2026-01-10',
    amountCents: -4530,
    currency: 'EUR',
    counterpartyName: 'Supermarkt Groenhof',
    counterpartyIban: 'BE62 5100 0754 7061',
    isInternalTransfer: false,
    importedFrom: 'file.csv',
    ...overrides
  }
}

describe('proposeRule', () => {
  it('prefers the IBAN when present', () => {
    expect(proposeRule([transaction()], 'groceries')).toEqual({
      field: 'counterpartyIban',
      value: 'BE62510007547061',
      counterpartyLabel: 'Supermarkt Groenhof',
      categoryId: 'groceries'
    })
  })

  it('falls back to the name without an IBAN', () => {
    const offer = proposeRule([transaction({ counterpartyIban: undefined })], 'groceries')
    expect(offer).toMatchObject({ field: 'counterpartyName', value: 'Supermarkt Groenhof' })
  })

  it('proposes a rule when a selection shares one counterparty', () => {
    const offer = proposeRule([transaction(), transaction({ id: 'tx2' })], 'groceries')
    expect(offer?.field).toBe('counterpartyIban')
  })

  it('proposes nothing when the selection mixes counterparties', () => {
    const other = transaction({
      id: 'tx2',
      counterpartyName: 'Bakkerij Zon',
      counterpartyIban: 'BE71096123456769'
    })
    expect(proposeRule([transaction(), other], 'groceries')).toBeNull()
  })

  it('proposes nothing without a counterparty', () => {
    const anonymous = transaction({ counterpartyIban: undefined, counterpartyName: undefined })
    expect(proposeRule([anonymous], 'groceries')).toBeNull()
  })

  it('proposes nothing for an empty selection', () => {
    expect(proposeRule([], 'groceries')).toBeNull()
  })
})

describe('hasRuleFor', () => {
  const offer = proposeRule([transaction()], 'groceries')!
  const existing: Rule = {
    id: 'r1',
    field: 'counterpartyIban',
    operator: 'equals',
    value: 'be62 5100 0754 7061',
    caseSensitive: false,
    categoryId: 'other',
    enabled: true
  }

  it('recognises an equivalent rule whatever its category', () => {
    expect(hasRuleFor(offer, [existing])).toBe(true)
  })

  it('ignores rules on another field or operator', () => {
    expect(hasRuleFor(offer, [{ ...existing, operator: 'contains' }])).toBe(false)
    expect(hasRuleFor(offer, [{ ...existing, field: 'message' }])).toBe(false)
  })
})

describe('buildRuleFromOffer', () => {
  it('builds an enabled, case-insensitive equals rule', () => {
    const offer = proposeRule([transaction()], 'groceries')!
    expect(buildRuleFromOffer(offer, 'new-id')).toEqual({
      id: 'new-id',
      field: 'counterpartyIban',
      operator: 'equals',
      value: 'BE62510007547061',
      caseSensitive: false,
      categoryId: 'groceries',
      enabled: true
    })
  })
})
