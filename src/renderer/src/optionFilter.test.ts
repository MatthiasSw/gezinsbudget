// Tests filtering of searchable dropdown options.
import { describe, expect, it } from 'vitest'
import { filterOptions, type SearchOption } from './optionFilter'

const options: SearchOption[] = [
  { id: 'a', label: '🛒 Boodschappen', name: 'Boodschappen' },
  { id: 'b', label: '⚡ Energie', name: 'Energie', hint: 'Wonen' },
  { id: 'c', label: '🏠 Wonen', name: 'Wonen' },
  { id: 'd', label: '🍽️ Café & restaurant', name: 'Café & restaurant' }
]

const ids = (query: string): string[] => filterOptions(options, query).map((option) => option.id)

describe('filterOptions', () => {
  it('returns everything for an empty query', () => {
    expect(ids('')).toEqual(['a', 'b', 'c', 'd'])
    expect(ids('   ')).toEqual(['a', 'b', 'c', 'd'])
  })

  it('matches a part of a word anywhere in the name', () => {
    expect(ids('schap')).toEqual(['a'])
    expect(ids('ener')).toEqual(['b'])
  })

  it('ignores case and accents', () => {
    expect(ids('CAFE')).toEqual(['d'])
    expect(ids('café')).toEqual(['d'])
  })

  it('also finds subcategories through the name of their main category', () => {
    expect(ids('wonen')).toEqual(['b', 'c'])
  })

  it('needs every typed word to match', () => {
    expect(ids('cafe rest')).toEqual(['d'])
    expect(ids('cafe energie')).toEqual([])
  })
})
