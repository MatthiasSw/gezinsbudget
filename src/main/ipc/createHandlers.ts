// Assembles every IPC handler from its dependencies.
import type { IpcHandlers } from '@shared/ipc'
import type { LocalConfigStore } from '../localConfig'
import { createAccountService } from '../services/accountService'
import { createBudgetService } from '../services/budgetService'
import { createCategoryService } from '../services/categoryService'
import { createInsightsService } from '../services/insightsService'
import { createImportService, type PickedFile } from '../services/importService'
import { createOverviewService } from '../services/overviewService'
import { createRecurringService } from '../services/recurringService'
import { createRuleService } from '../services/ruleService'
import { createTransactionService, type SaveFile } from '../services/transactionService'
import type { RepositoryProvider } from '../storage/repositoryProvider'
import { createBudgetHandlers } from './budgetHandlers'
import { createCategoryHandlers } from './categoryHandlers'
import { createConfigHandlers } from './configHandlers'
import { createDataVersionHandlers } from './dataVersionHandlers'
import { createImportHandlers } from './importHandlers'
import { createInsightsHandlers } from './insightsHandlers'
import { createOverviewHandlers } from './overviewHandlers'
import { createRecurringHandlers } from './recurringHandlers'
import { createRuleHandlers } from './ruleHandlers'
import { createSettingsHandlers } from './settingsHandlers'
import { createTransactionHandlers } from './transactionHandlers'

export type HandlerDependencies = {
  store: LocalConfigStore
  provider: RepositoryProvider
  chooseDirectory: () => Promise<string | null>
  chooseFile: () => Promise<PickedFile | null>
  saveFile: SaveFile
}

export function createHandlers(dependencies: HandlerDependencies): IpcHandlers {
  const { store, provider, chooseDirectory, chooseFile, saveFile } = dependencies
  const getRepository = (): ReturnType<RepositoryProvider['get']> => provider.get()

  return {
    ...createConfigHandlers({ store, chooseDirectory }),
    ...createSettingsHandlers(createAccountService({ getRepository })),
    ...createImportHandlers(createImportService({ getRepository, chooseFile })),
    ...createTransactionHandlers(createTransactionService({ getRepository, saveFile })),
    ...createCategoryHandlers(createCategoryService({ getRepository })),
    ...createBudgetHandlers(createBudgetService({ getRepository })),
    ...createInsightsHandlers(createInsightsService({ getRepository })),
    ...createRecurringHandlers(createRecurringService({ getRepository })),
    ...createRuleHandlers(createRuleService({ getRepository })),
    ...createDataVersionHandlers({ getRepository }),
    ...createOverviewHandlers(createOverviewService({ getRepository }))
  }
}
