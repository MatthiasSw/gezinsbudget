// Integration test: import a fixture, categorize, and read the overview back.
import { mkdtemp, readFile, rm } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createDataRepository, type DataRepository } from '../storage/repository'
import { createImportService } from './importService'
import { createOverviewService } from './overviewService'
import { createTransactionService } from './transactionService'

let root: string
let repository: DataRepository

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'overview-'))
  repository = createDataRepository({ root, updatedBy: 'pc-a' })
  await repository.init()
  await repository.saveSettings({ accounts: [{ iban: 'BE68539007547034', name: 'Zicht' }] })
  await repository.saveRules([])

  const content = await readFile(join(__dirname, '../../../tests/fixtures/belfius-basic.csv'))
  const importer = createImportService({
    getRepository: async () => repository,
    chooseFile: async () => ({ name: 'belfius-basic.csv', content })
  })
  const picked = await importer.pick()
  if (picked?.kind !== 'preview') throw new Error('Expected a preview')
  await importer.confirm(picked.preview.token)
})

afterEach(async () => {
  await rm(root, { recursive: true, force: true })
})

describe('overview service', () => {
  it('matches the hand-calculated totals of the basic fixture', async () => {
    const overview = await createOverviewService({ getRepository: async () => repository }).get({
      from: '2026-01-01',
      to: '2026-12-31'
    })
    expect(overview.months).toHaveLength(12)
    const expenses = [4530, 840, 1210, 31000, 2500, 12000, 123456]
    expect(expenses.reduce((sum, cents) => sum + cents, 0)).toBe(175536)
    expect(overview.totals).toEqual({
      incomeCents: 234567,
      expenseCents: 175536,
      netCents: 234567 - 175536
    })
    expect(overview.perMonthTotals['2026-01'].netCents).toBe(overview.totals.netCents)
    expect(overview.perMonthTotals['2026-02'].netCents).toBe(0)
  })

  it('lists the years that have transactions, newest first', async () => {
    await repository.saveMonth('2024-05', [
      {
        id: 'old',
        accountId: 'BE68539007547034',
        bookingDate: '2024-05-01',
        amountCents: -100,
        currency: 'EUR',
        isInternalTransfer: false,
        importedFrom: 'x.csv'
      }
    ])
    const service = createOverviewService({ getRepository: async () => repository })
    expect(await service.years()).toEqual([2026, 2024])
  })

  it('moves amounts from the uncategorized row to the chosen category', async () => {
    const getRepository = async (): Promise<DataRepository> => repository
    const overviewService = createOverviewService({ getRepository })
    const request = { from: '2026-01-01', to: '2026-12-31' }

    const before = await overviewService.get(request)
    expect(before.rows).toHaveLength(1)
    expect(before.rows[0].categoryId).toBeNull()

    const groceries = (await repository.getCategories()).find((c) => c.name === 'Boodschappen')!
    const supermarket = (await repository.getTransactions()).find(
      (t) => t.counterpartyName === 'Supermarkt Groenhof'
    )!
    await createTransactionService({ getRepository, saveFile: async () => false }).setCategory({
      refs: [{ id: supermarket.id, bookingDate: supermarket.bookingDate }],
      categoryId: groceries.id
    })

    const after = await overviewService.get(request)
    expect(after.rows.find((r) => r.categoryId === groceries.id)?.totalCents).toBe(-4530)
    expect(after.rows.find((r) => r.categoryId === null)?.totalCents).toBe(
      before.totals.netCents + 4530
    )
    expect(after.totals).toEqual(before.totals)
  })
})
