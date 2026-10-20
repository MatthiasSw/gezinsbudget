// A text box with a list of matching options below it; the user types a part of a name and picks one.
import { useId, useState } from 'react'
import { filterOptions, type SearchOption } from '../optionFilter'

type SearchableSelectProps = {
  options: SearchOption[]
  placeholder: string
  disabled?: boolean
  onPick: (id: string) => void
}

export function SearchableSelect({
  options,
  placeholder,
  disabled = false,
  onPick
}: SearchableSelectProps): React.JSX.Element {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const listId = useId()

  const matches = filterOptions(options, query)
  const current = Math.min(highlighted, Math.max(0, matches.length - 1))

  const pick = (option: SearchOption): void => {
    onPick(option.id)
    setQuery('')
    setOpen(false)
    setHighlighted(0)
  }

  const handleKey = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setHighlighted(Math.min(current + 1, matches.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlighted(Math.max(current - 1, 0))
    } else if (event.key === 'Enter' && open && matches[current]) {
      event.preventDefault()
      pick(matches[current])
    } else if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <span className="searchSelect">
      <input
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        placeholder={placeholder}
        disabled={disabled}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
          setOpen(true)
          setHighlighted(0)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={handleKey}
      />
      {open && !disabled && (
        <ul className="searchList" id={listId} role="listbox">
          {matches.length === 0 && <li className="searchEmpty muted">Geen resultaten</li>}
          {matches.map((option, index) => (
            <li
              key={option.id}
              role="option"
              aria-selected={index === current}
              className={index === current ? 'searchOption highlighted' : 'searchOption'}
              onMouseDown={(event) => {
                event.preventDefault()
                pick(option)
              }}
              onMouseEnter={() => setHighlighted(index)}
            >
              {option.label}
              {option.hint && <span className="muted"> · {option.hint}</span>}
            </li>
          ))}
        </ul>
      )}
    </span>
  )
}
