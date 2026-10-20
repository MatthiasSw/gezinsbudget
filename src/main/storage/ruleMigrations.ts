// Migrates stored rules: flags the old default rules and puts the user's own rules first.
import type { Rule } from '@shared/types'
import { userRulesFirst } from '@core/ruleOrder'
import type { MigrationRegistry } from './migrations'
import { legacyStarterKeywords } from './legacyStarterKeywords'

function flagLegacyDefaults(data: unknown): Rule[] {
  const known = new Set(legacyStarterKeywords)
  const rules = (data as Rule[]).map((rule) =>
    rule.field === 'anyText' && rule.operator === 'regex' && known.has(rule.value)
      ? { ...rule, isDefault: true }
      : rule
  )
  return userRulesFirst(rules)
}

export const storageMigrations: MigrationRegistry = {
  rules: { 1: flagLegacyDefaults }
}
