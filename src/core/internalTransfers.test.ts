// Tests detection of transfers between own accounts.
import { describe, expect, it } from 'vitest'
import { isInternalTransfer, markInternalTransfers } from './internalTransfers'

const ownIbans = ['BE68 5390 0754 7034', 'BE71 0961 2345 6769']

describe('isInternalTransfer', () => {
  it('is true when the counterparty is another own account', () => {
    expect(
      isInternalTransfer(
        { accountId: 'BE68539007547034', counterpartyIban: 'BE71096123456769' },
        ownIbans
      )
    ).toBe(true)
  })

  it('ignores IBAN formatting differences', () => {
    expect(
      isInternalTransfer(
        { accountId: 'BE68539007547034', counterpartyIban: 'be71 0961 2345 6769' },
        ownIbans
      )
    ).toBe(true)
  })

  it('is false for an external counterparty', () => {
    expect(
      isInternalTransfer(
        { accountId: 'BE68539007547034', counterpartyIban: 'BE62510007547061' },
        ownIbans
      )
    ).toBe(false)
  })

  it('is false without a counterparty IBAN', () => {
    expect(isInternalTransfer({ accountId: 'BE68539007547034' }, ownIbans)).toBe(false)
  })

  it('is false when the counterparty is the account itself', () => {
    expect(
      isInternalTransfer(
        { accountId: 'BE68539007547034', counterpartyIban: 'BE68539007547034' },
        ownIbans
      )
    ).toBe(false)
  })
})

describe('markInternalTransfers', () => {
  it('marks both sides of a transfer and nothing else', () => {
    const marked = markInternalTransfers(
      [
        {
          accountId: 'BE68539007547034',
          counterpartyIban: 'BE71096123456769',
          isInternalTransfer: false
        },
        {
          accountId: 'BE71096123456769',
          counterpartyIban: 'BE68539007547034',
          isInternalTransfer: false
        },
        {
          accountId: 'BE68539007547034',
          counterpartyIban: 'BE62510007547061',
          isInternalTransfer: false
        }
      ],
      ownIbans
    )
    expect(marked.map((item) => item.isInternalTransfer)).toEqual([true, true, false])
  })

  it('clears the flag when an account is no longer registered as own', () => {
    const marked = markInternalTransfers(
      [
        {
          accountId: 'BE68539007547034',
          counterpartyIban: 'BE71096123456769',
          isInternalTransfer: true
        }
      ],
      ['BE68 5390 0754 7034']
    )
    expect(marked[0].isInternalTransfer).toBe(false)
  })

  it('does not mutate its input', () => {
    const input = [
      {
        accountId: 'BE68539007547034',
        counterpartyIban: 'BE71096123456769',
        isInternalTransfer: false
      }
    ]
    markInternalTransfers(input, ownIbans)
    expect(input[0].isInternalTransfer).toBe(false)
  })
})
