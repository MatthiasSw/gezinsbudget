// Holds a message that clears itself after a few seconds.
import { useCallback, useEffect, useState } from 'react'

const defaultDurationMs = 5000

export function useTransientMessage(
  durationMs = defaultDurationMs
): [string | null, (message: string) => void] {
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (message === null) return
    const timer = setTimeout(() => setMessage(null), durationMs)
    return () => clearTimeout(timer)
  }, [message, durationMs])

  const show = useCallback((next: string) => setMessage(next), [])
  return [message, show]
}
