// Empty state of the transaction list when nothing was imported yet, with the import button.
import { ImportPanel } from './ImportPanel'

type FirstImportPromptProps = {
  onImported: () => void
}

export function FirstImportPrompt({ onImported }: FirstImportPromptProps): React.JSX.Element {
  return (
    <section className="emptyState">
      <div className="emptyIcon" aria-hidden="true">
        €
      </div>
      <h2>Importeer je eerste banktransacties</h2>
      <p className="muted">
        Exporteer in Belfius de transacties van je rekening als CSV-bestand en importeer dat hier.
        Daarna kan je ze indelen in categorieën en overzichten bekijken.
      </p>
      <ImportPanel variant="primary" onImported={onImported} />
    </section>
  )
}
