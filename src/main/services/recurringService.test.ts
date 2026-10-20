// Integration test for recurring expense detection on a temporary folder.
import { mkdtemp, rm } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { Transaction } from '@shared/types'
import { createDataRepository, type DataRepository } from '../storage/repository'
import { createRecurringService } from './recurringService'

let root: string
let repository: DataRepository

function tx(id: string, bookingDate: string): Transaction {
  return {
    id,
    accountId: 'BE00000000000001',
    bookingDate,
    amountCents: -1299,
    currency: 'EUR',
    counterpartyName: 'Streamdienst',
    isInternalTransfer: false,
    importedFrom: 'x.csv'
  }
}

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'recurring-'))
  repository = createDataRepository({ root, updatedBy: 'pc-a' })
  await repository.init()
  await repository.saveMonth('2026-01', [tx('a', '2026-01-05')])
  await repository.saveMonth('2026-02', [tx('b', '2026-02-05')])
  await repository.saveMonth('2026-03', [tx('c', '2026-03-05')])
})

afterEach(async () => {
  await rm(root, { recursive: true, force: true })
})

describe('recurring service', () => {
  it('detects an expense that returns over several stored months', async () => {
    const service = createRecurringService({
      getRepository: async () => repository,
      today: () => '2026-03-20'
    })
    const result = await service.get()
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ counterparty: 'Streamdienst', occurrences: 3, active: true })
  })

  it('returns nothing without enough history', async () => {
    const empty = await mkdtemp(join(tmpdir(), 'recurring-empty-'))
    try {
      const fresh = createDataRepository({ root: empty, updatedBy: 'pc-a' })
      await fresh.init()
      const service = createRecurringService({ getRepository: async () => fresh })
      expect(await service.get()).toEqual([])
    } finally {
      await rm(empty, { recursive: true, force: true })
    }
  })
})
