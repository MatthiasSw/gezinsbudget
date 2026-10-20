// Registers all IPC handlers on Electron, each returning typed results instead of throwing.
import { ipcMain } from 'electron'
import type { IpcChannel, IpcHandlers } from '@shared/ipc'
import { toResultHandler } from './resultHandler'

export function registerHandlers(handlers: IpcHandlers): void {
  const channels = Object.keys(handlers) as IpcChannel[]
  for (const channel of channels) {
    registerChannel(channel, handlers)
  }
}

function registerChannel<K extends IpcChannel>(channel: K, handlers: IpcHandlers): void {
  const handle = toResultHandler(handlers[channel])
  ipcMain.handle(channel, (_event, request) => handle(request))
}
