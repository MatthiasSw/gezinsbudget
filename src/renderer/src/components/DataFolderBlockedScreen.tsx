// Full-screen message when the data folder is unreachable or locked by a writer on another pc.
import type { AppError } from '@shared/errors'

type DataFolderBlockedScreenProps = {
  error: AppError
  dataDir: string | null
  onRetry: () => void
  onChooseDataDir: () => void
}

function lockHost(error: AppError): string | undefined {
  return (error.details as { host?: string } | undefined)?.host
}

export function DataFolderBlockedScreen({
  error,
  dataDir,
  onRetry,
  onChooseDataDir
}: DataFolderBlockedScreenProps): React.JSX.Element {
  const isLocked = error.code === 'LOCKED_BY_OTHER'
  const host = lockHost(error)

  return (
    <main className="centered">
      <h1>{isLocked ? 'Gegevens in gebruik' : 'Gegevensmap niet bereikbaar'}</h1>
      {isLocked ? (
        <p>
          De gegevens worden al bewerkt{host ? ` op ${host}` : ' op een andere pc'}. Sluit het
          programma daar af en probeer het dan opnieuw.
        </p>
      ) : (
        <p>
          De gegevensmap is niet bereikbaar ({dataDir}). Controleer of de map nog bestaat en of de
          schijf of netwerkverbinding beschikbaar is.
        </p>
      )}
      <div className="actions">
        <button onClick={onRetry}>Opnieuw proberen</button>
        <button className="secondary" onClick={onChooseDataDir}>
          Andere map kiezen
        </button>
      </div>
    </main>
  )
}
