// Handles the IPC channel for insights by delegating to the insights service.
import type { IpcHandlers } from '@shared/ipc'
import type { InsightsService } from '../services/insightsService'

export type InsightsHandlers = Pick<IpcHandlers, 'insights:get'>

export function createInsightsHandlers(service: InsightsService): InsightsHandlers {
  return {
    'insights:get': (request) => service.get(request)
  }
}
