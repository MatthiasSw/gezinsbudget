// Exposes the narrow, typed API to the renderer through the context bridge.
import { contextBridge, ipcRenderer } from 'electron'
import type { IpcChannel, IpcRequest, IpcResponse, IpcResult } from '@shared/ipc'
import type { OverviewRequest } from '@shared/overview'
import type { ReapplyRequest } from '@shared/ruleTypes'
import type { SetCategoryRequest, TransactionQuery } from '@shared/transactionQuery'
import type { Account, Budget, Category, Rule } from '@shared/types'

function call<K extends IpcChannel>(
  channel: K,
  request?: IpcRequest<K>
): Promise<IpcResult<IpcResponse<K>>> {
  return ipcRenderer.invoke(channel, request)
}

const api = {
  config: {
    get: () => call('config:get'),
    chooseDataDir: () => call('config:chooseDataDir')
  },
  settings: {
    get: () => call('settings:get'),
    saveAccounts: (accounts: Account[]) => call('settings:saveAccounts', accounts)
  },
  import: {
    pick: () => call('import:pick'),
    resume: (token: string) => call('import:resume', token),
    confirm: (token: string) => call('import:confirm', token),
    cancel: (token: string) => call('import:cancel', token)
  },
  transactions: {
    query: (query: TransactionQuery) => call('transactions:query', query),
    setCategory: (request: SetCategoryRequest) => call('transactions:setCategory', request),
    export: (query: TransactionQuery) => call('transactions:export', query)
  },
  categories: {
    get: () => call('categories:get'),
    save: (categories: Category[]) => call('categories:save', categories)
  },
  budgets: {
    get: () => call('budgets:get'),
    save: (budgets: Budget[]) => call('budgets:save', budgets)
  },
  rules: {
    get: () => call('rules:get'),
    save: (rules: Rule[]) => call('rules:save', rules),
    reapply: (request: ReapplyRequest) => call('rules:reapply', request),
    test: (rule: Rule) => call('rules:test', rule),
    addDefaults: () => call('rules:addDefaults')
  },
  insights: {
    get: (request: OverviewRequest) => call('insights:get', request)
  },
  recurring: {
    get: () => call('recurring:get')
  },
  data: {
    version: () => call('data:version')
  },
  overview: {
    get: (request: OverviewRequest) => call('overview:get', request),
    years: () => call('overview:years')
  }
}

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api
