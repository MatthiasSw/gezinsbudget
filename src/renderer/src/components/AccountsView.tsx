// Own accounts manager: add, rename and remove accounts; changes save themselves.
import { useState } from 'react'
import { formatIban } from '@shared/iban'
import type { Account } from '@shared/types'
import { api } from '../api'
import { describeError } from '../errorMessages'
import { useAsyncData } from '../hooks/useAsyncData'
import { useDraftSave } from '../hooks/useDraftSave'
import { InfoTip } from './InfoTip'
import { SaveBar } from './SaveBar'
import { NewAccountForm } from './NewAccountForm'

const accountsInfo =
  'Vul hier al je eigen rekeningen in. Zo herkent Gezinsbudget geld dat je tussen die rekeningen verplaatst, bijvoorbeeld van je zichtrekening naar je spaarrekening, als interne overboeking. Dat is geen inkomst of uitgave en telt dus niet mee in je totalen.'

type AccountsEditorProps = {
  stored: Account[]
}

function pluralize(count: number): string {
  return `${count} ${count === 1 ? 'transactie' : 'transacties'}`
}

function missingNameMessage(accounts: Account[]): string | null {
  return accounts.some((account) => account.name.trim() === '')
    ? 'geef elke rekening een naam'
    : null
}

export function AccountsView(): React.JSX.Element {
  const settings = useAsyncData(api.settings.get)

  if (settings.state.status === 'error') {
    return <p className="errorText">{describeError(settings.state.error)}</p>
  }
  if (settings.state.status === 'loading') return <p className="muted">Laden…</p>
  return <AccountsEditor stored={settings.state.data.accounts} />
}

function AccountsEditor({ stored }: AccountsEditorProps): React.JSX.Element {
  const [changedTransactions, setChangedTransactions] = useState<number | undefined>(undefined)
  const {
    value: accounts,
    change,
    saveDraft,
    discard,
    status,
    hasUnsavedChanges
  } = useDraftSave({
    stored,
    save: async (next) => {
      const result = await api.settings.saveAccounts(next)
      setChangedTransactions(result.changedTransactions)
      return result.settings.accounts
    },
    validate: missingNameMessage
  })

  const rename = (iban: string, name: string): void =>
    change(accounts.map((account) => (account.iban === iban ? { ...account, name } : account)))
  const remove = (iban: string): void => change(accounts.filter((account) => account.iban !== iban))

  return (
    <section>
      <h2>
        Eigen rekeningen <InfoTip text={accountsInfo} />
      </h2>

      <NewAccountForm existing={accounts} onAdd={(added) => change([...accounts, added])} />

      {accounts.length === 0 && <p className="muted">Er zijn nog geen rekeningen.</p>}
      {accounts.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>IBAN</th>
              <th>Naam</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((account) => (
              <tr key={account.iban}>
                <td className="nowrap">{formatIban(account.iban)}</td>
                <td>
                  <input
                    type="text"
                    value={account.name}
                    onChange={(event) => rename(account.iban, event.target.value)}
                  />
                </td>
                <td>
                  <button className="secondary compact" onClick={() => remove(account.iban)}>
                    Verwijderen
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <SaveBar
        status={status}
        hasUnsavedChanges={hasUnsavedChanges}
        onSave={saveDraft}
        onDiscard={discard}
      />
      {changedTransactions !== undefined && status.kind === 'saved' && changedTransactions > 0 && (
        <p className="muted">
          {pluralize(changedTransactions)} opnieuw ingedeeld als interne overboeking of gewone
          transactie.
        </p>
      )}
    </section>
  )
}
