// Tests that user rules stay ahead of default rules without changing their own order.
import { describe, expect, it } from 'vitest'
import type { Rule } from '@shared/types'
import { userRulesFirst } from './ruleOrder'

function rule(id: string, isDefault?: boolean): Rule {
  return {
    id,
    field: 'anyText',
    operator: 'contains',
    value: id,
    caseSensitive: false,
    categoryId: 'c',
    enabled: true,
    isDefault
  }
}

describe('userRulesFirst', () => {
  it('moves default rules behind the user rules and keeps each group in order', () => {
    const ordered = userRulesFirst([
      rule('d1', true),
      rule('u1'),
      rule('d2', true),
      rule('u2', false)
    ])
    expect(ordered.map((item) => item.id)).toEqual(['u1', 'u2', 'd1', 'd2'])
  })

  it('does not change the list it is given', () => {
    const rules = [rule('d1', true), rule('u1')]
    userRulesFirst(rules)
    expect(rules.map((item) => item.id)).toEqual(['d1', 'u1'])
  })
})
