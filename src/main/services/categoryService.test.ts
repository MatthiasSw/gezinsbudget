// Integration tests for saving categories, including removing categories that are in use.
import { mkdtemp, rm } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { Category, Rule } from '@shared/types'
import { createDataRepository, type DataRepository } from '../storage/repository'
import { createCategoryService, type CategoryService } from './categoryService'

let root: string
let repository: DataRepository
let service: CategoryService

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'categories-'))
  repository = createDataRepository({ root, updatedBy: 'pc-a' })
  await repository.init()
  service = createCategoryService({ getRepository: async () => repository })
})

afterEach(async () => {
  await rm(root, { recursive: true, force: true })
})

describe('category service', () => {
  it('returns the seeded categories', async () => {
    expect((await service.get()).length).toBeGreaterThan(10)
  })

  it('adds and renames categories', async () => {
    const categories = await service.get()
    const [first, ...rest] = categories
    const next: Category[] = [
      { ...first, name: '  Nieuwe naam  ' },
      ...rest,
      { id: 'new', name: 'Huisdier', kind: 'expense' }
    ]
    const saved = await service.save(next)
    expect(saved[0]).toMatchObject({ name: 'Nieuwe naam' })
    expect((await service.get()).some((category) => category.id === 'new')).toBe(true)
  })

  it('rejects an invalid tree', async () => {
    const categories = await service.get()
    await expect(
      service.save([...categories, { id: 'x', name: 'X', kind: 'expense', parentId: 'ghost' }])
    ).rejects.toMatchObject({ code: 'INVALID_CATEGORIES' })
  })

  it('allows removing an unused category', async () => {
    const categories = await service.get()
    const unused = categories.filter((category) => category.name !== 'Overige uitgaven')
    await expect(service.save(unused)).resolves.toHaveLength(categories.length - 1)
  })

  it('clears a removed category from the transactions that used it', async () => {
    const categories = await service.get()
    const [used, kept] = categories
    const base = {
      accountId: 'BE68539007547034',
      bookingDate: '2026-01-05',
      amountCents: -100,
      currency: 'EUR',
      isInternalTransfer: false,
      importedFrom: 'x.csv'
    }
    await repository.saveMonth('2026-01', [
      { ...base, id: 'a', categoryId: used.id, categorySource: 'manual' },
      { ...base, id: 'b', categoryId: kept.id, categorySource: 'manual' },
      { ...base, id: 'c' }
    ])
    await service.save(categories.slice(1))

    const stored = await repository.getMonth('2026-01')
    expect(stored.find((item) => item.id === 'a')).not.toHaveProperty('categoryId')
    expect(stored.find((item) => item.id === 'a')).not.toHaveProperty('categorySource')
    expect(stored.find((item) => item.id === 'b')?.categoryId).toBe(kept.id)
    expect(await service.get()).toHaveLength(categories.length - 1)
  })

  it('removes the rules of a removed category and keeps the others', async () => {
    const categories = await service.get()
    const rule = (id: string, categoryId: string): Rule => ({
      id,
      field: 'counterpartyName',
      operator: 'contains',
      value: 'x',
      caseSensitive: false,
      categoryId,
      enabled: true
    })
    await repository.saveRules([rule('r1', categories[0].id), rule('r2', categories[1].id)])
    await service.save(categories.slice(1))
    expect((await repository.getRules()).map((item) => item.id)).toEqual(['r2'])
  })
})
