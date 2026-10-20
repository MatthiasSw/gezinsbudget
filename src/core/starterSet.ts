// The starter categories with the keywords of their default rules, and the logic to add or refresh what is missing.
import { randomUUID } from 'crypto'
import { defaultCategoryIcons } from '@shared/categoryIcons'
import type { Category, Rule } from '@shared/types'
import { userRulesFirst } from './ruleOrder'
import { expenseCategories, incomeCategories, type StarterCategory } from './starterCategories'

type StarterGroup = {
  kind: Category['kind']
  categories: StarterCategory[]
}

export type StarterResult = {
  categories: Category[]
  rules: Rule[]
  addedCategoryCount: number
  addedCategoryNames: string[]
  addedRuleCount: number
  updatedRuleCount: number
}

const starterGroups: StarterGroup[] = [
  { kind: 'income', categories: incomeCategories },
  { kind: 'expense', categories: expenseCategories }
]

export function completeStarterSet(
  existingCategories: Category[],
  existingRules: Rule[],
  createId: () => string = randomUUID
): StarterResult {
  const categories = [...existingCategories]
  const rules = [...existingRules]
  const addedCategoryNames: string[] = []
  let addedRuleCount = 0
  let updatedRuleCount = 0

  const ensureCategory = (
    name: string,
    kind: Category['kind'],
    parentId: string | undefined
  ): Category => {
    const found = categories.find(
      (category) => category.name.trim().toLowerCase() === name.toLowerCase()
    )
    if (found) return found
    const created: Category = { id: createId(), name, kind, icon: iconFor(name) }
    categories.push(parentId === undefined ? created : { ...created, parentId })
    addedCategoryNames.push(name)
    return categories[categories.length - 1]
  }

  const addRule = (category: Category, keywords: string): void => {
    const byCategory = rules.findIndex((rule) => rule.isDefault && rule.categoryId === category.id)
    if (byCategory >= 0) {
      if (rules[byCategory].value === keywords) return
      rules[byCategory] = {
        ...rules[byCategory],
        field: 'anyText',
        operator: 'regex',
        value: keywords,
        caseSensitive: false
      }
      updatedRuleCount++
      return
    }
    const sameKeywords = rules.findIndex((rule) => rule.value === keywords)
    if (sameKeywords >= 0) {
      rules[sameKeywords] = { ...rules[sameKeywords], isDefault: true }
      return
    }
    rules.push({
      id: createId(),
      field: 'anyText',
      operator: 'regex',
      value: keywords,
      caseSensitive: false,
      categoryId: category.id,
      enabled: true,
      isDefault: true
    })
    addedRuleCount++
  }

  const visit = (node: StarterCategory, kind: Category['kind'], parentId?: string): void => {
    const category = ensureCategory(node.name, kind, parentId)
    if (node.keywords) addRule(category, node.keywords)
    for (const child of node.children ?? []) visit(child, kind, category.id)
  }

  for (const group of starterGroups) {
    for (const node of group.categories) visit(node, group.kind)
  }
  return {
    categories,
    rules: userRulesFirst(rules),
    addedCategoryCount: addedCategoryNames.length,
    addedCategoryNames,
    addedRuleCount,
    updatedRuleCount
  }
}

function iconFor(name: string): string {
  return defaultCategoryIcons[name.toLowerCase()] ?? ''
}
