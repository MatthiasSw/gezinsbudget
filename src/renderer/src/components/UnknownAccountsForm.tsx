// Asks the user to register unknown account numbers as their own accounts.
import { useState } from 'react'
import type { NewAccount } from '../hooks/useImportFlow'

type UnknownAccountsFormProps = {
  ibans: string[]
  onSubmit: (accounts: NewAccount[]) => void
  onCancel: () => void
}

export function UnknownAccountsForm({
  ibans,
  onSubmit,
  onCancel
}: UnknownAccountsFormProps): React.JSX.Element {
  const [names, setNames] = useState<Record<string, string>>({})
  const allNamed = ibans.every((iban) => (names[iban] ?? '').trim() !== '')

  return (
    <section>
      <h2>Onbekende rekening</h2>
      <p>Deze rekening(en) zijn nog niet gekend. Toevoegen als eigen rekening?</p>
      {ibans.map((iban) => (
        <label key={iban} className="field">
          <span>{iban}</span>
          <input
            type="text"
            placeholder="Naam, bv. Zichtrekening"
            value={names[iban] ?? ''}
            onChange={(event) => setNames({ ...names, [iban]: event.target.value })}
          />
        </label>
      ))}
      <div className="actions">
        <button
          disabled={!allNamed}
          onClick={() => onSubmit(ibans.map((iban) => ({ iban, name: names[iban].trim() })))}
        >
          Toevoegen en verdergaan
        </button>
        <button className="secondary" onClick={onCancel}>
          Annuleren
        </button>
      </div>
    </section>
  )
}
