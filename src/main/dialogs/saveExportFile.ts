// Shows the native save dialog for an export and writes the chosen file.
import { app } from 'electron'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { AppError } from '@shared/errors'
import { showSaveDialog } from './nativeDialogs'

export async function saveExportFile(suggestedName: string, content: string): Promise<boolean> {
  const result = await showSaveDialog({
    title: 'Transacties exporteren',
    defaultPath: join(app.getPath('documents'), suggestedName),
    filters: [{ name: 'CSV-bestanden', extensions: ['csv'] }]
  })
  if (result.canceled || !result.filePath) return false

  try {
    await writeFile(result.filePath, content, 'utf8')
  } catch {
    throw new AppError('WRITE_FAILED', 'The export file could not be written')
  }
  return true
}
