// Text cut off with an ellipsis that unfolds in full when clicked.
import { useState } from 'react'

type ExpandableTextProps = {
  text: string
}

export function ExpandableText({ text }: ExpandableTextProps): React.JSX.Element {
  const [expanded, setExpanded] = useState(false)
  const toggle = (): void => setExpanded(!expanded)

  return (
    <span
      className={expanded ? 'expandable expanded' : 'expandable'}
      role="button"
      tabIndex={0}
      title={expanded ? 'Klik om in te klappen' : 'Klik om uit te klappen'}
      onClick={toggle}
      onKeyDown={(event) => event.key === 'Enter' && toggle()}
    >
      {text}
    </span>
  )
}
