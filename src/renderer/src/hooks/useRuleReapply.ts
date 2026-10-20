// Knows how many transactions the saved rules would change and applies them on request.
import { useCallback, useEffect, useState } from 'react'
import { api } from '../api'

const messageDurationMs = 5000

export function useRuleReapply(refreshKey: number): {
  pendingCount: number | null
  busy: boolean
  message: string | null
  error: unknown
  apply: () => Promise<void>
} {
  const [pendingCount, setPendingCount] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
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

  useEffect(() => {
    if (message === null) return
    const timer = setTimeout(() => setMessage(null), messageDurationMs)
    return () => clearTimeout(timer)
  }, [message])

  const apply = useCallback(async () => {
    setBusy(true)
    setError(undefined)
    try {
      const { changedCount } = await api.rules.reapply({ dryRun: false })
      setPendingCount(0)
      setMessage(`${changedCount} ${changedCount === 1 ? 'transactie' : 'transacties'} bijgewerkt.`)
    } catch (caught) {
      setError(caught)
    } finally {
      setBusy(false)
    }
  }, [])

  return { pendingCount, busy, message, error, apply }
}
