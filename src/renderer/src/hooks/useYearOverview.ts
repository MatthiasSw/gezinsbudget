// Loads the overview of one year and account.
import { useCallback } from 'react'
import type { OverviewRequest, OverviewTable } from '@shared/overview'
import { yearSpan } from '@shared/periods'
import { api } from '../api'
import { useAsyncData, type AsyncState } from './useAsyncData'

// An empty account id means all accounts.
export function yearRequest(year: number, accountId: string): OverviewRequest {
  return { ...yearSpan(year), accountIds: accountId ? [accountId] : undefined }
}

export function useYearOverview(
  year: number,
  accountId: string,
  dataRevision: number
): AsyncState<OverviewTable> {
  const load = useCallback(() => api.overview.get(yearRequest(year, accountId)), [year, accountId])
  return useAsyncData(load, dataRevision).state
}
