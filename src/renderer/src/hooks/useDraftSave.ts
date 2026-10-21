// Keeps an editable value as a draft until the user saves it or throws the changes away.
import { useCallback, useRef, useState } from 'react'

export type SaveStatus =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'saved' }
  | { kind: 'incomplete'; message: string }
  | { kind: 'error'; error: unknown }

type DraftSaveOptions<T> = {
  stored: T
  save: (value: T) => Promise<T>
  validate?: (value: T) => string | null
  onSaved?: () => void
}

export function useDraftSave<T>({ stored, save, validate, onSaved }: DraftSaveOptions<T>): {
  value: T
  change: (next: T) => void
  saveDraft: () => Promise<void>
  discard: () => void
  status: SaveStatus
  hasUnsavedChanges: boolean
} {
  const [draft, setDraft] = useState<T | null>(null)
  // What the last save returned, remembered with the stored value it replaced: once the parent
  // loads a newer stored value, that one wins, so data changed elsewhere is never hidden.
  const [saved, setSaved] = useState<{ value: T; replaced: T } | null>(null)
  const [status, setStatus] = useState<SaveStatus>({ kind: 'idle' })
  const draftRef = useRef<T | null>(null)

  const change = useCallback((next: T) => {
    draftRef.current = next
    setDraft(next)
    setStatus({ kind: 'idle' })
  }, [])

  const discard = useCallback(() => {
    draftRef.current = null
    setDraft(null)
    setStatus({ kind: 'idle' })
  }, [])

  const saveDraft = useCallback(async (): Promise<void> => {
    const pending = draftRef.current
    if (pending === null) return

    const problem = validate?.(pending) ?? null
    if (problem !== null) {
      setStatus({ kind: 'incomplete', message: problem })
      return
    }

    setStatus({ kind: 'saving' })
    try {
      const persisted = await save(pending)
      setSaved({ value: persisted, replaced: stored })
      if (draftRef.current === pending) {
        draftRef.current = null
        setDraft(null)
      }
      setStatus({ kind: 'saved' })
      onSaved?.()
    } catch (error) {
      setStatus({ kind: 'error', error })
    }
  }, [stored, save, validate, onSaved])

  const latestSaved = saved !== null && saved.replaced === stored ? saved.value : stored

  return {
    value: draft ?? latestSaved,
    change,
    saveDraft,
    discard,
    status,
    hasUnsavedChanges: draft !== null
  }
}
