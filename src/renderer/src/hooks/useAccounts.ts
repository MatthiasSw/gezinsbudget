// Loads the own accounts for filters and labels; an empty list until they are loaded.
import type { Account } from '@shared/types'
import { api } from '../api'
import { useAsyncData } from './useAsyncData'

export function useAccounts(dataRevision: number): Account[] {
  const { state } = useAsyncData(api.settings.get, dataRevision)
  return state.status === 'ready' ? state.data.accounts : []
}
