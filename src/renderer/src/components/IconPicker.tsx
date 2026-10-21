// Button showing a category icon; opens a grid of icons that closes on a choice, Escape or an outside click.
import { useCallback, useRef, useState } from 'react'
import { iconChoices } from '@shared/categoryIcons'
import { useDismiss } from '../hooks/useDismiss'

type IconPickerProps = {
  icon: string
  onChange: (icon: string) => void
}

export function IconPicker({ icon, onChange }: IconPickerProps): React.JSX.Element {
  const menu = useRef<HTMLDetailsElement>(null)
  const [open, setOpen] = useState(false)

  const close = useCallback(() => {
    if (menu.current) menu.current.open = false
  }, [])
  useDismiss(menu, open, close)

  const choose = (next: string): void => {
    onChange(next)
    close()
  }

  // The grid is only rendered while open: the category list has one picker per row.
  return (
    <details
      ref={menu}
      className="iconPicker"
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary className="iconButton" title="Icoon kiezen">
        {icon === '' ? '＋' : icon}
      </summary>
      {open && (
        <div className="iconGrid">
          {iconChoices.map((choice) => (
            <button
              key={choice}
              className="iconChoice"
              type="button"
              onClick={() => choose(choice)}
            >
              {choice}
            </button>
          ))}
          <button className="secondary iconNone" type="button" onClick={() => choose('')}>
            Geen icoon
          </button>
        </div>
      )}
    </details>
  )
}
