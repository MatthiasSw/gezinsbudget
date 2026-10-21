// Loads the categories for filters and labels; an empty list until they are loaded.
import type { Category } from '@shared/types'
import { api } from '../api'
import { useAsyncData } from './useAsyncData'

export function useCategories(dataRevision: number): Category[] {
  const { state } = useAsyncData(api.categories.get, dataRevision)
  return state.status === 'ready' ? state.data : []
}
