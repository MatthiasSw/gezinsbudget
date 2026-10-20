// Request and response types of the rule channels.
import type { Transaction } from './types'

export type ReapplyRequest = {
  dryRun: boolean
}

export type ReapplyResult = {
  changedCount: number
}

export type AddDefaultsResult = {
  addedCategoryCount: number
  addedCategoryNames: string[]
  addedRuleCount: number
  updatedRuleCount: number
}

export type RuleTestResult = {
  matchCount: number
  unchangedCount: number
  examples: Transaction[]
}
