// Integration tests for the transaction list and manual categorization on a temporary folder.
import { mkdtemp, rm } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { Transaction } from '@shared/types'
import { createDataRepository, type DataRepository } from '../storage/repository'
import { createTransactionService, type TransactionService } from './transactionService'

let root: string
let repository: DataRepository
let service: TransactionService
let saved: { name: string; content: string }[]
let answerSave: boolean

function tx(id: string, bookingDate: string, overrides: Partial<Transaction> = {}): Transaction {
  return {
    id,
    accountId: 'BE68539007547034',
    bookingDate,
    amountCents: -1000,
    currency: 'EUR',
    counterpartyName: `Naam ${id}`,
    isInternalTransfer: false,
    importedFrom: 'x.csv',
    ...overrides
  }
}

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'transactions-'))
  repository = createDataRepository({ root, updatedBy: 'pc-a' })
  await repository.init()
  await repository.saveMonth('2026-01', [tx('jan1', '2026-01-05'), tx('jan2', '2026-01-20')])
  await repository.saveMonth('2026-02', [tx('feb1', '2026-02-03')])
  saved = []
  answerSave = true
  service = createTransactionService({
    getRepository: async () => repository,
    saveFile: async (name, content) => {
      if (answerSave) saved.push({ name, content })
      return answerSave
    }
  })
})

afterEach(async () => {
  await rm(root, { recursive: true, force: true })
})

const ref = (id: string, bookingDate: string): { id: string; bookingDate: string } => ({
  id,
  bookingDate
})

describe('query', () => {
  it('returns all transactions newest first', async () => {
    const result = await service.query({ internal: 'show' })
    expect(result.map((item) => item.id)).toEqual(['feb1', 'jan2', 'jan1'])
  })

  it('limits to the requested period', async () => {
    const result = await service.query({ internal: 'show', from: '2026-01-10', to: '2026-01-31' })
    expect(result.map((item) => item.id)).toEqual(['jan2'])
  })
})

describe('exportCsv', () => {
  it('saves the filtered transactions as a CSV and reports the row count', async () => {
    const result = await service.exportCsv({
      internal: 'show',
      from: '2026-01-10',
      to: '2026-02-28'
    })
    expect(result).toEqual({ rowCount: 2 })
    expect(saved).toHaveLength(1)
    expect(saved[0].content).toContain('Naam jan2')
    expect(saved[0].content).toContain('Naam feb1')
    expect(saved[0].content).not.toContain('Naam jan1')
  })

  it('suggests a file name with the period', async () => {
    await service.exportCsv({ internal: 'show', from: '2026-01-01', to: '2026-12-31' })
    await service.exportCsv({ internal: 'show' })
    expect(saved.map((file) => file.name)).toEqual([
      'gezinsbudget-transacties-2026-01-01-2026-12-31.csv',
      'gezinsbudget-transacties.csv'
    ])
  })

  it('returns null when the user cancels the save dialog', async () => {
    answerSave = false
    expect(await service.exportCsv({ internal: 'show' })).toBeNull()
  })

  it('uses the account name in the file', async () => {
    await repository.saveSettings({
      accounts: [{ iban: 'BE68539007547034', name: 'Gezinsrekening' }]
    })
    await service.exportCsv({ internal: 'show' })
    expect(saved[0].content).toContain('Gezinsrekening')
  })
})

describe('setCategory', () => {
  async function foodId(): Promise<string> {
    const categories = await repository.getCategories()
    return categories.find((category) => category.name === 'Boodschappen')!.id
  }

  it('assigns a manual category across several months and persists it', async () => {
    const category = await foodId()
    const updated = await service.setCategory({
      refs: [ref('jan1', '2026-01-05'), ref('feb1', '2026-02-03')],
      categoryId: category
    })
    expect(updated).toBe(2)

    const stored = await repository.getTransactions()
    const manual = stored.filter((item) => item.categorySource === 'manual')
    expect(manual.map((item) => item.id).sort()).toEqual(['feb1', 'jan1'])
    expect(manual.every((item) => item.categoryId === category)).toBe(true)
  })

  it('filters on the assigned category', async () => {
    const category = await foodId()
    await service.setCategory({ refs: [ref('jan1', '2026-01-05')], categoryId: category })
    const result = await service.query({ internal: 'show', categoryId: category })
    expect(result.map((item) => item.id)).toEqual(['jan1'])
  })

  it('removes the category again with null', async () => {
    const category = await foodId()
    await service.setCategory({ refs: [ref('jan1', '2026-01-05')], categoryId: category })
    await service.setCategory({ refs: [ref('jan1', '2026-01-05')], categoryId: null })
    const result = await service.query({ internal: 'show', categoryId: 'uncategorized' })
    expect(result).toHaveLength(3)
  })

  it('ignores references to unknown transactions', async () => {
    const updated = await service.setCategory({
      refs: [ref('ghost', '2026-01-05')],
      categoryId: await foodId()
    })
    expect(updated).toBe(0)
  })

  it('rejects an unknown category', async () => {
    await expect(
      service.setCategory({ refs: [ref('jan1', '2026-01-05')], categoryId: 'nope' })
    ).rejects.toMatchObject({ code: 'INVALID_CATEGORIES' })
  })

  it('bumps the data version', async () => {
    const before = (await repository.getDataVersion())?.counter ?? 0
    await service.setCategory({ refs: [ref('jan1', '2026-01-05')], categoryId: await foodId() })
    expect((await repository.getDataVersion())?.counter).toBeGreaterThan(before)
  })

  it('keeps the category after reopening the repository', async () => {
    await service.setCategory({ refs: [ref('jan1', '2026-01-05')], categoryId: await foodId() })
    const reopened = createDataRepository({ root, updatedBy: 'pc-b' })
    const stored = await reopened.getMonth('2026-01')
    expect(stored.find((item) => item.id === 'jan1')?.categorySource).toBe('manual')
  })
})
