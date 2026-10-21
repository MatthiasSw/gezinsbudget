// Renderer-side API: the same calls as window.api, but each returns its value or throws AppError.
import { AppError } from '@shared/errors'
import type { IpcResult } from '@shared/ipc'

type BridgeApi = Window['api']

// Turns `(...args) => Promise<IpcResult<T>>` into `(...args) => Promise<T>` for every call of a group.
type UnwrappedGroup<Group> = {
  [Call in keyof Group]: Group[Call] extends (...args: infer Args) => Promise<IpcResult<infer T>>
    ? (...args: Args) => Promise<T>
    : never
}

type RendererApi = {
  [Group in keyof BridgeApi]: UnwrappedGroup<BridgeApi[Group]>
}

type BridgeCall = (...args: unknown[]) => Promise<IpcResult<unknown>>

async function unwrap<T>(pending: Promise<IpcResult<T>>): Promise<T> {
  const result = await pending
  if (result.ok) return result.value
  throw new AppError(result.error.code, result.error.message, result.error.details)
}

function unwrapGroup(group: Record<string, BridgeCall>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(group).map(([name, call]) => [
      name,
      (...args: unknown[]) => unwrap(call(...args))
    ])
  )
}

// Built once at start-up, so every function keeps the same identity (hooks rely on that).
export const api = Object.fromEntries(
  Object.entries(window.api).map(([name, group]) => [
    name,
    unwrapGroup(group as Record<string, BridgeCall>)
  ])
) as RendererApi
