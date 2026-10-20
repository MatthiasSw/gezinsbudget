// Loads the overview of one year and account, plus the account list for the filter.
import { useCallback } from 'react'
import { yearRangeOf } from '@shared/periods'
import type { OverviewTable } from '@shared/overview'
import type { Account } from '@shared/types'
import { api } from '../api'
import { useAsyncData, type AsyncState } from './useAsyncData'

export function useYearOverview(
  year: number,
  accountId: string,
  dataRevision: number
): { overview: AsyncState<OverviewTable>; accounts: Account[] } {
  const load = useCallback(() => {
    const range = yearRangeOf(year)
    return api.overview.get({
      from: range.from!,
      to: range.to!,
      accountIds: accountId ? [accountId] : undefined
    })
  }, [year, accountId])
  const overview = useAsyncData(load, dataRevision)
  const settings = useAsyncData(api.settings.get, dataRevision)
  const accounts = settings.state.status === 'ready' ? settings.state.data.accounts : []
  return { overview: overview.state, accounts }
}
