// Integration test for insights over stored months, including the comparison with last year.
import { mkdtemp, rm } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { Transaction } from '@shared/types'
import { createDataRepository, type DataRepository } from '../storage/repository'
import { createInsightsService } from './insightsService'

let root: string
let repository: DataRepository

function tx(
  id: string,
  bookingDate: string,
  amountCents: number,
  categoryId?: string
): Transaction {
  return {
    id,
    accountId: 'BE00000000000001',
    bookingDate,
    amountCents,
    currency: 'EUR',
    counterpartyName: 'Winkel',
    categoryId,
    isInternalTransfer: false,
    importedFrom: 'x.csv'
  }
}

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'insights-'))
  repository = createDataRepository({ root, updatedBy: 'pc-a' })
  await repository.init()
})

afterEach(async () => {
  await rm(root, { recursive: true, force: true })
})

describe('insights service', () => {
  it('compares the period with the same period a year earlier', async () => {
    const category = (await repository.getCategories()).find(
      (item) => item.name === 'Boodschappen'
    )!
    await repository.saveMonth('2025-02', [tx('a', '2025-02-05', -10000, category.id)])
    await repository.saveMonth('2026-02', [tx('b', '2026-02-05', -25000, category.id)])
    const service = createInsightsService({
      getRepository: async () => repository,
      today: () => '2026-06-15'
    })

    const insights = await service.get({ from: '2026-01-01', to: '2026-12-31' })
    expect(insights.hasPreviousPeriod).toBe(true)
    expect(insights.risers).toEqual([
      { categoryId: category.id, currentCents: 25000, previousCents: 10000, changeCents: 15000 }
    ])
    expect(insights.topExpenses[0]).toMatchObject({ id: 'b', amountCents: 25000 })
  })

  it('stops at today so a running year is compared fairly', async () => {
    await repository.saveMonth('2025-02', [tx('a', '2025-02-05', -10000)])
    await repository.saveMonth('2025-11', [tx('c', '2025-11-05', -90000)])
    await repository.saveMonth('2026-02', [tx('b', '2026-02-05', -10000)])
    const service = createInsightsService({
      getRepository: async () => repository,
      today: () => '2026-06-15'
    })

    const insights = await service.get({ from: '2026-01-01', to: '2026-12-31' })
    expect(insights.facts).toContainEqual({ kind: 'averagePerMonth', cents: 1667, months: 6 })
  })

  it('returns an empty result for a year without data', async () => {
    const service = createInsightsService({ getRepository: async () => repository })
    const insights = await service.get({ from: '2020-01-01', to: '2020-12-31' })
    expect(insights.facts).toEqual([])
    expect(insights.topExpenses).toEqual([])
  })
})
