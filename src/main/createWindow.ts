// Creates the application window with a locked-down renderer.
import { BrowserWindow } from 'electron'
import { join } from 'path'
import appIcon from '../../resources/icon.png?asset'

const developmentServerUrl = process.env['ELECTRON_RENDERER_URL']

export function createWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    title: 'Gezinsbudget',
    icon: appIcon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true
    }
  })

  window.once('ready-to-show', () => {
    window.maximize()
    window.show()
  })
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  window.webContents.on('will-navigate', (event) => event.preventDefault())

  loadRenderer(window)
  return window
}

function loadRenderer(window: BrowserWindow): void {
  if (developmentServerUrl) {
    window.loadURL(developmentServerUrl)
    return
  }
  window.loadFile(join(__dirname, '../renderer/index.html'))
}
