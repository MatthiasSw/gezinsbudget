// Opens the native file dialogs on top of the focused window, or on their own when no window has focus.
import {
  BrowserWindow,
  dialog,
  type OpenDialogOptions,
  type OpenDialogReturnValue,
  type SaveDialogOptions,
  type SaveDialogReturnValue
} from 'electron'

export function showOpenDialog(options: OpenDialogOptions): Promise<OpenDialogReturnValue> {
  const parent = BrowserWindow.getFocusedWindow()
  return parent ? dialog.showOpenDialog(parent, options) : dialog.showOpenDialog(options)
}

export function showSaveDialog(options: SaveDialogOptions): Promise<SaveDialogReturnValue> {
  const parent = BrowserWindow.getFocusedWindow()
  return parent ? dialog.showSaveDialog(parent, options) : dialog.showSaveDialog(options)
}
