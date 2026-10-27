// A build as stored in the browser (local saves): the build with a format version ("v": 1), to convert old builds
// later, and the URL-safe base64 of share codes (see shareCode.ts). Ids are kept as they are, even unknown ones:
// validation reports them.
import { emptyBuild, type Build, type Loadout } from './build'
import { RULES } from './rules'

export const FORMAT_VERSION = 1

/** A text that is not a build: a share code, or a stored build. */
export class BuildImportError extends Error {
  constructor(readonly reason: 'encoding' | 'version' | 'format') {
    super(`invalid build export (${reason})`)
  }
}

// btoa() and atob() only handle Latin-1 characters: one character per byte.
function toBase64(bytes: Uint8Array): string {
  return btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join(''))
}

function fromBase64(text: string): Uint8Array {
  return Uint8Array.from(atob(text), (c) => c.charCodeAt(0))
}

/** URL-safe base64 without padding, for share links (see shareCode.ts). */
export function toBase64Url(bytes: Uint8Array): string {
  return toBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function fromBase64Url(text: string): Uint8Array {
  return fromBase64(text.replace(/-/g, '+').replace(/_/g, '/'))
}

/** Build as stored (export, local saves): the build with its format version. */
export function storedBuild(build: Build): Record<string, unknown> {
  return { v: FORMAT_VERSION, ...build }
}

/** Reads a stored build (see storedBuild). Throws a BuildImportError if it is not one. */
export function restoreBuild(data: unknown): Build {
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
