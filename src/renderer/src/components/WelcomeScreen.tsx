// First-start screen asking the user to pick the data folder.
type WelcomeScreenProps = {
  onChooseDataDir: () => void
}

export function WelcomeScreen({ onChooseDataDir }: WelcomeScreenProps): React.JSX.Element {
  return (
    <main className="centered">
      <h1>Welkom bij Gezinsbudget</h1>
      <p>Kies de map waar je budgetgegevens staan of bewaard worden.</p>
      <button onClick={onChooseDataDir}>Map kiezen</button>
    </main>
  )
}
