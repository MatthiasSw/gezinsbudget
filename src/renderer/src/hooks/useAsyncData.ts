// Loads data through an async function and reloads it when the function changes or on demand.
import { useCallback, useEffect, useState } from 'react'

export type AsyncState<T> =
  { status: 'loading' } | { status: 'ready'; data: T } | { status: 'error'; error: unknown }

export function useAsyncData<T>(
  load: () => Promise<T>,
  refreshKey = 0
): {
  state: AsyncState<T>
  reload: () => void
} {
  const [state, setState] = useState<AsyncState<T>>({ status: 'loading' })
  const [reloadCount, setReloadCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    load().then(
      (data) => {
        if (!cancelled) setState({ status: 'ready', data })
      },
      (error) => {
        if (!cancelled) setState({ status: 'error', error })
      }
    )
    return () => {
      cancelled = true
    }
  }, [load, reloadCount, refreshKey])

  const reload = useCallback(() => setReloadCount((count) => count + 1), [])
  return { state, reload }
}
