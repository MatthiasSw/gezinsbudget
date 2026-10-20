// Application error codes and the error type shared by main and renderer.
export const errorCodes = [
  'DATA_DIR_NOT_SET',
  'DATA_DIR_UNAVAILABLE',
  'WRITE_FAILED',
  'CORRUPT_FILE',
  'UNSUPPORTED_SCHEMA',
  'IMPORT_FORMAT_UNKNOWN',
  'IMPORT_MISSING_COLUMNS',
  'IMPORT_PARSE_ERROR',
  'IMPORT_UNKNOWN_ACCOUNT',
  'LOCKED_BY_OTHER',
  'INVALID_CATEGORIES',
  'INVALID_RULES',
  'INVALID_ACCOUNTS',
  'INVALID_BUDGETS',
  'UNKNOWN'
] as const

export type ErrorCode = (typeof errorCodes)[number]

export type SerializedError = {
  code: ErrorCode
  message: string
  details?: unknown
}

export class AppError extends Error {
  readonly code: ErrorCode
  readonly details?: unknown

  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.details = details
  }

  serialize(): SerializedError {
    return { code: this.code, message: this.message, details: this.details }
  }
}
