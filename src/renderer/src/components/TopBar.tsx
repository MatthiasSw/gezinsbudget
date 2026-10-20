// Top bar with the app name and the import entry point.
import { ImportPanel } from './ImportPanel'

type TopBarProps = {
  onImported: () => void
}

export function TopBar({ onImported }: TopBarProps): React.JSX.Element {
  return (
    <header className="topBar">
      <span className="logo">€</span>
      <span className="brand">Gezinsbudget</span>
      <span className="topBarSpacer" />
      <ImportPanel onImported={onImported} />
    </header>
  )
}
