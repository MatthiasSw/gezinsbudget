// Detects an unreachable data folder (for example an offline network drive) and reports it as a typed error.
import { stat } from 'fs/promises'
import { AppError } from '@shared/errors'
import { errorCode } from './fsErrors'

const unavailableCodes = [
  'ENOENT',
  'ENOTDIR',
  'ETIMEDOUT',
  'EHOSTDOWN',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'ENETDOWN',
  'ENOTCONN',
  'EIO',
  'EACCES'
]

export async function assertDirectoryAvailable(directory: string): Promise<void> {
  try {
    const info = await stat(directory)
    if (!info.isDirectory()) throw unavailableError()
  } catch (error) {
    throw toAvailabilityError(error)
  }
}

export function toAvailabilityError(error: unknown): unknown {
  if (error instanceof AppError) return error
  const code = errorCode(error)
  return code && unavailableCodes.includes(code) ? unavailableError() : error
}

function unavailableError(): AppError {
  return new AppError('DATA_DIR_UNAVAILABLE', 'The data folder is not reachable')
}
