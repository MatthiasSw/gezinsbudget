// Integration tests for saving, testing and re-applying rules against a temporary data folder.
import { mkdtemp, rm } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { Rule, Transaction } from '@shared/types'
import { createDataRepository, type DataRepository } from '../storage/repository'
import { createRuleService, type RuleService } from './ruleService'

let root: string
let repository: DataRepository
let service: RuleService
let groceriesId: string

function transaction(id: string, overrides: Partial<Transaction> = {}): Transaction {
  return {
    id,
    accountId: 'BE68539007547034',
    bookingDate: '2026-01-05',
    amountCents: -1000,
    currency: 'EUR',
    counterpartyName: 'Supermarkt Groenhof',
    isInternalTransfer: false,
    importedFrom: 'x.csv',
    ...overrides
  }
}

function groceriesRule(overrides: Partial<Rule> = {}): Rule {
  return {
    id: 'rule1',
    field: 'counterpartyName',
    operator: 'contains',
    value: 'groenhof',
    caseSensitive: false,
    categoryId: groceriesId,
    enabled: true,
    ...overrides
  }
}

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'rules-'))
  repository = createDataRepository({ root, updatedBy: 'pc-a' })
  await repository.init()
  groceriesId = (await repository.getCategories()).find((c) => c.name === 'Boodschappen')!.id
  service = createRuleService({ getRepository: async () => repository })
})

afterEach(async () => {
  await rm(root, { recursive: true, force: true })
})

describe('saving rules', () => {
  it('stores valid rules', async () => {
    await service.save([groceriesRule()])
    expect(await service.get()).toHaveLength(1)
  })

  it('rejects an invalid regex and keeps the old rules', async () => {
    await service.save([groceriesRule()])
    await expect(
      service.save([groceriesRule({ operator: 'regex', value: '(' })])
    ).rejects.toMatchObject({ code: 'INVALID_RULES' })
    expect((await service.get())[0].operator).toBe('contains')
  })

  it('rejects a rule that points to an unknown category', async () => {
    await expect(service.save([groceriesRule({ categoryId: 'missing' })])).rejects.toMatchObject({
      code: 'INVALID_RULES'
    })
  })
})

describe('testing a rule', () => {
  it('counts the matching transactions and returns examples', async () => {
    await repository.saveMonth('2026-01', [
      transaction('a'),
      transaction('b', { counterpartyName: 'Other' })
    ])
    const result = await service.test(groceriesRule())
    expect(result.matchCount).toBe(1)
    expect(result.unchangedCount).toBe(0)
    expect(result.examples.map((item) => item.id)).toEqual(['a'])
  })

  it('returns at most three examples but counts every match', async () => {
    await repository.saveMonth(
      '2026-01',
      ['a', 'b', 'c', 'd', 'e'].map((id) => transaction(id))
    )
    const result = await service.test(groceriesRule())
    expect(result.matchCount).toBe(5)
    expect(result.examples).toHaveLength(3)
  })

  it('counts matches that already have the category or were set by hand as unchanged', async () => {
    await repository.saveMonth('2026-01', [
      transaction('a'),
      transaction('b', { categoryId: groceriesId, categorySource: 'rule' }),
      transaction('c', { categoryId: 'fun', categorySource: 'manual' })
    ])
    const result = await service.test(groceriesRule())
    expect(result.matchCount).toBe(3)
    expect(result.unchangedCount).toBe(2)
    await service.save([groceriesRule()])
    expect(await service.reapply({ dryRun: true })).toEqual({ changedCount: 1 })
  })

  it('does not change any stored data', async () => {
    await repository.saveMonth('2026-01', [transaction('a')])
    await service.test(groceriesRule())
    expect((await repository.getMonth('2026-01'))[0].categoryId).toBeUndefined()
  })
})

describe('re-applying rules', () => {
  beforeEach(async () => {
    await repository.saveMonth('2026-01', [
      transaction('a'),
      transaction('b', { categoryId: 'fun', categorySource: 'manual' })
    ])
    await repository.saveMonth('2026-02', [transaction('c', { bookingDate: '2026-02-03' })])
    await service.save([groceriesRule()])
  })

  it('reports the number of changes without writing on a dry run', async () => {
    expect(await service.reapply({ dryRun: true })).toEqual({ changedCount: 2 })
    expect((await repository.getMonth('2026-01'))[0].categoryId).toBeUndefined()
  })

  it('categorises matches in every month and keeps manual categories', async () => {
    expect(await service.reapply({ dryRun: false })).toEqual({ changedCount: 2 })
    const january = await repository.getMonth('2026-01')
    expect(january.find((item) => item.id === 'a')).toMatchObject({
      categoryId: groceriesId,
      categorySource: 'rule'
    })
    expect(january.find((item) => item.id === 'b')).toMatchObject({
      categoryId: 'fun',
      categorySource: 'manual'
    })
    expect((await repository.getMonth('2026-02'))[0].categoryId).toBe(groceriesId)
  })

  it('reports nothing to change when applied twice', async () => {
    await service.reapply({ dryRun: false })
    expect(await service.reapply({ dryRun: true })).toEqual({ changedCount: 0 })
  })

  it('removes the rule category once the rule is gone', async () => {
    await service.reapply({ dryRun: false })
    await service.save([])
    expect(await service.reapply({ dryRun: false })).toEqual({ changedCount: 2 })
    const january = await repository.getMonth('2026-01')
    expect(january.find((item) => item.id === 'a')?.categoryId).toBeUndefined()
    expect(january.find((item) => item.id === 'b')?.categoryId).toBe('fun')
  })
})

describe('saving rules', () => {
  it('puts the rules of the user ahead of the default rules', async () => {
    const saved = await service.save([
      groceriesRule({ id: 'd1', isDefault: true }),
      groceriesRule({ id: 'u1', value: 'eigen' })
    ])
    expect(saved.map((rule) => rule.id)).toEqual(['u1', 'd1'])
    expect((await service.get()).map((rule) => rule.id)).toEqual(['u1', 'd1'])
  })
})

describe('adding the default rules', () => {
  it('adds nothing to a new data folder, which already has them', async () => {
    expect(await service.addDefaults()).toEqual({
      addedCategoryCount: 0,
      addedCategoryNames: [],
      addedRuleCount: 0,
      updatedRuleCount: 0
    })
  })

  it('adds the default rules after the rules were removed and keeps own rules', async () => {
    await service.save([groceriesRule({ id: 'own', value: 'eigen regel' })])
    const result = await service.addDefaults()
    expect(result.addedCategoryCount).toBe(0)
    expect(result.addedRuleCount).toBeGreaterThan(10)
    const rules = await service.get()
    expect(rules[0].id).toBe('own')
    expect(rules).toHaveLength(result.addedRuleCount + 1)
  })

  it('refreshes an outdated default rule', async () => {
    const rules = await service.get()
    await service.save([{ ...rules[0], value: 'verouderd' }, ...rules.slice(1)])
    const result = await service.addDefaults()
    expect(result).toEqual({
      addedCategoryCount: 0,
      addedCategoryNames: [],
      addedRuleCount: 0,
      updatedRuleCount: 1
    })
    expect((await service.get())[0].value).toBe(rules[0].value)
  })

  it('creates a missing category together with its rule', async () => {
    const categories = await repository.getCategories()
    await repository.saveCategories(categories.filter((category) => category.name !== 'Afval'))
    await repository.saveRules([])

    const result = await service.addDefaults()

    expect(result.addedCategoryCount).toBe(1)
    expect(result.addedCategoryNames).toEqual(['Afval'])
    const created = (await repository.getCategories()).find((category) => category.name === 'Afval')
    const rules = await service.get()
    expect(rules.some((rule) => rule.categoryId === created?.id)).toBe(true)
  })

  it('does nothing in the data when called a second time', async () => {
    await service.save([])
    await service.addDefaults()
    expect(await service.addDefaults()).toEqual({
      addedCategoryCount: 0,
      addedCategoryNames: [],
      addedRuleCount: 0,
      updatedRuleCount: 0
    })
  })
})
