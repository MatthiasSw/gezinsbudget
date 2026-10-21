// Knows how many transactions the saved rules would change and applies them on request.
import { useCallback, useEffect, useState } from 'react'
import { api } from '../api'
import { transactionCount } from '../plural'
import { useTransientMessage } from './useTransientMessage'

export function useRuleReapply(refreshKey: number): {
  pendingCount: number | null
  busy: boolean
  message: string | null
  error: unknown
  apply: () => Promise<void>
} {
  const [pendingCount, setPendingCount] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, showMessage] = useTransientMessage()
  const [error, setError] = useState<unknown>(undefined)

  useEffect(() => {
    let cancelled = false
    api.rules.reapply({ dryRun: true }).then(
      (result) => {
        if (!cancelled) setPendingCount(result.changedCount)
      },
      () => {
        if (!cancelled) setPendingCount(null)
      }
    )
    return () => {
      cancelled = true
    }
  }, [refreshKey])

  const apply = useCallback(async () => {
    setBusy(true)
    setError(undefined)
    try {
      const { changedCount } = await api.rules.reapply({ dryRun: false })
      setPendingCount(0)
      showMessage(`${transactionCount(changedCount)} bijgewerkt.`)
    } catch (caught) {
      setError(caught)
    } finally {
      setBusy(false)
    }
  }, [showMessage])

  return { pendingCount, busy, message, error, apply }
}
