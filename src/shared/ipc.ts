// Typed IPC contract between renderer and main, including which channels write data.
import type { SaveAccountsResult } from './accountTypes'
import type { ImportPickResult, ImportResult } from './importTypes'
import type { AddDefaultsResult, ReapplyRequest, ReapplyResult, RuleTestResult } from './ruleTypes'
import type { Insights } from './insightTypes'
import type { OverviewRequest, OverviewTable } from './overview'
import type { RecurringSpend } from './recurringTypes'
import type { ExportResult, SetCategoryRequest, TransactionQuery } from './transactionQuery'
import type {
  Account,
  AppSettings,
  Budget,
  Category,
  DataVersion,
  LocalConfig,
  Rule,
  Transaction
} from './types'
import type { SerializedError } from './errors'

export type IpcContract = {
  'config:get': { request: void; response: LocalConfig }
  'config:chooseDataDir': { request: void; response: LocalConfig | null }
  'settings:get': { request: void; response: AppSettings }
  'settings:saveAccounts': { request: Account[]; response: SaveAccountsResult }
  'import:pick': { request: void; response: ImportPickResult | null }
  'import:resume': { request: string; response: ImportPickResult }
  'import:confirm': { request: string; response: ImportResult }
  'import:cancel': { request: string; response: void }
  'transactions:query': { request: TransactionQuery; response: Transaction[] }
  'transactions:setCategory': { request: SetCategoryRequest; response: number }
  'transactions:export': { request: TransactionQuery; response: ExportResult | null }
  'categories:get': { request: void; response: Category[] }
  'categories:save': { request: Category[]; response: Category[] }
  'budgets:get': { request: void; response: Budget[] }
  'budgets:save': { request: Budget[]; response: Budget[] }
  'rules:get': { request: void; response: Rule[] }
  'rules:save': { request: Rule[]; response: Rule[] }
  'rules:reapply': { request: ReapplyRequest; response: ReapplyResult }
  'rules:test': { request: Rule; response: RuleTestResult }
  'rules:addDefaults': { request: void; response: AddDefaultsResult }
  'recurring:get': { request: void; response: RecurringSpend[] }
  'insights:get': { request: OverviewRequest; response: Insights }
  'overview:years': { request: void; response: number[] }
  'overview:get': { request: OverviewRequest; response: OverviewTable }
  'data:version': { request: void; response: DataVersion | null }
}

export type IpcChannel = keyof IpcContract

export type IpcRequest<K extends IpcChannel> = IpcContract[K]['request']
export type IpcResponse<K extends IpcChannel> = IpcContract[K]['response']

export type IpcResult<T> = { ok: true; value: T } | { ok: false; error: SerializedError }

export type IpcHandlers = {
  [K in IpcChannel]: (request: IpcRequest<K>) => Promise<IpcResponse<K>>
}
