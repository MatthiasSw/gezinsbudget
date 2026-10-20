// Application entry point: wires the services together and owns the app lifecycle.
import { app, BrowserWindow } from 'electron'
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
    release().finally(() => {
      released = true
      app.quit()
    })
  })
}

app.whenReady().then(start)

app.on('window-all-closed', () => {
  app.quit()
})
