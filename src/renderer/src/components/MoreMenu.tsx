// A small "more actions" button that opens a menu with a few commands.
import { useCallback, useRef, useState } from 'react'
import { useDismiss } from '../hooks/useDismiss'

export type MoreMenuItem = {
  label: string
  disabled?: boolean
  onSelect: () => void
}

type MoreMenuProps = {
  items: MoreMenuItem[]
}

export function MoreMenu({ items }: MoreMenuProps): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const container = useRef<HTMLSpanElement>(null)
  const close = useCallback(() => setOpen(false), [])
  useDismiss(container, open, close)

  return (
    <span className="moreMenu" ref={container}>
      <button
        className="secondary compact moreButton"
        aria-label="Meer acties"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        ⋯
      </button>
      {open && (
        <div className="menuList" role="menu">
          {items.map((item) => (
            <button
              key={item.label}
              className="menuItem"
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                setOpen(false)
                item.onSelect()
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </span>
  )
}
