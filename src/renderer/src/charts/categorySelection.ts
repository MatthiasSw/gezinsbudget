// Keeps each chosen category on its own color slot so removing one never repaints the others.
export type SelectedCategory = {
  categoryId: string
  slot: number
}

export const maxSelectedCategories = 5

export function addCategory(selection: SelectedCategory[], categoryId: string): SelectedCategory[] {
  if (selection.length >= maxSelectedCategories) return selection
  if (selection.some((item) => item.categoryId === categoryId)) return selection
  const usedSlots = new Set(selection.map((item) => item.slot))
  const slot = [...Array(maxSelectedCategories).keys()].find((index) => !usedSlots.has(index))
  return slot === undefined ? selection : [...selection, { categoryId, slot }]
}

export function removeCategory(
  selection: SelectedCategory[],
  categoryId: string
): SelectedCategory[] {
  return selection.filter((item) => item.categoryId !== categoryId)
}

export function selectionOf(categoryIds: string[]): SelectedCategory[] {
  return categoryIds.reduce(addCategory, [] as SelectedCategory[])
}
