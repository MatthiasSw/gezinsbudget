// Root component: decides which screen to show based on the config state.
import { ErrorScreen } from './components/ErrorScreen'
import { MainScreen } from './components/MainScreen'
import { WelcomeScreen } from './components/WelcomeScreen'
import { useConfig } from './hooks/useConfig'

export function App(): React.JSX.Element {
  const { state, reload, chooseDataDir } = useConfig()

  if (state.status === 'loading') return <p className="centered">Laden…</p>
  if (state.status === 'error') return <ErrorScreen error={state.error} onRetry={reload} />
  if (state.config.dataDir === null) return <WelcomeScreen onChooseDataDir={chooseDataDir} />
  return (
    <MainScreen key={state.config.dataDir} config={state.config} onChooseDataDir={chooseDataDir} />
  )
}
