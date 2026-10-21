// Tests detection of monthly recurring expenses on fictional transactions.
import { describe, expect, it } from 'vitest'
import type { Transaction } from '@shared/types'
import { detectRecurringSpend } from './recurring'

let counter = 0

function tx(
  bookingDate: string,
  amountCents: number,
  overrides: Partial<Transaction> = {}
): Transaction {
  counter += 1
  return {
    id: `t${counter}`,
    accountId: 'BE00000000000001',
    bookingDate,
    amountCents,
    currency: 'EUR',
    counterpartyName: 'Streamdienst',
    isInternalTransfer: false,
    importedFrom: 'x.csv',
    ...overrides
  }
}

const monthly = (amounts: number[], overrides: Partial<Transaction> = {}): Transaction[] =>
  amounts.map((amount, index) =>
    tx(`2026-${String(index + 1).padStart(2, '0')}-05`, amount, overrides)
  )

describe('detectRecurringSpend', () => {
  it('detects a monthly expense with a stable amount', () => {
    const result = detectRecurringSpend(monthly([-1299, -1299, -1299, -1299]), '2026-04-20')
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      counterparty: 'Streamdienst',
      amountCents: 1299,
      yearlyCents: 15588,
      occurrences: 4,
      firstDate: '2026-01-05',
      lastDate: '2026-04-05',
      active: true
    })
  })

  it('accepts amounts that vary by about ten percent', () => {
    const result = detectRecurringSpend(monthly([-10000, -10800, -9300, -10400]), '2026-04-20')
    expect(result).toHaveLength(1)
    expect(result[0].amountCents).toBe(10200)
  })

  it('ignores amounts that differ too much', () => {
    expect(detectRecurringSpend(monthly([-1000, -2000, -4500, -800]), '2026-04-20')).toEqual([])
  })

  it('needs at least three occurrences', () => {
    expect(detectRecurringSpend(monthly([-1299, -1299]), '2026-03-20')).toEqual([])
  })

  it('ignores payments that are not about a month apart', () => {
    const weekly = [1, 8, 15, 22, 29].map((day) =>
      tx(`2026-03-${String(day).padStart(2, '0')}`, -500)
    )
    expect(detectRecurringSpend(weekly, '2026-04-01')).toEqual([])
  })

  it('tolerates a booking that slips over a weekend', () => {
    const slipped = [
      tx('2026-01-01', -5000),
      tx('2026-02-03', -5000),
      tx('2026-03-02', -5000),
      tx('2026-04-01', -5000)
    ]
    expect(detectRecurringSpend(slipped, '2026-04-10')).toHaveLength(1)
  })

  it('marks an expense that stopped as not active', () => {
    const result = detectRecurringSpend(monthly([-1299, -1299, -1299]), '2026-06-01')
    expect(result[0].active).toBe(false)
  })

  it('drops an expense that stopped more than six months ago', () => {
    expect(detectRecurringSpend(monthly([-1299, -1299, -1299]), '2026-12-01')).toEqual([])
  })

  it('ignores income and internal transfers', () => {
    expect(detectRecurringSpend(monthly([2000, 2000, 2000]), '2026-04-01')).toEqual([])
    expect(
      detectRecurringSpend(monthly([-500, -500, -500], { isInternalTransfer: true }), '2026-04-01')
    ).toEqual([])
  })

  it('groups names regardless of case and accents', () => {
    const mixed = [
      tx('2026-01-05', -999, { counterpartyName: 'Café Zoë' }),
      tx('2026-02-05', -999, { counterpartyName: 'CAFE ZOE' }),
      tx('2026-03-05', -999, { counterpartyName: 'cafe zoe ' })
    ]
    expect(detectRecurringSpend(mixed, '2026-03-20')).toHaveLength(1)
  })

  it('finds a recurring amount next to other payments to the same counterparty', () => {
    const transactions = [
      ...monthly([-2500, -2500, -2500, -2500], { counterpartyName: 'Sportclub' }),
      tx('2026-02-17', -4000, { counterpartyName: 'Sportclub' }),
      tx('2026-03-30', -12000, { counterpartyName: 'Sportclub' })
    ]
    const result = detectRecurringSpend(transactions, '2026-04-20')
    expect(result).toHaveLength(1)
    expect(result[0].amountCents).toBe(2500)
  })

  it('falls back to the counterparty account number and skips transactions without either', () => {
    const byIban = monthly([-700, -700, -700], {
      counterpartyName: undefined,
      counterpartyIban: 'BE00000000000099'
    })
    const anonymous = monthly([-700, -700, -700], { counterpartyName: undefined })
    expect(detectRecurringSpend([...byIban, ...anonymous], '2026-03-20')).toHaveLength(1)
  })

  it('recognises a payment without counterparty by its description, whatever its reference', () => {
    const loan = [1, 2, 3, 4].map((month) =>
      tx(`2026-0${month}-02`, -122832, {
        counterpartyName: undefined,
        description: `BEDRAG VOOR DE AFBETALING VAN UW WOONKREDIET BE34 0753 9970 9590 REF. : 08001413207${month} VAL. 0${month}-01`
      })
    )
    const result = detectRecurringSpend(loan, '2026-04-20')
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      counterparty: 'BEDRAG VOOR DE AFBETALING VAN UW WOONKREDIET',
      amountCents: 122832,
      occurrences: 4
    })
  })

  it('does not join payments without counterparty that have a different description', () => {
    const mixed = [
      tx('2026-01-02', -5000, { counterpartyName: undefined, description: 'GELDOPNEMING' }),
      tx('2026-02-02', -5000, { counterpartyName: undefined, description: 'BETALING ANDERE' }),
      tx('2026-03-02', -5000, { counterpartyName: undefined, description: 'NOG IETS ANDERS' })
    ]
    expect(detectRecurringSpend(mixed, '2026-03-20')).toEqual([])
  })

  it('uses the most common category and sorts by yearly cost', () => {
    const big = monthly([-9000, -9000, -9000], {
      counterpartyName: 'Huisbaas',
      categoryId: 'wonen'
    })
    const small = monthly([-500, -500, -500], { counterpartyName: 'Tijdschrift' })
    const result = detectRecurringSpend([...small, ...big], '2026-03-20')
    expect(result.map((item) => item.counterparty)).toEqual(['Huisbaas', 'Tijdschrift'])
    expect(result[0].categoryId).toBe('wonen')
    expect(result[1].categoryId).toBeUndefined()
  })
})
