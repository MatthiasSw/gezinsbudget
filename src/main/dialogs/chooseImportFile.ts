// Shows the native file picker for bank exports and reads the chosen file.
import { BrowserWindow, dialog } from 'electron'
import { readFile } from 'fs/promises'
import { basename } from 'path'
import type { PickedFile } from '../services/importService'

export async function chooseImportFile(): Promise<PickedFile | null> {
  const options = {
    title: 'Kies een bankbestand',
    properties: ['openFile'] as Array<'openFile'>,
    filters: [
      { name: 'CSV-bestanden', extensions: ['csv'] },
      { name: 'Alle bestanden', extensions: ['*'] }
    ]
  }
  const parent = BrowserWindow.getFocusedWindow()
  const result = parent
    ? await dialog.showOpenDialog(parent, options)
    : await dialog.showOpenDialog(options)
  if (result.canceled) return null

  const path = result.filePaths[0]
  return { name: basename(path), content: await readFile(path) }
}
