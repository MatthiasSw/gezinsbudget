// A small "more actions" button that opens a menu with a few commands.
import { useEffect, useRef, useState } from 'react'

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

  useEffect(() => {
    if (!open) return
    const closeOnOutsideClick = (event: MouseEvent): void => {
      if (!container.current?.contains(event.target as Node)) setOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

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
