// Reads and saves the category tree; removing a category clears it from transactions and rules.
import { assertValidCategories } from '@shared/categoryTree'
import type { Category } from '@shared/types'
import { clearCategories } from '@core/categorize'
import type { DataRepository, GetRepository } from '../storage/repository'
import { rewriteMonths } from './monthRewrite'

export type CategoryService = {
  get(): Promise<Category[]>
  save(categories: Category[]): Promise<Category[]>
}

export type CategoryServiceDependencies = {
  getRepository: GetRepository
}

export function createCategoryService({
  getRepository
}: CategoryServiceDependencies): CategoryService {
  return {
    get: async () => (await getRepository()).getCategories(),
    save: async (categories) => {
      const repository = await getRepository()
      const cleaned = categories.map((category) => ({ ...category, name: category.name.trim() }))
      assertValidCategories(cleaned)
      await detachRemovedCategories(repository, cleaned)
      await repository.saveCategories(cleaned)
      return cleaned
    }
  }
}

async function detachRemovedCategories(
  repository: DataRepository,
  next: Category[]
): Promise<void> {
  const keptIds = new Set(next.map((category) => category.id))
  const removedIds = new Set(
    (await repository.getCategories())
      .map((category) => category.id)
      .filter((id) => !keptIds.has(id))
  )
  if (removedIds.size === 0) return

  const rules = await repository.getRules()
  const keptRules = rules.filter((rule) => !removedIds.has(rule.categoryId))
  if (keptRules.length !== rules.length) await repository.saveRules(keptRules)

  await rewriteMonths(repository, await repository.listMonths(), (stored) =>
    clearCategories(stored, removedIds)
  )
}
