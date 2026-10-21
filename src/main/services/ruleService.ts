// Reads and saves rules, applies them to stored transactions and tests a rule against the data.
import type {
  AddDefaultsResult,
  ReapplyRequest,
  ReapplyResult,
  RuleTestResult
} from '@shared/ruleTypes'
import type { Rule } from '@shared/types'
import { createRuleMatcher, withRuleCategories } from '@core/rules'
import { assertValidRules } from '@core/ruleValidation'
import { userRulesFirst } from '@core/ruleOrder'
import { completeStarterSet } from '@core/starterSet'
import type { GetRepository } from '../storage/repository'
import { rewriteMonths } from './monthRewrite'

const exampleLimit = 3

export type RuleService = {
  get(): Promise<Rule[]>
  save(rules: Rule[]): Promise<Rule[]>
  reapply(request: ReapplyRequest): Promise<ReapplyResult>
  test(rule: Rule): Promise<RuleTestResult>
  addDefaults(): Promise<AddDefaultsResult>
}

export type RuleServiceDependencies = {
  getRepository: GetRepository
}

export function createRuleService({ getRepository }: RuleServiceDependencies): RuleService {
  return {
    get: async () => (await getRepository()).getRules(),
    save: async (rules) => {
      const repository = await getRepository()
      assertValidRules(rules, await repository.getCategories())
      const ordered = userRulesFirst(rules)
      await repository.saveRules(ordered)
      return ordered
    },
    reapply: async ({ dryRun }) => {
      const repository = await getRepository()
      const rules = await repository.getRules()
      const changedCount = await rewriteMonths(
        repository,
        await repository.listMonths(),
        (stored) => withRuleCategories(stored, rules),
        { dryRun }
      )
      return { changedCount }
    },
    addDefaults: async () => {
      const repository = await getRepository()
      const starter = completeStarterSet(
        await repository.getCategories(),
        await repository.getRules()
      )
      assertValidRules(starter.rules, starter.categories)
      if (starter.addedCategoryCount > 0) await repository.saveCategories(starter.categories)
      if (starter.addedRuleCount + starter.updatedRuleCount > 0) {
        await repository.saveRules(starter.rules)
      }
      return {
        addedCategoryCount: starter.addedCategoryCount,
        addedCategoryNames: starter.addedCategoryNames,
        addedRuleCount: starter.addedRuleCount,
        updatedRuleCount: starter.updatedRuleCount
      }
    },
    test: async (rule) => {
      const repository = await getRepository()
      assertValidRules([rule], await repository.getCategories())
      const matches = createRuleMatcher(rule)
      const matching = (await repository.getTransactions()).filter(matches)
      const unchanged = matching.filter(
        (transaction) =>
          transaction.categorySource === 'manual' || transaction.categoryId === rule.categoryId
      )
      return {
        matchCount: matching.length,
        unchangedCount: unchanged.length,
        examples: matching.slice(0, exampleLimit)
      }
    }
  }
}
