// Handles the IPC channels that read, save, apply and test rules.
import type { IpcHandlers } from '@shared/ipc'
import type { RuleService } from '../services/ruleService'

export type RuleHandlers = Pick<
  IpcHandlers,
  'rules:get' | 'rules:save' | 'rules:reapply' | 'rules:test' | 'rules:addDefaults'
>

export function createRuleHandlers(service: RuleService): RuleHandlers {
  return {
    'rules:get': () => service.get(),
    'rules:save': (rules) => service.save(rules),
    'rules:reapply': (request) => service.reapply(request),
    'rules:test': (rule) => service.test(rule),
    'rules:addDefaults': () => service.addDefaults()
  }
}
