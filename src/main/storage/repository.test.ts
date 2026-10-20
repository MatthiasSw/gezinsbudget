// Tests the data repository against a real temporary folder.
import { mkdtemp, readdir, readFile, rename, rm, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { Transaction } from '@shared/types'
import { createDataRepository } from './repository'

let root: string
const fixedNow = (): Date => new Date('2026-01-05T10:00:00.000Z')

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'repository-'))
})

afterEach(async () => {
  await rm(root, { recursive: true, force: true })
})

function openWritable(): ReturnType<typeof createDataRepository> {
  return createDataRepository({ root, updatedBy: 'pc-a', now: fixedNow })
}

function buildTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'a',
    accountId: 'BE00000000000000',
    bookingDate: '2026-01-10',
    amountCents: -1250,
    currency: 'EUR',
    isInternalTransfer: false,
    importedFrom: 'test.csv',
    ...overrides
  }
}

describe('init', () => {
  it('creates the folder structure on an empty folder', async () => {
    await openWritable().init()
    expect((await readdir(root)).sort()).toEqual([
      'categories.json',
      'data-version.json',
      'imports',
      'rules.json',
      'settings.json',
      'transactions'
    ])
  })

  it('seeds the categories only once', async () => {
    const repository = openWritable()
    await repository.init()
    const seeded = await repository.getCategories()
    expect(seeded.length).toBeGreaterThan(10)

    await repository.saveCategories([])
    await repository.init()
    expect(await repository.getCategories()).toEqual([])
  })

  it('does not bump the data version when nothing was created', async () => {
    const repository = openWritable()
    await repository.init()
    const before = await repository.getDataVersion()
    await repository.init()
    expect(await repository.getDataVersion()).toEqual(before)
  })

  it('reports an unavailable folder instead of creating it', async () => {
    const missing = createDataRepository({
      root: join(root, 'missing'),
      updatedBy: 'pc-a'
    })
    await expect(missing.init()).rejects.toMatchObject({ code: 'DATA_DIR_UNAVAILABLE' })
    expect(await readdir(root)).toEqual([])
  })
})

describe('settings, categories and rules', () => {
  it('returns empty defaults before anything is saved', async () => {
    const repository = openWritable()
    expect(await repository.getSettings()).toEqual({ accounts: [] })
    expect(await repository.getCategories()).toEqual([])
    expect(await repository.getRules()).toEqual([])
  })

  it('roundtrips settings', async () => {
    const repository = openWritable()
    const settings = { accounts: [{ iban: 'BE00000000000000', name: 'Zichtrekening' }] }
    await repository.saveSettings(settings)
    expect(await repository.getSettings()).toEqual(settings)
  })

  it('bumps the data version on every write', async () => {
    const repository = openWritable()
    await repository.saveSettings({ accounts: [] })
    await repository.saveRules([])
    expect(await repository.getDataVersion()).toMatchObject({ counter: 2, updatedBy: 'pc-a' })
  })
})

describe('transactions', () => {
  it('stores one file per month sorted by date and id', async () => {
    const repository = openWritable()
    await repository.saveMonth('2026-01', [
      buildTransaction({ id: 'b', bookingDate: '2026-01-10' }),
      buildTransaction({ id: 'a', bookingDate: '2026-01-10' }),
      buildTransaction({ id: 'c', bookingDate: '2026-01-02' })
    ])
    const stored = await repository.getMonth('2026-01')
    expect(stored.map((transaction) => transaction.id)).toEqual(['c', 'a', 'b'])
  })

  it('lists months in order', async () => {
    const repository = openWritable()
    await repository.saveMonth('2026-02', [buildTransaction({ bookingDate: '2026-02-01' })])
    await repository.saveMonth('2026-01', [buildTransaction({ bookingDate: '2026-01-01' })])
    expect(await repository.listMonths()).toEqual(['2026-01', '2026-02'])
  })

  it('filters transactions by date range across months', async () => {
    const repository = openWritable()
    await repository.saveMonth('2026-01', [
      buildTransaction({ id: 'jan-early', bookingDate: '2026-01-05' }),
      buildTransaction({ id: 'jan-late', bookingDate: '2026-01-28' })
    ])
    await repository.saveMonth('2026-02', [
      buildTransaction({ id: 'feb-early', bookingDate: '2026-02-03' }),
      buildTransaction({ id: 'feb-late', bookingDate: '2026-02-20' })
    ])
    const found = await repository.getTransactions({ from: '2026-01-20', to: '2026-02-10' })
    expect(found.map((transaction) => transaction.id)).toEqual(['jan-late', 'feb-early'])
  })

  it('ignores conflict copies and temporary files but reports them', async () => {
    const repository = openWritable()
    await repository.saveMonth('2026-01', [buildTransaction()])
    const folder = join(root, 'transactions')
    await writeFile(join(folder, '2026-01 (Conflict 2026-01-06).json'), '{}')
    await writeFile(join(folder, '.2026-01.json.1.abcd.tmp'), '{}')

    expect(await repository.listMonths()).toEqual(['2026-01'])
    expect(await repository.listUnrecognizedTransactionFiles()).toEqual([
      '2026-01 (Conflict 2026-01-06).json'
    ])
  })

  it('rejects an invalid month key', async () => {
    await expect(openWritable().saveMonth('../escape', [])).rejects.toBeDefined()
  })
})

describe('availability', () => {
  it('reports the folder as unavailable when it disappears while running', async () => {
    const repository = openWritable()
    await repository.init()
    const moved = `${root}-moved`
    await rename(root, moved)
    try {
      await expect(repository.getSettings()).rejects.toMatchObject({
        code: 'DATA_DIR_UNAVAILABLE'
      })
      await expect(repository.saveSettings({ accounts: [] })).rejects.toMatchObject({
        code: 'DATA_DIR_UNAVAILABLE'
      })
    } finally {
      await rename(moved, root)
    }
  })

  it('refuses newer schema versions without touching the file', async () => {
    const repository = openWritable()
    await repository.init()
    const path = join(root, 'settings.json')
    const original = JSON.stringify({ schemaVersion: 2, data: { accounts: [] } })
    await writeFile(path, original)

    await expect(repository.getSettings()).rejects.toMatchObject({ code: 'UNSUPPORTED_SCHEMA' })
    await expect(repository.saveSettings({ accounts: [] })).rejects.toMatchObject({
      code: 'UNSUPPORTED_SCHEMA'
    })
    expect(await readFile(path, 'utf-8')).toBe(original)
  })

  it('reports a corrupt file', async () => {
    const repository = openWritable()
    await repository.init()
    await writeFile(join(root, 'rules.json'), '{ broken')
    await expect(repository.getRules()).rejects.toMatchObject({ code: 'CORRUPT_FILE' })
  })
})

describe('import files', () => {
  it('stores an import file inside the data folder', async () => {
    const repository = openWritable()
    await repository.init()
    const name = await repository.storeImportFile('export.csv', Buffer.from('a;b'))
    expect(await readdir(join(root, 'imports'))).toEqual([name])
  })
})
