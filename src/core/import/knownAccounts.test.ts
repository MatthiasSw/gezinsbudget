// Tests the check for unregistered own accounts.
import { describe, expect, it } from 'vitest'
import { assertKnownAccounts } from './knownAccounts'

const rows = [{ accountId: 'BE68539007547034' }, { accountId: 'BE71096123456769' }]

describe('assertKnownAccounts', () => {
  it('accepts rows of registered accounts, ignoring IBAN formatting', () => {
    expect(() =>
      assertKnownAccounts(rows, ['be68 5390 0754 7034', 'BE71 0961 2345 6769'])
    ).not.toThrow()
  })

  it('lists every unknown account once', () => {
    try {
      assertKnownAccounts([...rows, ...rows], ['BE68539007547034'])
      throw new Error('Expected an error')
    } catch (error) {
      expect(error).toMatchObject({
        code: 'IMPORT_UNKNOWN_ACCOUNT',
        details: { ibans: ['BE71096123456769'] }
      })
    }
  })

  it('accepts an empty import', () => {
    expect(() => assertKnownAccounts([], [])).not.toThrow()
  })
})
