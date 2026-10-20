// Validates a list of rules before it is saved.
import { AppError } from '@shared/errors'
import type { Category, Rule } from '@shared/types'

export function assertValidRules(rules: Rule[], categories: Category[]): void {
  const categoryIds = new Set(categories.map((category) => category.id))
  const ruleIds = new Set<string>()

  for (const rule of rules) {
    if (ruleIds.has(rule.id)) fail('Rule ids must be unique', rule)
    ruleIds.add(rule.id)
    if (rule.value.trim() === '') fail('A rule needs a value', rule)
    if (!categoryIds.has(rule.categoryId)) fail('A rule points to an unknown category', rule)
    if (rule.operator === 'regex' && !isValidRegex(rule.value)) fail('Invalid regex', rule)
  }
}

function isValidRegex(pattern: string): boolean {
  try {
    new RegExp(pattern)
    return true
  } catch {
    return false
  }
}

function fail(message: string, rule: Rule): never {
  throw new AppError('INVALID_RULES', message, { ruleId: rule.id })
}
