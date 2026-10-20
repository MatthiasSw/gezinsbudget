// Tests that stored rules from before the default flag are recognised and ordered.
import { mkdtemp, readFile, rm, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { Rule } from '@shared/types'
import { legacyStarterKeywords } from './legacyStarterKeywords'
import { createDataRepository } from './repository'

let root: string

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'rule-migration-'))
})

afterEach(async () => {
  await rm(root, { recursive: true, force: true })
})

function rule(id: string, value: string, overrides: Partial<Rule> = {}): Rule {
  return {
    id,
    field: 'anyText',
    operator: 'regex',
    value,
    caseSensitive: false,
    categoryId: 'c',
    enabled: true,
    ...overrides
  }
}

describe('rules file of schema version 1', () => {
  it('flags the old default rules, puts the user rules first and saves version 2', async () => {
    const stored = [
      rule('d1', legacyStarterKeywords[0]),
      rule('u1', 'eigen', { operator: 'contains' }),
      rule('u2', legacyStarterKeywords[1], { field: 'counterpartyName' })
    ]
    await writeFile(join(root, 'rules.json'), JSON.stringify({ schemaVersion: 1, data: stored }))
    const repository = createDataRepository({ root, updatedBy: 'pc-a' })

    const rules = await repository.getRules()
    expect(rules.map((item) => [item.id, item.isDefault])).toEqual([
      ['u1', undefined],
      ['u2', undefined],
      ['d1', true]
    ])

    await repository.saveRules(rules)
    const written = JSON.parse(await readFile(join(root, 'rules.json'), 'utf-8'))
    expect(written.schemaVersion).toBe(2)
  })
})
