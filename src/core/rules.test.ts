// Tests rule matching per field and operator, first-match-wins and manual categories.
import { describe, expect, it } from 'vitest'
import type { Rule, Transaction } from '@shared/types'
import { createRuleMatcher, withRuleCategories } from './rules'

function matchRule(candidate: Rule, item: Transaction): boolean {
  return createRuleMatcher(candidate)(item)
}

function changedByRules(transactions: Transaction[], rules: Rule[]): Transaction[] {
  return withRuleCategories(transactions, rules).filter(
    (item, index) => item !== transactions[index]
  )
}

function transaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'tx1',
    accountId: 'BE68539007547034',
    bookingDate: '2026-01-10',
    amountCents: -4530,
    currency: 'EUR',
    counterpartyName: 'Supermarkt Groenhof',
    counterpartyIban: 'BE62 5100 0754 7061',
    message: 'Betaling 10/01 Kaart 1234',
    isInternalTransfer: false,
    importedFrom: 'file.csv',
    ...overrides
  }
}

function rule(overrides: Partial<Rule> = {}): Rule {
  return {
    id: 'rule1',
    field: 'counterpartyName',
    operator: 'contains',
    value: 'groenhof',
    caseSensitive: false,
    categoryId: 'groceries',
    enabled: true,
    ...overrides
  }
}

describe('createRuleMatcher', () => {
  it('contains ignores case by default', () => {
    expect(matchRule(rule(), transaction())).toBe(true)
  })

  it('contains respects case when case sensitive', () => {
    expect(matchRule(rule({ caseSensitive: true }), transaction())).toBe(false)
    expect(matchRule(rule({ caseSensitive: true, value: 'Groenhof' }), transaction())).toBe(true)
  })

  it('equals needs the whole text', () => {
    expect(matchRule(rule({ operator: 'equals' }), transaction())).toBe(false)
    expect(
      matchRule(rule({ operator: 'equals', value: 'supermarkt groenhof' }), transaction())
    ).toBe(true)
  })

  it('regex matches a pattern', () => {
    expect(matchRule(rule({ operator: 'regex', value: '^super.*hof$' }), transaction())).toBe(true)
    expect(matchRule(rule({ operator: 'regex', value: '^hof' }), transaction())).toBe(false)
  })

  it('regex is case sensitive only when asked', () => {
    const pattern = rule({ operator: 'regex', value: 'GROENHOF' })
    expect(matchRule(pattern, transaction())).toBe(true)
    expect(matchRule({ ...pattern, caseSensitive: true }, transaction())).toBe(false)
  })

  it('matches the message field', () => {
    expect(matchRule(rule({ field: 'message', value: 'kaart 1234' }), transaction())).toBe(true)
  })

  it('compares IBANs without spaces or case', () => {
    const byIban = rule({
      field: 'counterpartyIban',
      operator: 'equals',
      value: 'be62510007547061'
    })
    expect(matchRule(byIban, transaction())).toBe(true)
    expect(matchRule({ ...byIban, operator: 'contains', value: 'BE62 5100' }, transaction())).toBe(
      true
    )
  })

  it('searches the counterparty, the message and the description with anyText', () => {
    const anywhere = rule({ field: 'anyText', value: 'apotheek' })
    expect(matchRule(anywhere, transaction({ counterpartyName: 'Apotheek Janssens' }))).toBe(true)
    expect(matchRule(anywhere, transaction({ message: 'Betaling apotheek' }))).toBe(true)
    expect(matchRule(anywhere, transaction({ description: 'AANKOOP APOTHEEK X' }))).toBe(true)
    expect(matchRule(anywhere, transaction())).toBe(false)
  })

  it('does not match a missing field', () => {
    expect(matchRule(rule(), transaction({ counterpartyName: undefined }))).toBe(false)
    expect(
      matchRule(rule({ field: 'counterpartyIban' }), transaction({ counterpartyIban: '' }))
    ).toBe(false)
  })

  it('never matches an invalid regex', () => {
    expect(matchRule(rule({ operator: 'regex', value: '(' }), transaction())).toBe(false)
  })
})

describe('withRuleCategories changes', () => {
  it('lets the first matching rule win', () => {
    const rules = [
      rule({ id: 'a', categoryId: 'first' }),
      rule({ id: 'b', value: 'super', categoryId: 'second' })
    ]
    expect(changedByRules([transaction()], rules)[0].categoryId).toBe('first')
  })

  it('skips disabled rules', () => {
    const rules = [rule({ enabled: false, categoryId: 'off' }), rule({ id: 'b' })]
    expect(changedByRules([transaction()], rules)[0].categoryId).toBe('groceries')
  })

  it('marks the category source as rule', () => {
    expect(changedByRules([transaction()], [rule()])[0]).toMatchObject({
      categoryId: 'groceries',
      categorySource: 'rule'
    })
  })

  it('never touches a manual category', () => {
    const manual = transaction({ categoryId: 'fun', categorySource: 'manual' })
    expect(changedByRules([manual], [rule()])).toEqual([])
  })

  it('returns only changed transactions', () => {
    const unchanged = transaction({ id: 'tx2', categoryId: 'groceries', categorySource: 'rule' })
    const changed = transaction({ id: 'tx3' })
    expect(changedByRules([unchanged, changed], [rule()]).map((item) => item.id)).toEqual(['tx3'])
  })

  it('removes a rule category when the rule no longer matches', () => {
    const stale = transaction({ categoryId: 'groceries', categorySource: 'rule' })
    const [result] = changedByRules([stale], [])
    expect(result.categoryId).toBeUndefined()
    expect(result.categorySource).toBeUndefined()
  })

  it('leaves uncategorised transactions without a match alone', () => {
    expect(changedByRules([transaction()], [rule({ value: 'nothing' })])).toEqual([])
  })
})

describe('withRuleCategories', () => {
  it('returns every transaction in order', () => {
    const list = [transaction({ id: 'a' }), transaction({ id: 'b', counterpartyName: 'Other' })]
    const result = withRuleCategories(list, [rule()])
    expect(result.map((item) => item.id)).toEqual(['a', 'b'])
    expect(result[0].categoryId).toBe('groceries')
    expect(result[1].categoryId).toBeUndefined()
  })
})
