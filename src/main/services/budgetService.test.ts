// Integration tests for saving and reading budgets on a temporary folder.
import { mkdtemp, rm } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { Budget } from '@shared/types'
import { createDataRepository, type DataRepository } from '../storage/repository'
import { createBudgetService, type BudgetService } from './budgetService'

let root: string
let repository: DataRepository
let service: BudgetService

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'budgets-'))
  repository = createDataRepository({ root, updatedBy: 'pc-a' })
  await repository.init()
  service = createBudgetService({ getRepository: async () => repository })
})

afterEach(async () => {
  await rm(root, { recursive: true, force: true })
})

async function categoryId(name: string): Promise<string> {
  return (await repository.getCategories()).find((category) => category.name === name)!.id
}

describe('budget service', () => {
  it('starts without budgets', async () => {
    expect(await service.get()).toEqual([])
  })

  it('saves and returns budgets, also after reopening the repository', async () => {
    const budgets: Budget[] = [
      { categoryId: await categoryId('Boodschappen'), period: 'month', amountCents: 60000 }
    ]
    await service.save(budgets)

    const reopened = createBudgetService({
      getRepository: async () => createDataRepository({ root, updatedBy: 'pc-b' })
    })
    expect(await reopened.get()).toEqual(budgets)
  })

  it('bumps the data version when saving', async () => {
    const before = (await repository.getDataVersion())?.counter ?? 0
    await service.save([
      { categoryId: await categoryId('Boodschappen'), period: 'year', amountCents: 100000 }
    ])
    expect((await repository.getDataVersion())?.counter).toBeGreaterThan(before)
  })

  it('rejects a budget on an income category', async () => {
    await expect(
      service.save([{ categoryId: await categoryId('Loon'), period: 'month', amountCents: 100 }])
    ).rejects.toMatchObject({ code: 'INVALID_BUDGETS' })
  })

  it('hides budgets whose category was removed', async () => {
    const groceries = await categoryId('Boodschappen')
    await service.save([{ categoryId: groceries, period: 'month', amountCents: 60000 }])
    const categories = await repository.getCategories()
    await repository.saveCategories(categories.filter((category) => category.id !== groceries))
    expect(await service.get()).toEqual([])
  })
})
