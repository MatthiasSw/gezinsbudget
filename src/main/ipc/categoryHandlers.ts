// Handles the IPC channels that read and save categories.
import type { IpcHandlers } from '@shared/ipc'
import type { CategoryService } from '../services/categoryService'

export type CategoryHandlers = Pick<IpcHandlers, 'categories:get' | 'categories:save'>

export function createCategoryHandlers(service: CategoryService): CategoryHandlers {
  return {
    'categories:get': () => service.get(),
    'categories:save': (categories) => service.save(categories)
  }
}
