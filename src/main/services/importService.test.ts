// Integration tests for the import flow against a real temporary data folder.
import { mkdtemp, readdir, readFile, rm } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { ImportPickResult, ImportPreview } from '@shared/importTypes'
import { createDataRepository, type DataRepository } from '../storage/repository'
import { createImportService, type ImportService, type PickedFile } from './importService'

const fixturesDir = join(__dirname, '../../../tests/fixtures')
const accountA = { iban: 'BE68 5390 0754 7034', name: 'Zichtrekening' }
const accountB = { iban: 'BE71 0961 2345 6769', name: 'Spaarrekening' }

let root: string
let repository: DataRepository
let nextFile: PickedFile | null

async function fixture(name: string): Promise<PickedFile> {
  return { name, content: await readFile(join(fixturesDir, name)) }
}

function buildService(target: DataRepository = repository): ImportService {
  return createImportService({
    getRepository: async () => target,
    chooseFile: async () => nextFile
  })
}

async function pickPreview(service: ImportService, name: string): Promise<ImportPreview> {
  nextFile = await fixture(name)
  const result = (await service.pick()) as ImportPickResult
  if (result.kind !== 'preview') throw new Error('Expected a preview')
  return result.preview
}

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'import-'))
  repository = createDataRepository({ root, updatedBy: 'pc-a' })
  await repository.init()
  await repository.saveSettings({ accounts: [accountA] })
  nextFile = null
})

afterEach(async () => {
  await rm(root, { recursive: true, force: true })
})

describe('first import', () => {
  it('previews the file without writing any transactions', async () => {
    const preview = await pickPreview(buildService(), 'belfius-basic.csv')
    expect(preview).toMatchObject({
      fileName: 'belfius-basic.csv',
      profileLabel: 'Belfius',
      encoding: 'windows-1252',
      accounts: ['BE68539007547034'],
      periodFrom: '2026-01-02',
      periodTo: '2026-01-28',
      newCount: 8,
      duplicateCount: 0
    })
    expect(preview.previewRows).toHaveLength(8)
    expect(await repository.listMonths()).toEqual([])
  })

  it('sums income and expenses of the new rows in cents', async () => {
    const preview = await pickPreview(buildService(), 'belfius-basic.csv')
    expect(preview.incomeCents).toBe(234567)
    expect(preview.expenseCents).toBe(4530 + 840 + 1210 + 31000 + 2500 + 12000 + 123456)
  })

  it('stores the transactions and a byte-exact copy of the original', async () => {
    const service = buildService()
    const preview = await pickPreview(service, 'belfius-basic.csv')
    const result = await service.confirm(preview.token)

    expect(result).toEqual({ addedCount: 8, duplicateCount: 0, months: ['2026-01'] })
    expect(await repository.getTransactions()).toHaveLength(8)

    const stored = await readdir(join(root, 'imports'))
    expect(stored).toHaveLength(1)
    expect(await readFile(join(root, 'imports', stored[0]))).toEqual(
      (await fixture('belfius-basic.csv')).content
    )
    const transactions = await repository.getTransactions()
    expect(transactions.every((transaction) => transaction.importedFrom === stored[0])).toBe(true)
  })

  it('bumps the data version so readers notice the change', async () => {
    const before = (await repository.getDataVersion())?.counter ?? 0
    const service = buildService()
    await service.confirm((await pickPreview(service, 'belfius-basic.csv')).token)
    expect((await repository.getDataVersion())?.counter).toBeGreaterThan(before)
  })

  it('does nothing when the dialog is cancelled', async () => {
    nextFile = null
    expect(await buildService().pick()).toBeNull()
  })
})

describe('importing the same data again', () => {
  it('finds only duplicates when the same file is imported twice', async () => {
    const service = buildService()
    await service.confirm((await pickPreview(service, 'belfius-basic.csv')).token)

    const second = await pickPreview(service, 'belfius-basic.csv')
    expect(second).toMatchObject({ newCount: 0, duplicateCount: 8 })

    const result = await service.confirm(second.token)
    expect(result).toEqual({ addedCount: 0, duplicateCount: 8, months: [] })
    expect(await repository.getTransactions()).toHaveLength(8)
    expect(await readdir(join(root, 'imports'))).toHaveLength(1)
  })

  it('treats the UTF-8 version of the same export as duplicates', async () => {
    const service = buildService()
    await service.confirm((await pickPreview(service, 'belfius-basic.csv')).token)
    const second = await pickPreview(service, 'belfius-utf8.csv')
    expect(second).toMatchObject({ newCount: 0, duplicateCount: 8 })
  })

  it('keeps two identical rows on one day and does not duplicate them on re-import', async () => {
    const service = buildService()
    const first = await pickPreview(service, 'belfius-duplicates.csv')
    expect(first.newCount).toBe(3)
    await service.confirm(first.token)

    const second = await pickPreview(service, 'belfius-duplicates.csv')
    expect(second).toMatchObject({ newCount: 0, duplicateCount: 3 })
    expect(await repository.getTransactions()).toHaveLength(3)
  })

  it('only adds the rows outside the overlap of two exports', async () => {
    const service = buildService()
    await service.confirm((await pickPreview(service, 'belfius-overlap-a.csv')).token)

    const second = await pickPreview(service, 'belfius-overlap-b.csv')
    expect(second).toMatchObject({ newCount: 2, duplicateCount: 3 })
    await service.confirm(second.token)
    expect(await repository.getTransactions()).toHaveLength(6)
  })

  it('never overwrites a manual category when the file is imported again', async () => {
    const service = buildService()
    await service.confirm((await pickPreview(service, 'belfius-basic.csv')).token)

    const [first, ...rest] = await repository.getMonth('2026-01')
    await repository.saveMonth('2026-01', [
      { ...first, categoryId: 'groceries', categorySource: 'manual' },
      ...rest
    ])

    const again = await pickPreview(service, 'belfius-basic.csv')
    await service.confirm(again.token)
    const stored = await repository.getMonth('2026-01')
    expect(stored.filter((t) => t.categorySource === 'manual')).toHaveLength(1)
    expect(stored).toHaveLength(8)
  })
})

describe('categorisation rules', () => {
  it('categorises new transactions with the saved rules', async () => {
    const category = (await repository.getCategories()).find((c) => c.name === 'Boodschappen')!
    await repository.saveRules([
      {
        id: 'r1',
        field: 'counterpartyName',
        operator: 'contains',
        value: 'groenhof',
        caseSensitive: false,
        categoryId: category.id,
        enabled: true
      }
    ])
    const service = buildService()
    await service.confirm((await pickPreview(service, 'belfius-basic.csv')).token)

    const stored = await repository.getMonth('2026-01')
    const categorised = stored.filter((t) => t.categorySource === 'rule')
    expect(categorised).toHaveLength(1)
    expect(categorised[0]).toMatchObject({
      counterpartyName: 'Supermarkt Groenhof',
      categoryId: category.id
    })
  })
})

describe('accounts', () => {
  it('asks for unknown accounts instead of importing', async () => {
    await repository.saveSettings({ accounts: [] })
    const service = buildService()
    nextFile = await fixture('belfius-basic.csv')
    const result = await service.pick()
    expect(result).toMatchObject({ kind: 'unknownAccounts', ibans: ['BE68539007547034'] })
    expect(await repository.listMonths()).toEqual([])
  })

  it('continues the same import after the account was added', async () => {
    await repository.saveSettings({ accounts: [] })
    const service = buildService()
    nextFile = await fixture('belfius-basic.csv')
    const unknown = (await service.pick()) as Extract<ImportPickResult, { kind: 'unknownAccounts' }>

    await repository.saveSettings({ accounts: [accountA] })
    const resumed = await service.resume(unknown.token)
    expect(resumed).toMatchObject({ kind: 'preview', preview: { newCount: 8 } })
  })

  it('refuses to confirm while an account is still unknown', async () => {
    await repository.saveSettings({ accounts: [] })
    const service = buildService()
    nextFile = await fixture('belfius-basic.csv')
    const unknown = (await service.pick()) as Extract<ImportPickResult, { kind: 'unknownAccounts' }>
    await expect(service.confirm(unknown.token)).rejects.toMatchObject({
      code: 'IMPORT_UNKNOWN_ACCOUNT'
    })
  })

  it('marks transfers between own accounts as internal and leaves them out of the sums', async () => {
    await repository.saveSettings({ accounts: [accountA, accountB] })
    const service = buildService()
    const preview = await pickPreview(service, 'belfius-two-accounts.csv')
    expect(preview.newCount).toBe(3)
    expect(preview.incomeCents).toBe(0)
    expect(preview.expenseCents).toBe(4530)

    await service.confirm(preview.token)
    const internal = (await repository.getTransactions()).filter((t) => t.isInternalTransfer)
    expect(internal).toHaveLength(2)
  })
})

describe('rejected input', () => {
  it('rejects an unknown format without storing anything', async () => {
    const service = buildService()
    nextFile = await fixture('belfius-unknown-format.csv')
    await expect(service.pick()).rejects.toMatchObject({ code: 'IMPORT_FORMAT_UNKNOWN' })
    expect(await repository.listMonths()).toEqual([])
  })

  it('rejects a file with a missing column', async () => {
    const service = buildService()
    nextFile = await fixture('belfius-missing-column.csv')
    await expect(service.pick()).rejects.toMatchObject({ code: 'IMPORT_MISSING_COLUMNS' })
  })

  it('forgets a cancelled import', async () => {
    const service = buildService()
    const preview = await pickPreview(service, 'belfius-basic.csv')
    service.cancel(preview.token)
    await expect(service.confirm(preview.token)).rejects.toBeDefined()
    expect(await repository.listMonths()).toEqual([])
  })
})

describe('interrupted import', () => {
  async function twoMonthFile(): Promise<PickedFile> {
    const { content } = await fixture('belfius-basic.csv')
    const text = Buffer.from(content).toString('latin1')
    const shifted = text.replace(/\/01\/2026/g, (match, offset: number) =>
      offset % 2 === 0 ? '/02/2026' : match
    )
    return { name: 'two-months.csv', content: Buffer.from(shifted, 'latin1') }
  }

  function failingOnSecondMonth(): DataRepository {
    let writes = 0
    return {
      ...repository,
      saveMonth: async (key, transactions) => {
        if (++writes === 2) throw new Error('disk full')
        return repository.saveMonth(key, transactions)
      }
    }
  }

  it('reports an incomplete import and completes it on the next attempt', async () => {
    nextFile = await twoMonthFile()
    const preview = (await buildService().pick()) as Extract<ImportPickResult, { kind: 'preview' }>
    const total = preview.preview.newCount
    expect(total).toBe(8)

    const broken = buildService(failingOnSecondMonth())
    nextFile = await twoMonthFile()
    const brokenPreview = (await broken.pick()) as Extract<ImportPickResult, { kind: 'preview' }>
    await expect(broken.confirm(brokenPreview.preview.token)).rejects.toMatchObject({
      code: 'WRITE_FAILED',
      details: { incompleteImport: true }
    })
    const afterFailure = (await repository.getTransactions()).length
    expect(afterFailure).toBeGreaterThan(0)
    expect(afterFailure).toBeLessThan(total)

    const retry = buildService()
    nextFile = await twoMonthFile()
    const retryPreview = (await retry.pick()) as Extract<ImportPickResult, { kind: 'preview' }>
    expect(retryPreview.preview.newCount).toBe(total - afterFailure)
    await retry.confirm(retryPreview.preview.token)
    expect(await repository.getTransactions()).toHaveLength(total)
  })
})
