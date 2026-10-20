// Shows the native save dialog for an export and writes the chosen file.
import { app, BrowserWindow, dialog } from 'electron'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { AppError } from '@shared/errors'

export async function saveExportFile(suggestedName: string, content: string): Promise<boolean> {
  const options = {
    title: 'Transacties exporteren',
    defaultPath: join(app.getPath('documents'), suggestedName),
    filters: [{ name: 'CSV-bestanden', extensions: ['csv'] }]
  }
  const parent = BrowserWindow.getFocusedWindow()
  const result = parent
    ? await dialog.showSaveDialog(parent, options)
    : await dialog.showSaveDialog(options)
  if (result.canceled || !result.filePath) return false

  try {
    await writeFile(result.filePath, content, 'utf8')
  } catch {
    throw new AppError('WRITE_FAILED', 'The export file could not be written')
  }
  return true
}
