// Small confirmation dialog for actions that cannot be undone.
import { Modal } from './Modal'

type ConfirmDialogProps = {
  title: string
  message: React.ReactNode
  confirmLabel: string
  tone?: 'danger' | 'primary'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  tone = 'danger',
  onConfirm,
  onCancel
}: ConfirmDialogProps): React.JSX.Element {
  return (
    <Modal size="small">
      <h2>{title}</h2>
      <div>{message}</div>
      <div className="actions">
        <button className={tone === 'danger' ? 'danger' : undefined} onClick={onConfirm}>
          {confirmLabel}
        </button>
        <button className="secondary" onClick={onCancel}>
          Annuleren
        </button>
      </div>
    </Modal>
  )
}
