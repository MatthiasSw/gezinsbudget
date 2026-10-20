// Tests the starter categories and rules, and adding what is missing to an existing set.
import { describe, expect, it } from 'vitest'
import type { Category, Transaction } from '@shared/types'
import { withRuleCategories } from './rules'
import { completeStarterSet } from './starterSet'

const fresh = completeStarterSet([], [])

function transaction(overrides: Partial<Transaction>): Transaction {
  return {
    id: 'tx',
    accountId: 'BE68539007547034',
    bookingDate: '2026-01-10',
    amountCents: -1000,
    currency: 'EUR',
    isInternalTransfer: false,
    importedFrom: 'x.csv',
    ...overrides
  }
}

function categoryOf(overrides: Partial<Transaction>): string | undefined {
  const [result] = withRuleCategories([transaction(overrides)], fresh.rules)
  return fresh.categories.find((category) => category.id === result.categoryId)?.name
}

describe('a fresh starter set', () => {
  it('creates unique ids', () => {
    const ids = [...fresh.categories, ...fresh.rules].map((item) => item.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('links every child to an existing parent of the same kind', () => {
    for (const child of fresh.categories.filter((category) => category.parentId)) {
      const parent = fresh.categories.find((category) => category.id === child.parentId)
      expect(parent?.kind).toBe(child.kind)
      expect(parent?.parentId).toBeUndefined()
    }
  })

  it('contains both income and expense categories', () => {
    const kinds = new Set(fresh.categories.map((category) => category.kind))
    expect(kinds).toEqual(new Set(['income', 'expense']))
  })

  it('includes the subcategories of Wonen and Vervoer', () => {
    const names = (parentName: string): string[] => {
      const parent = fresh.categories.find((category) => category.name === parentName)
      return fresh.categories
        .filter((category) => category.parentId === parent?.id)
        .map((category) => category.name)
    }
    expect(names('Wonen')).toContain('Energie')
    expect(names('Vervoer')).toEqual([
      'Brandstof',
      'Openbaar vervoer',
      'Parkeren',
      'Onderhoud wagen'
    ])
  })

  it('has an icon for every category', () => {
    expect(fresh.categories.filter((category) => !category.icon)).toEqual([])
  })

  it('uses the injected id factory', () => {
    let counter = 0
    const seeded = completeStarterSet([], [], () => `id-${counter++}`)
    expect(seeded.categories[0].id).toBe('id-0')
  })

  it('has no empty alternative in a keyword pattern, which would match everything', () => {
    for (const rule of fresh.rules) {
      const hasEmptyAlternative =
        rule.value.startsWith('|') || rule.value.endsWith('|') || rule.value.includes('||')
      expect(hasEmptyAlternative).toBe(false)
      expect(new RegExp(rule.value, 'i').test('')).toBe(false)
    }
  })

  it('has at most one default rule per category', () => {
    const ids = fresh.rules.map((rule) => rule.categoryId)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has valid, enabled rules that all point to existing categories', () => {
    const ids = new Set(fresh.categories.map((category) => category.id))
    for (const rule of fresh.rules) {
      expect(() => new RegExp(rule.value, 'i')).not.toThrow()
      expect(ids.has(rule.categoryId)).toBe(true)
      expect(rule.enabled).toBe(true)
      expect(rule.isDefault).toBe(true)
    }
  })
})

describe('the default rules', () => {
  it.each([
    [{ counterpartyName: 'APOTHEEK JANSSENS' }, 'Apotheek'],
    [{ counterpartyName: 'PARKING STATIONSPLEIN' }, 'Parkeren'],
    [{ counterpartyName: 'LIDL 1234 GENT' }, 'Boodschappen'],
    [{ counterpartyName: 'CRF MKT GENT' }, 'Boodschappen'],
    [{ counterpartyName: 'ESSO BRUGGE' }, 'Brandstof'],
    [{ counterpartyName: 'bol.com webshop' }, 'Online shopping'],
    [{ counterpartyName: 'Basic-Fit Antwerpen' }, 'Sport'],
    [{ counterpartyName: 'FRITUUR DE KOEK' }, 'Restaurant & horeca'],
    [{ counterpartyName: 'Orange Belgium' }, 'Internet & telefoon'],
    [{ counterpartyName: 'Watergroep Vlaanderen' }, 'Water'],
    [{ counterpartyName: 'Luminus' }, 'Energie'],
    [{ message: 'BEDRAG VOOR DE AFBETALING VAN UW WOONKREDIET' }, 'Huur/lening'],
    [{ message: 'BANCONTACT - GELDOPNEMING - ATM0001' }, 'Contant geld'],
    [{ counterpartyName: 'Dierapotheek Janssens' }, 'Huisdieren'],
    [{ message: 'Loon oktober', amountCents: 250000 }, 'Loon'],
    [{ message: 'Dubbel vakantiegeld', amountCents: 150000 }, 'Loon'],
    [{ counterpartyName: 'Groeipakket Fons' }, 'Uitkeringen & toelagen'],
    [{ counterpartyName: 'Pensioensparen Argenta' }, 'Sparen & beleggen'],
    [{ counterpartyName: 'Vanden Borre Hasselt' }, 'Elektro & computers'],
    [{ counterpartyName: 'Coolblue B.V.' }, 'Elektro & computers'],
    [{ counterpartyName: 'Dienstencheques Sodexo poetshulp' }, 'Hulp in huis'],
    [{ counterpartyName: 'Fluvius Antwerpen' }, 'Energie'],
    [{ counterpartyName: 'Aquafin NV' }, 'Water'],
    [{ counterpartyName: 'Digi Belgium' }, 'Internet & telefoon'],
    [{ counterpartyName: 'Renewi afvalophaling' }, 'Afval'],
    [{ counterpartyName: 'Jumbo Supermarkten' }, 'Boodschappen'],
    [{ counterpartyName: 'Fastned laadpaal' }, 'Brandstof'],
    [{ counterpartyName: 'FlixBus Europe' }, 'Openbaar vervoer'],
    [{ counterpartyName: 'Norauto Genk' }, 'Onderhoud wagen'],
    [{ message: 'Verkeersboete politiezone' }, 'Boetes'],
    [{ counterpartyName: 'Solidaris Mutualiteit' }, 'Gezondheid'],
    [{ counterpartyName: 'Tandarts Peeters' }, 'Dokter & ziekenhuis'],
    [{ counterpartyName: 'AG Insurance' }, 'Verzekeringen'],
    [{ counterpartyName: 'Scholengroep 12 schoolreis' }, 'Onderwijs'],
    [{ counterpartyName: 'Padel Club Hasselt' }, 'Sport'],
    [{ counterpartyName: 'Ticketswap' }, 'Cinema & evenementen'],
    [{ counterpartyName: 'Booking.com hotel' }, 'Reizen & vakantie'],
    [{ counterpartyName: 'Dreamland Genk' }, 'Speelgoed & spel'],
    [{ counterpartyName: 'Standaard Boekhandel' }, 'Hobby & boeken'],
    [{ counterpartyName: 'Deliveroo' }, 'Restaurant & horeca'],
    [{ counterpartyName: 'Scapino' }, 'Kleding'],
    [{ counterpartyName: 'Rituals Cosmetics' }, 'Verzorging'],
    [{ counterpartyName: 'PAYPAL *NETFLIX' }, 'Abonnementen'],
    [{ counterpartyName: 'Vinted' }, 'Online shopping'],
    [{ counterpartyName: 'Cadeaubon Bongo' }, 'Cadeaus'],
    [{ counterpartyName: 'ACV vakbond lidgeld' }, 'Lidmaatschappen'],
    [{ counterpartyName: 'Vlabel onroerende voorheffing' }, 'Belastingen'],
    [{ counterpartyName: 'Notaris Verbeke' }, 'Notaris & juridisch'],
    [{ counterpartyName: 'bpost Mechelen' }, 'Post & verzending'],
    [{ counterpartyName: 'Rode Kruis Vlaanderen' }, 'Giften & goede doelen'],
    [{ message: 'Kosten rekening maart' }, 'Bankkosten']
  ])('categorises %j as %s', (fields, expected) => {
    expect(categoryOf(fields)).toBe(expected)
  })

  it('also finds a keyword in the transaction description', () => {
    expect(categoryOf({ description: 'BANCONTACT-AANKOOP - HUBO GENT - 3700' })).toBe('Bouw & tuin')
  })

  it('matches whole words only where the keyword is a word', () => {
    expect(categoryOf({ counterpartyName: 'CASH Stationsstraat' })).toBe('Contant geld')
    expect(categoryOf({ counterpartyName: 'Cashback Actie' })).toBeUndefined()
    expect(categoryOf({ message: 'Looncheque' })).toBeUndefined()
    expect(categoryOf({ counterpartyName: 'Q-Park Centrum' })).toBe('Parkeren')
    expect(categoryOf({ counterpartyName: 'P+R Leuven' })).toBe('Parkeren')
    expect(categoryOf({ counterpartyName: 'Schoolstraat 4 Gent' })).toBeUndefined()
    expect(categoryOf({ message: 'Pensioensparen maart' })).toBe('Sparen & beleggen')
  })

  it('leaves unknown counterparties uncategorised', () => {
    expect(categoryOf({ counterpartyName: 'Jan Peeters' })).toBeUndefined()
  })
})

describe('completing an existing set', () => {
  it('reuses categories with the same name and adds only what is missing', () => {
    const existing: Category[] = [
      { id: 'own-wonen', name: 'Wonen', kind: 'expense' },
      { id: 'own-water', name: 'water', kind: 'expense', parentId: 'own-wonen' }
    ]
    const result = completeStarterSet(existing, [])
    expect(
      result.categories.filter((category) => category.name.toLowerCase() === 'water')
    ).toHaveLength(1)
    expect(result.categories.filter((category) => category.name === 'Wonen')).toHaveLength(1)
    const waterRule = result.rules.find((rule) => rule.value.includes('watergroep'))
    expect(waterRule?.categoryId).toBe('own-water')
  })

  it('adds nothing the second time', () => {
    const second = completeStarterSet(fresh.categories, fresh.rules)
    expect(second.addedCategoryCount).toBe(0)
    expect(second.addedRuleCount).toBe(0)
    expect(second.updatedRuleCount).toBe(0)
    expect(second.rules).toEqual(fresh.rules)
  })

  it('refreshes the keywords of an outdated default rule in place and keeps its switch', () => {
    const outdated = { ...fresh.rules[0], value: 'verouderd', enabled: false }
    const result = completeStarterSet(fresh.categories, [outdated, ...fresh.rules.slice(1)])
    expect(result.updatedRuleCount).toBe(1)
    expect(result.addedRuleCount).toBe(0)
    expect(result.rules[0]).toEqual({ ...fresh.rules[0], enabled: false })
  })

  it('never touches a rule of the user, even for the same category', () => {
    const own = { ...fresh.rules[0], id: 'own', value: 'mijn regel', isDefault: false }
    const result = completeStarterSet(fresh.categories, [own])
    expect(result.rules.find((rule) => rule.id === 'own')?.value).toBe('mijn regel')
    expect(result.updatedRuleCount).toBe(0)
  })

  it('flags an unflagged rule that already has the default keywords instead of adding a copy', () => {
    const { isDefault: removedFlag, ...unflagged } = fresh.rules[0]
    void removedFlag
    const result = completeStarterSet(fresh.categories, [unflagged, ...fresh.rules.slice(1)])
    expect(result.addedRuleCount).toBe(0)
    expect(result.rules[0].isDefault).toBe(true)
  })

  it('keeps the rules of the user and adds the default ones after them', () => {
    const own = { ...fresh.rules[0], id: 'own', value: 'mijn regel', isDefault: false }
    const result = completeStarterSet(fresh.categories, [own])
    expect(result.rules[0]).toEqual(own)
    expect(result.addedRuleCount).toBe(fresh.rules.length)
  })
})
