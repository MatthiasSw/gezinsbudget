// Tests that invalid rule lists are rejected before saving.
import { describe, expect, it } from 'vitest'
import type { Category, Rule } from '@shared/types'
import { assertValidRules } from './ruleValidation'

const categories: Category[] = [{ id: 'groceries', name: 'Boodschappen', kind: 'expense' }]

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

describe('assertValidRules', () => {
  it('accepts valid rules', () => {
    expect(() => assertValidRules([rule()], categories)).not.toThrow()
  })

  it('rejects an invalid regex', () => {
    expect(() => assertValidRules([rule({ operator: 'regex', value: '(' })], categories)).toThrow(
      /regex/i
    )
  })

  it('rejects an empty value', () => {
    expect(() => assertValidRules([rule({ value: '  ' })], categories)).toThrow(/value/)
  })

  it('rejects an unknown category', () => {
    expect(() => assertValidRules([rule({ categoryId: 'missing' })], categories)).toThrow(
      /category/
    )
  })

  it('rejects duplicate ids', () => {
    expect(() => assertValidRules([rule(), rule()], categories)).toThrow(/unique/)
  })
})
