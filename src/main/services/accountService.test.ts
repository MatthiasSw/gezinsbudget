// Tests account cleaning, IBAN validation and recomputing internal transfers on change.
import { mkdtemp, rm } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { Transaction } from '@shared/types'
import { createDataRepository, type DataRepository } from '../storage/repository'
import { createAccountService, type AccountService } from './accountService'

const ibanA = 'BE68539007547034'
const ibanB = 'BE71096123456769'

let root: string
let repository: DataRepository
let service: AccountService

function transaction(id: string, overrides: Partial<Transaction> = {}): Transaction {
  return {
    id,
    accountId: ibanA,
    bookingDate: '2026-01-05',
    amountCents: -5000,
    currency: 'EUR',
    isInternalTransfer: false,
    importedFrom: 'x.csv',
    ...overrides
  }
}

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'accounts-'))
  repository = createDataRepository({ root, updatedBy: 'pc-a' })
  await repository.init()
  service = createAccountService({ getRepository: async () => repository })
})

afterEach(async () => {
  await rm(root, { recursive: true, force: true })
})

describe('saving accounts', () => {
  it('starts without accounts', async () => {
    expect(await service.get()).toEqual({ accounts: [] })
  })

  it('normalizes IBANs and trims names', async () => {
    const { settings } = await service.save([{ iban: 'be68 5390 0754 7034', name: '  Zicht  ' }])
    expect(settings.accounts).toEqual([{ iban: ibanA, name: 'Zicht' }])
    expect(await service.get()).toEqual(settings)
  })

  it('drops empty and duplicate IBANs', async () => {
    const { settings } = await service.save([
      { iban: 'BE68 5390 0754 7034', name: 'A' },
      { iban: 'be68539007547034', name: 'B' },
      { iban: '  ', name: 'C' }
    ])
    expect(settings.accounts).toEqual([{ iban: ibanA, name: 'A' }])
  })

  it('rejects an IBAN with a wrong check digit', async () => {
    await expect(service.save([{ iban: 'BE69 5390 0754 7034', name: 'A' }])).rejects.toMatchObject({
      code: 'INVALID_ACCOUNTS'
    })
    expect(await service.get()).toEqual({ accounts: [] })
  })

  it('rejects an account without a name', async () => {
    await expect(service.save([{ iban: ibanA, name: ' ' }])).rejects.toMatchObject({
      code: 'INVALID_ACCOUNTS'
    })
  })
})

describe('recomputing internal transfers', () => {
  beforeEach(async () => {
    await repository.saveMonth('2026-01', [
      transaction('out', { counterpartyIban: ibanB }),
      transaction('in', { accountId: ibanB, counterpartyIban: ibanA, amountCents: 5000 }),
      transaction('shop', { counterpartyIban: 'BE62510007547061' })
    ])
  })

  it('marks both sides once the second account is added', async () => {
    const result = await service.save([
      { iban: ibanA, name: 'Zicht' },
      { iban: ibanB, name: 'Spaar' }
    ])
    const stored = await repository.getMonth('2026-01')
    expect(result.changedTransactions).toBe(2)
    const internalIds = stored.filter((item) => item.isInternalTransfer).map((item) => item.id)
    expect(internalIds.sort()).toEqual(['in', 'out'])
  })

  it('nets the internal transfer pair to zero', async () => {
    await service.save([
      { iban: ibanA, name: 'Zicht' },
      { iban: ibanB, name: 'Spaar' }
    ])
    const internal = (await repository.getMonth('2026-01')).filter(
      (item) => item.isInternalTransfer
    )
    expect(internal.reduce((total, item) => total + item.amountCents, 0)).toBe(0)
  })

  it('unmarks transfers again when an account is removed', async () => {
    await service.save([
      { iban: ibanA, name: 'Zicht' },
      { iban: ibanB, name: 'Spaar' }
    ])
    const result = await service.save([{ iban: ibanA, name: 'Zicht' }])
    expect(result.changedTransactions).toBe(1)
    const stored = await repository.getMonth('2026-01')
    expect(stored.find((item) => item.id === 'out')?.isInternalTransfer).toBe(false)
  })

  it('reports no changes when nothing differs', async () => {
    const accounts = [
      { iban: ibanA, name: 'Zicht' },
      { iban: ibanB, name: 'Spaar' }
    ]
    await service.save(accounts)
    expect((await service.save(accounts)).changedTransactions).toBe(0)
  })
})
