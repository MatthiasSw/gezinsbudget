// Validates the category tree and lists categories in display order.
import { maxIconLength } from './categoryIcons'
import { AppError } from './errors'
import type { Category } from './types'

export type CategoryRow = {
  category: Category
  depth: number
}

export const maxCategoryDepth = 1

export function findTooDeepCategory(categories: Category[]): Category | undefined {
  const byId = new Map(categories.map((category) => [category.id, category]))
  return categories.find((category) => depthOf(category, byId) > maxCategoryDepth)
}

export function assertValidCategories(categories: Category[]): void {
  const byId = new Map<string, Category>()
  for (const category of categories) {
    if (category.id.trim() === '') throw invalid('A category has no id')
    if (byId.has(category.id)) throw invalid(`Duplicate category id ${category.id}`)
    if (category.name.trim() === '') throw invalid('A category has no name')
    if ((category.icon ?? '').length > maxIconLength) throw invalid('A category icon is too long')
    byId.set(category.id, category)
  }

  for (const category of categories) {
    if (category.parentId === undefined) continue
    const parent = byId.get(category.parentId)
    if (!parent) throw invalid(`Parent of "${category.name}" does not exist`)
    if (parent.kind !== category.kind)
      throw invalid(`"${category.name}" has a different kind than its parent`)
    if (leadsToCycle(category, byId)) throw invalid(`"${category.name}" is part of a cycle`)
  }

  const tooDeep = findTooDeepCategory(categories)
  if (tooDeep) throw invalid(`"${tooDeep.name}" is nested too deep`)
}

function depthOf(category: Category, byId: Map<string, Category>): number {
  let depth = 0
  const seen = new Set<string>([category.id])
  let current = parentOf(category, byId)
  while (current && !seen.has(current.id)) {
    depth++
    seen.add(current.id)
    current = parentOf(current, byId)
  }
  return depth
}

function parentOf(category: Category, byId: Map<string, Category>): Category | undefined {
  return category.parentId === undefined ? undefined : byId.get(category.parentId)
}

export function descendantIds(categories: Category[], rootId: string): string[] {
  const ids = [rootId]
  for (let index = 0; index < ids.length; index++) {
    for (const category of categories) {
      if (category.parentId === ids[index] && !ids.includes(category.id)) ids.push(category.id)
    }
  }
  return ids
}

export type TreeGuide = 'pass' | 'blank' | 'tee' | 'elbow'

export function treeGuides(rows: CategoryRow[]): TreeGuide[][] {
  const hasLaterSibling = (index: number): boolean => {
    for (const next of rows.slice(index + 1)) {
      if (next.depth < rows[index].depth) return false
      if (next.depth === rows[index].depth) return true
    }
    return false
  }
  const ancestorAt = (index: number, depth: number): number => {
    for (let candidate = index - 1; candidate >= 0; candidate--) {
      if (rows[candidate].depth === depth) return candidate
    }
    return index
  }

  return rows.map((row, index) =>
    Array.from({ length: row.depth }, (_, level): TreeGuide => {
      const depth = level + 1
      if (depth === row.depth) return hasLaterSibling(index) ? 'tee' : 'elbow'
      return hasLaterSibling(ancestorAt(index, depth)) ? 'pass' : 'blank'
    })
  )
}

export function flattenTree(categories: Category[], groupByKind = false): CategoryRow[] {
  const rows: CategoryRow[] = []
  const addBranch = (
    parentId: string | undefined,
    depth: number,
    kind?: Category['kind']
  ): void => {
    const siblings = categories
      .filter(
        (category) => category.parentId === parentId && (kind ? category.kind === kind : true)
      )
      .sort((a, b) => a.name.localeCompare(b.name, 'nl'))
    for (const category of siblings) {
      rows.push({ category, depth })
      addBranch(category.id, depth + 1)
    }
  }
  if (groupByKind) {
    addBranch(undefined, 0, 'income')
    addBranch(undefined, 0, 'expense')
  } else {
    addBranch(undefined, 0)
  }
  return rows
}

function leadsToCycle(start: Category, byId: Map<string, Category>): boolean {
  const seen = new Set<string>([start.id])
  let current = parentOf(start, byId)
  while (current) {
    if (seen.has(current.id)) return true
    seen.add(current.id)
    current = parentOf(current, byId)
  }
  return false
}

function invalid(message: string): AppError {
  return new AppError('INVALID_CATEGORIES', message)
}
