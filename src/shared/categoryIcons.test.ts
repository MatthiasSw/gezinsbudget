// Tests icon lookup, the default icons for the starter categories and label building.
import { describe, expect, it } from 'vitest'
import { completeStarterSet } from '../core/starterSet'
import {
  categoryIcon,
  categoryLabel,
  defaultCategoryIcons,
  iconChoices,
  indentedCategoryLabel
} from './categoryIcons'

describe('categoryIcon', () => {
  it('prefers the icon chosen by the user', () => {
    expect(categoryIcon({ name: 'Boodschappen', icon: '🍎' })).toBe('🍎')
  })

  it('falls back to the default for a starter category without an icon', () => {
    expect(categoryIcon({ name: ' Boodschappen ' })).toBe('🛒')
  })

  it('respects an explicitly empty icon', () => {
    expect(categoryIcon({ name: 'Boodschappen', icon: '' })).toBe('')
  })

  it('is empty for an unknown category', () => {
    expect(categoryIcon({ name: 'Huisdier' })).toBe('')
  })
})

describe('categoryLabel', () => {
  it('puts the icon before the name', () => {
    expect(categoryLabel({ name: 'Loon' })).toBe('💼 Loon')
  })

  it('is just the name without an icon', () => {
    expect(categoryLabel({ name: 'Huisdier' })).toBe('Huisdier')
  })
})

describe('starter categories', () => {
  it('have a default icon for every category', () => {
    const missing = completeStarterSet([], []).categories.filter(
      (category) => defaultCategoryIcons[category.name.toLowerCase()] === undefined
    )
    expect(missing).toEqual([])
  })
})

describe('iconChoices', () => {
  it('offers many different icons without duplicates', () => {
    expect(iconChoices.length).toBeGreaterThan(250)
    expect(new Set(iconChoices).size).toBe(iconChoices.length)
  })

  it('offers honey, an animal and a food icon among the extras', () => {
    expect(iconChoices).toEqual(expect.arrayContaining(['🍯', '🐝', '🥛']))
  })
})

describe('indentedCategoryLabel', () => {
  it('does not indent a main category', () => {
    expect(indentedCategoryLabel({ name: 'Loon' }, 0)).toBe('💼 Loon')
  })

  it('indents a subcategory with non-breaking spaces so a dropdown keeps them', () => {
    const label = indentedCategoryLabel({ name: 'Water' }, 1)
    expect(label.endsWith('💧 Water')).toBe(true)
    const indent = [...label.slice(0, label.indexOf(String.fromCodePoint(0x1f4a7)))]
    expect(indent.length).toBeGreaterThan(1)
    expect(indent.every((character) => character.charCodeAt(0) === 0xa0)).toBe(true)
  })
})
