// Shows the native folder picker and returns the chosen path, or null when cancelled.
import { BrowserWindow, dialog } from 'electron'

export async function chooseDirectory(): Promise<string | null> {
  const options = {
    title: 'Kies de map met je budgetgegevens',
    properties: ['openDirectory', 'createDirectory'] as Array<'openDirectory' | 'createDirectory'>
  }
  const parent = BrowserWindow.getFocusedWindow()
  const result = parent
    ? await dialog.showOpenDialog(parent, options)
    : await dialog.showOpenDialog(options)
  return result.canceled ? null : result.filePaths[0]
}
