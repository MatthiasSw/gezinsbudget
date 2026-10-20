// Renderer-side API: unwraps IPC results and throws AppError on failure.
import { AppError } from '@shared/errors'
import type { IpcResult } from '@shared/ipc'
import type { OverviewRequest } from '@shared/overview'
import type { ReapplyRequest } from '@shared/ruleTypes'
import type { SetCategoryRequest, TransactionQuery } from '@shared/transactionQuery'
import type { Account, Budget, Category, Rule } from '@shared/types'

async function unwrap<T>(pending: Promise<IpcResult<T>>): Promise<T> {
  const result = await pending
  if (result.ok) return result.value
  throw new AppError(result.error.code, result.error.message, result.error.details)
}

export const api = {
  config: {
    get: () => unwrap(window.api.config.get()),
    chooseDataDir: () => unwrap(window.api.config.chooseDataDir())
  },
  settings: {
    get: () => unwrap(window.api.settings.get()),
    saveAccounts: (accounts: Account[]) => unwrap(window.api.settings.saveAccounts(accounts))
  },
  import: {
    pick: () => unwrap(window.api.import.pick()),
    resume: (token: string) => unwrap(window.api.import.resume(token)),
    confirm: (token: string) => unwrap(window.api.import.confirm(token)),
    cancel: (token: string) => unwrap(window.api.import.cancel(token))
  },
  transactions: {
    query: (query: TransactionQuery) => unwrap(window.api.transactions.query(query)),
    setCategory: (request: SetCategoryRequest) =>
      unwrap(window.api.transactions.setCategory(request)),
    export: (query: TransactionQuery) => unwrap(window.api.transactions.export(query))
  },
  categories: {
    get: () => unwrap(window.api.categories.get()),
    save: (categories: Category[]) => unwrap(window.api.categories.save(categories))
  },
  budgets: {
    get: () => unwrap(window.api.budgets.get()),
    save: (budgets: Budget[]) => unwrap(window.api.budgets.save(budgets))
  },
  rules: {
    get: () => unwrap(window.api.rules.get()),
    save: (rules: Rule[]) => unwrap(window.api.rules.save(rules)),
    reapply: (request: ReapplyRequest) => unwrap(window.api.rules.reapply(request)),
    test: (rule: Rule) => unwrap(window.api.rules.test(rule)),
    addDefaults: () => unwrap(window.api.rules.addDefaults())
  },
  insights: {
    get: (request: OverviewRequest) => unwrap(window.api.insights.get(request))
  },
  recurring: {
    get: () => unwrap(window.api.recurring.get())
  },
  data: {
    version: () => unwrap(window.api.data.version())
  },
  overview: {
    get: (request: OverviewRequest) => unwrap(window.api.overview.get(request)),
    years: () => unwrap(window.api.overview.years())
  }
}
