// Entry point of the import feature: shows the right step of the import flow.
import { describeError, describeErrorDetails } from '../errorMessages'
import { useImportFlow } from '../hooks/useImportFlow'
import { ImportIcon } from './icons'
import { ImportPreviewView } from './ImportPreviewView'
import { Modal } from './Modal'
import { UnknownAccountsForm } from './UnknownAccountsForm'

function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`
}

type ImportPanelProps = {
  onImported: () => void
}

export function ImportPanel({ onImported }: ImportPanelProps): React.JSX.Element {
  const { state, start, addAccounts, confirm, cancel, close } = useImportFlow(onImported)

  switch (state.step) {
    case 'idle':
      return (
        <button className="onBar" onClick={start}>
          <ImportIcon />
          Bankbestand importeren
        </button>
      )
    case 'busy':
      return (
        <Modal>
          <p className="muted">Bezig…</p>
        </Modal>
      )
    case 'unknownAccounts':
      return (
        <Modal>
          <UnknownAccountsForm
            ibans={state.ibans}
            onSubmit={(accounts) => addAccounts(state.token, accounts)}
            onCancel={() => cancel(state.token)}
          />
        </Modal>
      )
    case 'preview':
      return (
        <Modal>
          <ImportPreviewView
            preview={state.preview}
            onConfirm={() => confirm(state.preview.token)}
            onCancel={() => cancel(state.preview.token)}
          />
        </Modal>
      )
    case 'done':
      return (
        <Modal>
          <section>
            <h2>Import klaar</h2>
            <p>
              {pluralize(state.result.addedCount, 'transactie', 'transacties')} toegevoegd,{' '}
              {pluralize(state.result.duplicateCount, 'dubbel', 'dubbels')} overgeslagen.
            </p>
            <button onClick={close}>Sluiten</button>
          </section>
        </Modal>
      )
    case 'error':
      return (
        <Modal>
          <section>
            <h2>Import mislukt</h2>
            <p>{describeError(state.error)}</p>
            <p className="muted">{describeErrorDetails(state.error)}</p>
            <button onClick={close}>Sluiten</button>
          </section>
        </Modal>
      )
  }
}
