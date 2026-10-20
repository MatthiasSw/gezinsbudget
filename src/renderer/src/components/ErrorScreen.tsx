// Full-screen error message with a retry button.
import { describeError } from '../errorMessages'

type ErrorScreenProps = {
  error: unknown
  onRetry: () => void
}

export function ErrorScreen({ error, onRetry }: ErrorScreenProps): React.JSX.Element {
  return (
    <main className="centered">
      <h1>Er ging iets mis</h1>
      <p>{describeError(error)}</p>
      <button onClick={onRetry}>Opnieuw proberen</button>
    </main>
  )
}
