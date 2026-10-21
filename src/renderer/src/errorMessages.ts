// Dutch user-facing messages for every error code, plus extra detail where it helps.
import { AppError, type ErrorCode } from '@shared/errors'

const messages: Record<ErrorCode, string> = {
  DATA_DIR_NOT_SET: 'Er is nog geen gegevensmap gekozen.',
  DATA_DIR_UNAVAILABLE:
    'De gegevensmap is niet bereikbaar. Controleer of de map nog bestaat en of de schijf of netwerkverbinding beschikbaar is.',
  WRITE_FAILED: 'Opslaan is mislukt. Probeer het opnieuw.',
  CORRUPT_FILE: 'Een gegevensbestand is beschadigd.',
  UNSUPPORTED_SCHEMA: 'Dit bestand is gemaakt met een nieuwere versie van de app.',
  IMPORT_FORMAT_UNKNOWN: 'Het formaat van dit bestand wordt niet herkend.',
  IMPORT_MISSING_COLUMNS: 'Het bestand mist verplichte kolommen.',
  IMPORT_PARSE_ERROR: 'Het bestand bevat regels die niet gelezen kunnen worden.',
  IMPORT_UNKNOWN_ACCOUNT: 'Dit bestand hoort bij een rekening die nog niet gekend is.',
  LOCKED_BY_OTHER: 'De gegevens worden al bewerkt op een andere pc.',
  INVALID_CATEGORIES:
    'De categorieën zijn ongeldig, bijvoorbeeld door een lege naam, een kringverwijzing of een subcategorie van een subcategorie.',
  INVALID_RULES:
    'De regels zijn ongeldig, bijvoorbeeld door een lege waarde, een onbekende categorie of een foute regex.',
  INVALID_ACCOUNTS:
    'Een rekening is ongeldig: controleer het IBAN-nummer en geef elke rekening een naam.',
  INVALID_BUDGETS:
    'Een budget is ongeldig: kies een uitgavencategorie, geef een bedrag groter dan nul en gebruik elke categorie maar één keer.',
  UNKNOWN: 'Er ging iets onverwacht mis.'
}

const incompleteImportMessage =
  'De import is onvolledig afgerond. Importeer hetzelfde bestand opnieuw: enkel wat nog ontbreekt wordt toegevoegd.'

export function describeError(error: unknown): string {
  if (error instanceof AppError && isIncompleteImport(error)) return incompleteImportMessage
  const code = error instanceof AppError ? error.code : 'UNKNOWN'
  return messages[code]
}

export function describeErrorDetails(error: unknown): string | undefined {
  if (!(error instanceof AppError)) return undefined
  if (error.code === 'IMPORT_MISSING_COLUMNS') return missingColumnsText(error.details)
  if (error.code === 'IMPORT_PARSE_ERROR') return problemLinesText(error.details)
  if (error.code === 'LOCKED_BY_OTHER') return hostText(error)
  return undefined
}

function isIncompleteImport(error: AppError): boolean {
  return (error.details as { incompleteImport?: boolean } | undefined)?.incompleteImport === true
}

function missingColumnsText(details: unknown): string | undefined {
  const missing = (details as { missing?: string[] } | undefined)?.missing
  return missing?.length ? `Ontbrekende kolommen: ${missing.join(', ')}` : undefined
}

function problemLinesText(details: unknown): string | undefined {
  const errors = (details as { errors?: { line: number }[] } | undefined)?.errors
  if (!errors?.length) return undefined
  return `Problemen op regel: ${errors.map((entry) => entry.line).join(', ')}`
}

// The pc that holds the writer lock, when the error says so.
export function lockHost(error: AppError): string | undefined {
  return (error.details as { host?: string } | undefined)?.host
}

function hostText(error: AppError): string | undefined {
  const host = lockHost(error)
  return host ? `Computer: ${host}` : undefined
}
