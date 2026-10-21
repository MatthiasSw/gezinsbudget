// Shows the native folder picker and returns the chosen path, or null when cancelled.
import { showOpenDialog } from './nativeDialogs'

export async function chooseDirectory(): Promise<string | null> {
  const result = await showOpenDialog({
    title: 'Kies de map met je budgetgegevens',
    properties: ['openDirectory', 'createDirectory']
  })
  return result.canceled ? null : result.filePaths[0]
}
