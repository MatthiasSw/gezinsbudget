// Checks the data folder on start and when the window regains focus; there is no background polling.
import { useCallback, useEffect, useRef, useState } from 'react'
import { AppError } from '@shared/errors'
import { api } from '../api'

const blockingCodes = ['DATA_DIR_UNAVAILABLE', 'LOCKED_BY_OTHER']

export type FolderStatus = { kind: 'ok' } | { kind: 'blocked'; error: AppError }

type Probe = FolderStatus | { kind: 'ignored' }

async function probeFolder(): Promise<Probe> {
  try {
    await api.data.version()
    return { kind: 'ok' }
  } catch (error) {
    if (error instanceof AppError && blockingCodes.includes(error.code)) {
      return { kind: 'blocked', error }
    }
    return { kind: 'ignored' }
  }
}

export function useDataFolderStatus(onRecovered: () => void): {
  status: FolderStatus
  checkNow: () => Promise<void>
} {
  const [status, setStatus] = useState<FolderStatus>({ kind: 'ok' })
  const wasBlocked = useRef(false)

  const apply = useCallback(
    (probe: Probe) => {
      if (probe.kind === 'ignored') return
      setStatus(probe)
      if (probe.kind === 'blocked') {
        wasBlocked.current = true
        return
      }
      if (wasBlocked.current) onRecovered()
      wasBlocked.current = false
    },
    [onRecovered]
  )

  const checkNow = useCallback(() => probeFolder().then(apply), [apply])

  useEffect(() => {
    const check = (): void => {
      probeFolder().then(apply)
    }
    check()
    window.addEventListener('focus', check)
    return () => window.removeEventListener('focus', check)
  }, [apply])

  return { status, checkNow }
}
