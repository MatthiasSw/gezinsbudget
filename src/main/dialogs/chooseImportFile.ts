// Shows the native file picker for bank exports and reads the chosen file.
import { readFile } from 'fs/promises'
import { basename } from 'path'
import type { PickedFile } from '../services/importService'
import { showOpenDialog } from './nativeDialogs'

export async function chooseImportFile(): Promise<PickedFile | null> {
  const result = await showOpenDialog({
    title: 'Kies een bankbestand',
    properties: ['openFile'],
    filters: [
      { name: 'CSV-bestanden', extensions: ['csv'] },
      { name: 'Alle bestanden', extensions: ['*'] }
    ]
  })
  if (result.canceled) return null

  const path = result.filePaths[0]
  return { name: basename(path), content: await readFile(path) }
}
