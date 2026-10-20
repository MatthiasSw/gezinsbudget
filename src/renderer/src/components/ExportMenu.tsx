// Actions menu that saves the currently filtered transactions as a CSV file, with the result next to it.
import { useState } from 'react'
import type { TransactionQuery } from '@shared/transactionQuery'
import { api } from '../api'
import { describeError } from '../errorMessages'
import { useTransientMessage } from '../hooks/useTransientMessage'
import { MoreMenu } from './MoreMenu'

type ExportMenuProps = {
  query: TransactionQuery
  count: number
}

export function ExportMenu({ query, count }: ExportMenuProps): React.JSX.Element {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(undefined)
  const [message, showMessage] = useTransientMessage()

  const exportRows = async (): Promise<void> => {
    setBusy(true)
    setError(undefined)
    try {
      const result = await api.transactions.export(query)
      if (result) {
        showMessage(
          `${result.rowCount} ${result.rowCount === 1 ? 'transactie' : 'transacties'} geëxporteerd`
        )
      }
    } catch (failure) {
      setError(failure)
    } finally {
      setBusy(false)
    }
  }

  return (
    <span className="inlineActions">
      {message && <span className="muted">{message}</span>}
      {error !== undefined && <span className="errorText">{describeError(error)}</span>}
      <MoreMenu
        items={[
          {
            label: 'Exporteren naar CSV',
            disabled: busy || count === 0,
            onSelect: exportRows
          }
        ]}
      />
    </span>
  )
}
