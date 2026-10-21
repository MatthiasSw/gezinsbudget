// Application entry point: wires the services together and owns the app lifecycle.
import { app, BrowserWindow, dialog } from 'electron'
import { hostname } from 'os'
import { join } from 'path'
import { chooseDirectory } from './dialogs/chooseDirectory'
import { chooseImportFile } from './dialogs/chooseImportFile'
import { saveExportFile } from './dialogs/saveExportFile'
import { createWindow } from './createWindow'
import { ensureDefaultDataDir } from './ensureDefaultDataDir'
import { createHandlers } from './ipc/createHandlers'
import { registerHandlers } from './ipc/registerHandlers'
import { createLocalConfigStore } from './localConfig'
import { createRepositoryProvider } from './storage/repositoryProvider'

// An unreachable network drive must not keep the app from closing.
const lockReleaseTimeoutMs = 3000

async function start(): Promise<void> {
  const configPath = join(app.getPath('userData'), 'config.json')
  const store = await createLocalConfigStore(configPath)
  await ensureDefaultDataDir(store, join(app.getPath('documents'), 'Gezinsbudget'))
  const provider = createRepositoryProvider({
    configStore: store,
    host: hostname(),
    pid: process.pid
  })

  registerHandlers(
    createHandlers({
      store,
      provider,
      chooseDirectory,
      chooseFile: chooseImportFile,
      saveFile: saveExportFile
    })
  )
  releaseLockOnQuit(provider.close)
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
}

function releaseLockOnQuit(release: () => Promise<void>): void {
  let released = false
  app.on('will-quit', (event) => {
    if (released) return
    event.preventDefault()
    withTimeout(release(), lockReleaseTimeoutMs).finally(() => {
      released = true
      app.quit()
    })
  })
}

function withTimeout(task: Promise<void>, timeoutMs: number): Promise<void> {
  const timeout = new Promise<void>((resolve) => setTimeout(resolve, timeoutMs))
  return Promise.race([task.catch(() => undefined), timeout])
}

function showStartupError(error: unknown): void {
  const details = error instanceof Error ? error.message : String(error)
  dialog.showErrorBox('Gezinsbudget kan niet starten', details)
  app.quit()
}

// A second copy on the same pc would write to the same data folder; bring the first one forward instead.
function focusExistingWindow(): void {
  const [window] = BrowserWindow.getAllWindows()
  if (!window) return
  if (window.isMinimized()) window.restore()
  window.focus()
}

if (app.requestSingleInstanceLock()) {
  app.on('second-instance', focusExistingWindow)
  app.whenReady().then(start).catch(showStartupError)
} else {
  app.quit()
}

app.on('window-all-closed', () => {
  app.quit()
})
