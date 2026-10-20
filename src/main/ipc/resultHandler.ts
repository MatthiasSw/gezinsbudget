// Wraps an IPC handler so errors become typed results and unexpected details stay hidden.
import { AppError, type SerializedError } from '@shared/errors'
import type { IpcChannel, IpcHandlers, IpcRequest, IpcResponse, IpcResult } from '@shared/ipc'

export function toResultHandler<K extends IpcChannel>(
  handler: IpcHandlers[K]
): (request: IpcRequest<K>) => Promise<IpcResult<IpcResponse<K>>> {
  return async (request) => {
    try {
      return { ok: true, value: await handler(request) }
    } catch (error) {
      return { ok: false, error: toSerializedError(error) }
    }
  }
}

function toSerializedError(error: unknown): SerializedError {
  if (error instanceof AppError) return error.serialize()
  return { code: 'UNKNOWN', message: 'Unexpected error' }
}
