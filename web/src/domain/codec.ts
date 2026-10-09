// Export and import of a build as text: "FFW1:" + base64 of the UTF-8 JSON, with a format version ("v": 1) to
// convert old builds later. Ids are kept as they are, even unknown ones: validation reports them.
import { emptyBuild, type Build, type Loadout } from './build'
import { RULES } from './rules'

export const EXPORT_PREFIX = 'FFW1:'
export const FORMAT_VERSION = 1

export class BuildImportError extends Error {
  constructor(readonly reason: 'prefix' | 'encoding' | 'version' | 'format') {
    super(`invalid build export (${reason})`)
  }
}

export function encodeBuild(build: Build): string {
  const bytes = new TextEncoder().encode(JSON.stringify({ v: FORMAT_VERSION, ...build }))
  // btoa() only takes Latin-1 characters: encode the UTF-8 bytes, one character per byte.
  return EXPORT_PREFIX + btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join(''))
}

export function decodeBuild(text: string): Build {
  const trimmed = text.trim()
  if (!trimmed.startsWith(EXPORT_PREFIX)) throw new BuildImportError('prefix')
  let data: unknown
  try {
    const binary = atob(trimmed.slice(EXPORT_PREFIX.length))
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
    data = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes))
  } catch {
    throw new BuildImportError('encoding')
  }
  if (!isObject(data)) throw new BuildImportError('format')
  if (data.v !== FORMAT_VERSION) throw new BuildImportError('version')
  return normalize(data)
}

/** Rebuilds a valid Build structure from imported data, dropping what does not fit the format. */
function normalize(data: Record<string, unknown>): Build {
  const build = emptyBuild(typeof data.name === 'string' ? data.name : '')
  const main = isObject(data.main) ? data.main : {}
  const sidearm = isObject(data.sidearm) ? data.sidearm : {}
  const spells = Array.isArray(data.spells) ? data.spells : []
  return {
    ...build,
    hero: loadout(data.hero),
    main: { ...loadout(main), weapon: id(main.weapon) },
    sidearm: { ...loadout(sidearm), weapon: id(sidearm.weapon), element: id(sidearm.element) },
    utility: id(data.utility),
    spells: Array.from({ length: RULES.spellSlots.value }, (_, slot) => id(spells[slot])),
  }
}

function loadout(value: unknown): Loadout {
  const data = isObject(value) ? value : {}
  return { upgrades: counts(data.upgrades), jokers: counts(data.jokers) }
}

function counts(value: unknown): Record<string, number> {
  if (!isObject(value)) return {}
  return Object.fromEntries(
    Object.entries(value).filter(([, n]) => typeof n === 'number' && Number.isInteger(n) && n > 0),
  ) as Record<string, number>
}

function id(value: unknown): string | null {
  return typeof value === 'string' && value !== '' ? value : null
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
