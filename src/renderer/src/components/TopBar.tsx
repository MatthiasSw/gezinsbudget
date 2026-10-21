// Top bar with the app name, the back button and the import entry point.
import { ImportPanel } from './ImportPanel'

type TopBarProps = {
  canGoBack: boolean
  onBack: () => void
  onImported: () => void
}

export function TopBar({ canGoBack, onBack, onImported }: TopBarProps): React.JSX.Element {
  return (
    <header className="topBar">
      <span className="logo">€</span>
      <span className="brand">Gezinsbudget</span>
      <button
        className="onBar"
        disabled={!canGoBack}
        title="Terug naar de vorige pagina"
        onClick={onBack}
      >
        ← Terug
      </button>
      <span className="topBarSpacer" />
      <ImportPanel onImported={onImported} />
    </header>
  )
}
