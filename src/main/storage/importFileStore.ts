// Keeps unchanged copies of imported bank files, without storing the same content twice.
import { createHash } from 'crypto'
import { mkdir, readdir, readFile, stat, writeFile } from 'fs/promises'
import { basename, join } from 'path'

const forbiddenFileNameCharacters = '<>:"/\\|?*'

function isUnsafeFileNameCharacter(character: string): boolean {
  return character.charCodeAt(0) < 32 || forbiddenFileNameCharacters.includes(character)
}

export async function storeImportFile(
  importsDir: string,
  originalName: string,
  content: Uint8Array,
  now: () => Date
): Promise<string> {
  await mkdir(importsDir, { recursive: true })

  const existingName = await findIdenticalFile(importsDir, content)
  if (existingName) return existingName

  const storedName = `${buildTimestamp(now())}_${sanitizeFileName(originalName)}`
  await writeFile(join(importsDir, storedName), content, { flag: 'wx' })
  return storedName
}

async function findIdenticalFile(
  importsDir: string,
  content: Uint8Array
): Promise<string | undefined> {
  const wantedHash = sha256(content)
  for (const name of await readdir(importsDir)) {
    const path = join(importsDir, name)
    if ((await stat(path)).size !== content.length) continue
    if (sha256(await readFile(path)) === wantedHash) return name
  }
  return undefined
}

function buildTimestamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15)
}

function sanitizeFileName(name: string): string {
  const safe = [...basename(name)].map((c) => (isUnsafeFileNameCharacter(c) ? '_' : c)).join('')
  const cleaned = safe.trim()
  return cleaned === '' ? 'import.csv' : cleaned
}

function sha256(content: Uint8Array): string {
  return createHash('sha256').update(content).digest('hex')
}
