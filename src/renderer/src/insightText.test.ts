// Tests the Dutch sentences generated for each kind of insight fact.
import { describe, expect, it } from 'vitest'
import type { InsightFact } from '@shared/insightTypes'
import type { Category } from '@shared/types'
import { describeFact } from './insightText'

const categories: Category[] = [{ id: 'food', name: 'Boodschappen', kind: 'expense', icon: '' }]

function sentence(fact: InsightFact): string {
  return describeFact(fact, categories).replace(/[^\S ]/g, ' ')
}

describe('describeFact', () => {
  it('describes the average per month', () => {
    expect(sentence({ kind: 'averagePerMonth', cents: 123456, months: 6 })).toBe(
      'Je gaf gemiddeld 1.234,56 € per maand uit, gerekend over 6 maanden.'
    )
    expect(sentence({ kind: 'averagePerMonth', cents: 1000, months: 1 })).toContain('over 1 maand.')
  })

  it('describes the priciest and cheapest month', () => {
    expect(sentence({ kind: 'priciestMonth', month: '2026-03', cents: 250000 })).toBe(
      'mrt 2026 was je duurste maand: je gaf toen 2.500,00 € uit.'
    )
    expect(sentence({ kind: 'cheapestMonth', month: '2026-01', cents: 90000 })).toContain(
      'voordeligste maand'
    )
  })

  it('names the biggest category with its share', () => {
    expect(
      sentence({ kind: 'biggestCategory', categoryId: 'food', cents: 50000, percent: 31 })
    ).toBe('De meeste uitgaven gingen naar Boodschappen: 500,00 €, ofwel 31% van al je uitgaven.')
  })

  it('describes the most visited counterparty and the busiest weekday', () => {
    expect(
      sentence({ kind: 'mostVisitedCounterparty', name: 'Bakker', count: 12, totalCents: 4500 })
    ).toBe('Je betaalde 12 keer aan Bakker, samen 45,00 €.')
    expect(sentence({ kind: 'busiestWeekday', weekday: 5, cents: 10000 })).toBe(
      'Op vrijdag geef je het meeste uit: samen 100,00 €.'
    )
  })

  it('describes a positive and a negative savings rate', () => {
    expect(sentence({ kind: 'savingsRate', percent: 18, savedCents: 36000 })).toBe(
      'Je hield 18% van je inkomsten over: 360,00 €.'
    )
    expect(sentence({ kind: 'savingsRate', percent: -10, savedCents: -20000 })).toBe(
      'Je gaf 10% meer uit dan je verdiende: 200,00 € meer.'
    )
  })

  it('uses the singular and plural for uncategorized expenses', () => {
    expect(sentence({ kind: 'uncategorized', count: 1 })).toMatch(/^1 uitgave heeft nog/)
    expect(sentence({ kind: 'uncategorized', count: 4 })).toMatch(/^4 uitgaven hebben nog/)
  })
})
