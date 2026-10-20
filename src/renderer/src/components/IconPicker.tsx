// Button showing a category icon; opens a grid of icons that closes on a choice, Escape or an outside click.
import { useEffect, useRef } from 'react'
import { iconChoices } from '@shared/categoryIcons'

type IconPickerProps = {
  icon: string
  onChange: (icon: string) => void
}

export function IconPicker({ icon, onChange }: IconPickerProps): React.JSX.Element {
  const menu = useRef<HTMLDetailsElement>(null)

  const close = (): void => {
    if (menu.current) menu.current.open = false
  }

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent): void => {
      if (menu.current && !menu.current.contains(event.target as Node)) close()
    }
    const closeOnEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') close()
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [])

  const choose = (next: string): void => {
    onChange(next)
    close()
  }

  return (
    <details ref={menu} className="iconPicker">
      <summary className="iconButton" title="Icoon kiezen">
        {icon === '' ? '＋' : icon}
      </summary>
      <div className="iconGrid">
        {iconChoices.map((choice) => (
          <button key={choice} className="iconChoice" type="button" onClick={() => choose(choice)}>
            {choice}
          </button>
        ))}
        <button className="secondary iconNone" type="button" onClick={() => choose('')}>
          Geen icoon
        </button>
      </div>
    </details>
  )
}
