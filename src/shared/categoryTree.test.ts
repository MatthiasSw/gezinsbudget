// Tests category validation, descendants and display order.
import { describe, expect, it } from 'vitest'
import {
  assertValidCategories,
  descendantIds,
  findTooDeepCategory,
  flattenTree,
  treeGuides
} from './categoryTree'
import type { Category } from './types'

function category(id: string, overrides: Partial<Category> = {}): Category {
  return { id, name: id.toUpperCase(), kind: 'expense', ...overrides }
}

describe('assertValidCategories', () => {
  it('accepts a valid tree', () => {
    expect(() =>
      assertValidCategories([category('a'), category('b', { parentId: 'a' })])
    ).not.toThrow()
  })

  it.each([
    ['duplicate ids', [category('a'), category('a')]],
    ['empty name', [category('a', { name: '  ' })]],
    ['icon that is too long', [category('a', { icon: 'x'.repeat(17) })]],
    ['missing parent', [category('a', { parentId: 'nope' })]],
    ['self parent', [category('a', { parentId: 'a' })]],
    ['cycle', [category('a', { parentId: 'b' }), category('b', { parentId: 'a' })]],
    [
      'a subcategory of a subcategory',
      [category('a'), category('b', { parentId: 'a' }), category('c', { parentId: 'b' })]
    ],
    ['kind mismatch', [category('a'), category('b', { parentId: 'a', kind: 'income' })]]
  ])('rejects %s', (_label, categories) => {
    expect(() => assertValidCategories(categories)).toThrowError(
      expect.objectContaining({ code: 'INVALID_CATEGORIES' })
    )
  })
})

describe('descendantIds', () => {
  const categories = [
    category('root'),
    category('child', { parentId: 'root' }),
    category('grandchild', { parentId: 'child' }),
    category('other')
  ]

  it('includes the category itself and all nested children', () => {
    expect(descendantIds(categories, 'root').sort()).toEqual(['child', 'grandchild', 'root'])
  })

  it('returns only itself for a leaf', () => {
    expect(descendantIds(categories, 'other')).toEqual(['other'])
  })
})

describe('flattenTree', () => {
  const categories = [
    category('z-expense', { name: 'Zeta' }),
    category('a-expense', { name: 'Alfa' }),
    category('child', { name: 'Kind', parentId: 'a-expense' }),
    category('salary', { name: 'Loon', kind: 'income' })
  ]

  it('lists all categories alphabetically with children under their parent, also alphabetical', () => {
    const names = flattenTree(categories).map((row) => `${row.depth}:${row.category.name}`)
    expect(names).toEqual(['0:Alfa', '1:Kind', '0:Loon', '0:Zeta'])
  })

  it('can list income first and then expenses', () => {
    const names = flattenTree(categories, true).map((row) => `${row.depth}:${row.category.name}`)
    expect(names).toEqual(['0:Loon', '0:Alfa', '1:Kind', '0:Zeta'])
  })
})

describe('treeGuides', () => {
  it('draws a tee for children with a later sibling and an elbow for the last child', () => {
    const rows = flattenTree([
      category('p', { name: 'Parent' }),
      category('a', { name: 'Alfa', parentId: 'p' }),
      category('b', { name: 'Beta', parentId: 'p' }),
      category('q', { name: 'Quote' })
    ])
    expect(treeGuides(rows)).toEqual([[], ['tee'], ['elbow'], []])
  })

  it('handles a final child at the end of the list', () => {
    const rows = flattenTree([
      category('p', { name: 'Parent' }),
      category('a', { name: 'Alfa', parentId: 'p' })
    ])
    expect(treeGuides(rows)).toEqual([[], ['elbow']])
  })

  it('keeps the parent line going past the grandchildren of a child that has later siblings', () => {
    const rows = flattenTree([
      category('p', { name: 'Parent' }),
      category('a', { name: 'Alfa', parentId: 'p' }),
      category('a1', { name: 'Alfa een', parentId: 'a' }),
      category('a2', { name: 'Alfa twee', parentId: 'a' }),
      category('b', { name: 'Beta', parentId: 'p' })
    ])
    expect(treeGuides(rows)).toEqual([[], ['tee'], ['pass', 'tee'], ['pass', 'elbow'], ['elbow']])
  })

  it('leaves a blank column under a last child', () => {
    const rows = flattenTree([
      category('p', { name: 'Parent' }),
      category('a', { name: 'Alfa', parentId: 'p' }),
      category('a1', { name: 'Alfa een', parentId: 'a' })
    ])
    expect(treeGuides(rows)).toEqual([[], ['elbow'], ['blank', 'elbow']])
  })
})

describe('findTooDeepCategory', () => {
  it('finds a subcategory that has a parent which is itself a subcategory', () => {
    const categories = [
      category('a'),
      category('b', { parentId: 'a' }),
      category('c', { parentId: 'b', name: 'Te diep' })
    ]
    expect(findTooDeepCategory(categories)?.name).toBe('Te diep')
  })

  it('accepts main categories with subcategories', () => {
    const categories = [category('a'), category('b', { parentId: 'a' }), category('c')]
    expect(findTooDeepCategory(categories)).toBeUndefined()
  })
})
