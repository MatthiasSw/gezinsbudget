// Entry point of the import feature: shows the right step of the import flow.
import { describeError, describeErrorDetails } from '../errorMessages'
import { useImportFlow } from '../hooks/useImportFlow'
import { pluralize, transactionCount } from '../plural'
import { ImportIcon } from './icons'
import { ImportPreviewView } from './ImportPreviewView'
import { Modal } from './Modal'
import { UnknownAccountsForm } from './UnknownAccountsForm'

type ImportPanelProps = {
  onImported: () => void
  variant?: 'bar' | 'primary'
}

export function ImportPanel({ onImported, variant = 'bar' }: ImportPanelProps): React.JSX.Element {
  const { state, start, addAccounts, confirm, cancel, close } = useImportFlow(onImported)

  switch (state.step) {
    case 'idle':
      return (
        <button className={variant === 'bar' ? 'onBar' : undefined} onClick={start}>
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
              {transactionCount(state.result.addedCount)} toegevoegd,{' '}
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
