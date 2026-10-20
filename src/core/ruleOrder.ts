// Keeps the user's own rules ahead of the default rules, so they win when both match.
import type { Rule } from '@shared/types'

export function userRulesFirst(rules: Rule[]): Rule[] {
  return [...rules.filter((rule) => !rule.isDefault), ...rules.filter((rule) => rule.isDefault)]
}
