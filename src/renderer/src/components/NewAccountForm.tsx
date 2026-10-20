// Small form to add an own account with a validated IBAN and a name.
import { useState } from 'react'
import { isValidIban, normalizeIban } from '@shared/iban'
import type { Account } from '@shared/types'

type NewAccountFormProps = {
  existing: Account[]
  onAdd: (account: Account) => void
}

export function NewAccountForm({ existing, onAdd }: NewAccountFormProps): React.JSX.Element {
  const [iban, setIban] = useState('')
  const [name, setName] = useState('')

  const normalized = normalizeIban(iban)
  const isDuplicate = existing.some((account) => account.iban === normalized)
  const showInvalid = normalized !== '' && !isValidIban(normalized)
  const canAdd = isValidIban(normalized) && !isDuplicate && name.trim() !== ''

  const add = (): void => {
    onAdd({ iban: normalized, name: name.trim() })
    setIban('')
    setName('')
  }

  return (
    <div>
      <div className="newCategory">
        <input
          type="text"
          placeholder="IBAN, bv. BE68 5390 0754 7034"
          value={iban}
          onChange={(event) => setIban(event.target.value)}
        />
        <input
          type="text"
          placeholder="Naam, bv. Zichtrekening"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <button disabled={!canAdd} onClick={add}>
          Toevoegen
        </button>
      </div>
      {showInvalid && <p className="errorText">Dit IBAN-nummer is niet geldig.</p>}
      {isDuplicate && <p className="errorText">Deze rekening staat al in de lijst.</p>}
    </div>
  )
}
