// Handles the IPC channels that return the category-by-month overview and the years with data.
import type { IpcHandlers } from '@shared/ipc'
import type { OverviewService } from '../services/overviewService'

export type OverviewHandlers = Pick<IpcHandlers, 'overview:get' | 'overview:years'>

export function createOverviewHandlers(service: OverviewService): OverviewHandlers {
  return {
    'overview:get': (request) => service.get(request),
    'overview:years': () => service.years()
  }
}
