// Handles the IPC channels that read and change the shared settings (own accounts).
import type { IpcHandlers } from '@shared/ipc'
import type { AccountService } from '../services/accountService'

export type SettingsHandlers = Pick<IpcHandlers, 'settings:get' | 'settings:saveAccounts'>

export function createSettingsHandlers(service: AccountService): SettingsHandlers {
  return {
    'settings:get': () => service.get(),
    'settings:saveAccounts': (accounts) => service.save(accounts)
  }
}
