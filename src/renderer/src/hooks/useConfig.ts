// Loads the local config and exposes actions that change it.
import { useCallback, useEffect, useState } from 'react'
import type { LocalConfig } from '@shared/types'
import { api } from '../api'

type ConfigState =
  | { status: 'loading' }
  | { status: 'ready'; config: LocalConfig }
  | { status: 'error'; error: unknown }

async function loadConfigState(): Promise<ConfigState> {
  try {
    return { status: 'ready', config: await api.config.get() }
  } catch (error) {
    return { status: 'error', error }
  }
}

export function useConfig(): {
  state: ConfigState
  reload: () => void
  chooseDataDir: () => Promise<void>
} {
  const [state, setState] = useState<ConfigState>({ status: 'loading' })

  const reload = useCallback(() => {
    setState({ status: 'loading' })
    loadConfigState().then(setState)
  }, [])

  const chooseDataDir = useCallback(async () => {
    try {
      const config = await api.config.chooseDataDir()
      if (config) setState({ status: 'ready', config })
    } catch (error) {
      setState({ status: 'error', error })
    }
  }, [])

  useEffect(() => {
    loadConfigState().then(setState)
  }, [])

  return { state, reload, chooseDataDir }
}
