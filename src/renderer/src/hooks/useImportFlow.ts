// Drives the import flow: pick a file, resolve unknown accounts, preview, confirm.
import { useCallback, useState } from 'react'
import type { ImportPickResult, ImportPreview, ImportResult } from '@shared/importTypes'
import { api } from '../api'

export type ImportFlowState =
  | { step: 'idle' }
  | { step: 'busy' }
  | { step: 'unknownAccounts'; token: string; ibans: string[] }
  | { step: 'preview'; preview: ImportPreview }
  | { step: 'done'; result: ImportResult }
  | { step: 'error'; error: unknown }

export type NewAccount = { iban: string; name: string }

export type ImportFlow = {
  state: ImportFlowState
  start: () => Promise<void>
  addAccounts: (token: string, accounts: NewAccount[]) => Promise<void>
  confirm: (token: string) => Promise<void>
  cancel: (token?: string) => Promise<void>
  close: () => void
}

function stateFromPick(result: ImportPickResult | null): ImportFlowState {
  if (result === null) return { step: 'idle' }
  if (result.kind === 'preview') return { step: 'preview', preview: result.preview }
  return { step: 'unknownAccounts', token: result.token, ibans: result.ibans }
}

export function useImportFlow(onImported: () => void): ImportFlow {
  const [state, setState] = useState<ImportFlowState>({ step: 'idle' })

  const run = useCallback(async (action: () => Promise<ImportFlowState>) => {
    setState({ step: 'busy' })
    try {
      setState(await action())
    } catch (error) {
      setState({ step: 'error', error })
    }
  }, [])

  const start = useCallback(() => run(async () => stateFromPick(await api.import.pick())), [run])

  const addAccounts = useCallback(
    (token: string, accounts: NewAccount[]) =>
      run(async () => {
        const settings = await api.settings.get()
        await api.settings.saveAccounts([...settings.accounts, ...accounts])
        return stateFromPick(await api.import.resume(token))
      }),
    [run]
  )

  const confirm = useCallback(
    (token: string) =>
      run(async () => {
        const result = await api.import.confirm(token)
        onImported()
        return { step: 'done', result }
      }),
    [run, onImported]
  )

  const cancel = useCallback(async (token?: string) => {
    if (token) await api.import.cancel(token).catch(() => undefined)
    setState({ step: 'idle' })
  }, [])

  const close = useCallback(() => setState({ step: 'idle' }), [])

  return { state, start, addAccounts, confirm, cancel, close }
}
