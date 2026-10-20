// Save and undo buttons with a line that says what happened to the latest changes.
import { describeError } from '../errorMessages'
import type { SaveStatus } from '../hooks/useDraftSave'

type SaveBarProps = {
  status: SaveStatus
  hasUnsavedChanges: boolean
  onSave: () => void
  onDiscard: () => void
}

export function SaveBar({
  status,
  hasUnsavedChanges,
  onSave,
  onDiscard
}: SaveBarProps): React.JSX.Element {
  return (
    <>
      <div className="actions">
        <button disabled={!hasUnsavedChanges || status.kind === 'saving'} onClick={onSave}>
          Opslaan
        </button>
        <button className="secondary" disabled={!hasUnsavedChanges} onClick={onDiscard}>
          Wijzigingen ongedaan maken
        </button>
      </div>
      <SaveMessage status={status} hasUnsavedChanges={hasUnsavedChanges} />
    </>
  )
}

function SaveMessage({
  status,
  hasUnsavedChanges
}: Pick<SaveBarProps, 'status' | 'hasUnsavedChanges'>): React.JSX.Element | null {
  if (status.kind === 'error') {
    return <p className="errorText saveNotice">Niet opgeslagen. {describeError(status.error)}</p>
  }
  if (status.kind === 'incomplete') {
    return <p className="errorText saveNotice">Nog niet opgeslagen: {status.message}.</p>
  }
  if (status.kind === 'saving') return <p className="muted saveNotice">Opslaan…</p>
  if (hasUnsavedChanges) {
    return <p className="muted saveNotice">Er zijn niet-opgeslagen wijzigingen.</p>
  }
  if (status.kind === 'saved') return <p className="muted saveNotice">Opgeslagen ✓</p>
  return null
}
