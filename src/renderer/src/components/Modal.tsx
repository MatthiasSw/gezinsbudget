// Centered dialog with a dimmed backdrop; closing is left to the buttons inside.
type ModalProps = {
  size?: 'normal' | 'small'
  children: React.ReactNode
}

export function Modal({ size = 'normal', children }: ModalProps): React.JSX.Element {
  return (
    <div className="modalBackdrop">
      <div className={size === 'small' ? 'modal small' : 'modal'} role="dialog" aria-modal="true">
        {children}
      </div>
    </div>
  )
}
