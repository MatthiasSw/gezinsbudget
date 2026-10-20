// Shows what an import would add, so the user can confirm or cancel.
import { formatBelgianDate } from '@shared/dates'
import type { ImportPreview } from '@shared/importTypes'
import { formatCents } from '@shared/money'

type ImportPreviewViewProps = {
  preview: ImportPreview
  onConfirm: () => void
  onCancel: () => void
}

export function ImportPreviewView({
  preview,
  onConfirm,
  onCancel
}: ImportPreviewViewProps): React.JSX.Element {
  return (
    <section>
      <h2>Importvoorbeeld</h2>
      <dl className="facts">
        <dt>Bestand</dt>
        <dd>{preview.fileName}</dd>
        <dt>Formaat</dt>
        <dd>
          {preview.profileLabel} ({preview.encoding})
        </dd>
        <dt>Periode</dt>
        <dd>
          {formatBelgianDate(preview.periodFrom)} – {formatBelgianDate(preview.periodTo)}
        </dd>
        <dt>Nieuwe transacties</dt>
        <dd>{preview.newCount}</dd>
        <dt>Reeds aanwezig</dt>
        <dd>{preview.duplicateCount}</dd>
        <dt>Inkomsten</dt>
        <dd>{formatCents(preview.incomeCents)}</dd>
        <dt>Uitgaven</dt>
        <dd>{formatCents(-preview.expenseCents)}</dd>
      </dl>

      {preview.newCount === 0 ? (
        <p className="muted">Er is niets nieuw in dit bestand.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Datum</th>
              <th>Tegenpartij</th>
              <th>Mededeling</th>
              <th className="amount">Bedrag</th>
            </tr>
          </thead>
          <tbody>
            {preview.previewRows.map((row) => (
              <tr key={row.id}>
                <td>{formatBelgianDate(row.bookingDate)}</td>
                <td>{row.counterpartyName}</td>
                <td>{row.message}</td>
                <td className="amount">{formatCents(row.amountCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {preview.newCount > preview.previewRows.length && (
        <p className="muted">
          De eerste {preview.previewRows.length} van {preview.newCount} nieuwe transacties.
        </p>
      )}

      <div className="actions">
        <button onClick={onConfirm} disabled={preview.newCount === 0}>
          Importeren
        </button>
        <button className="secondary" onClick={onCancel}>
          Annuleren
        </button>
      </div>
    </section>
  )
}
