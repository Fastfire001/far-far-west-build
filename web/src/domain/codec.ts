// Export and import of a build as text: "FFW1:" + base64 of the UTF-8 JSON, with a format version ("v": 1) to
// convert old builds later. Ids are kept as they are, even unknown ones: validation reports them.
// Share links carry the same JSON, compressed (deflate) and in URL-safe base64, to keep links short.
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
  return EXPORT_PREFIX + toBase64(new TextEncoder().encode(JSON.stringify(storedBuild(build))))
}

export function decodeBuild(text: string): Build {
  const trimmed = text.trim()
  if (!trimmed.startsWith(EXPORT_PREFIX)) throw new BuildImportError('prefix')
  let data: unknown
  try {
    data = parseJson(fromBase64(trimmed.slice(EXPORT_PREFIX.length)))
  } catch {
    throw new BuildImportError('encoding')
  }
  return restoreBuild(data)
}

/** Code of a share link (/#/share/<code>): the stored build, deflated, in URL-safe base64 without padding. */
export async function encodeShareCode(build: Build): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(storedBuild(build)))
  const packed = await pipe(json, new CompressionStream('deflate-raw'))
  return toBase64(packed).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** Reads the code of a share link. Throws a BuildImportError if it is not one. */
export async function decodeShareCode(code: string): Promise<Build> {
  let data: unknown
  try {
    const packed = fromBase64(code.trim().replace(/-/g, '+').replace(/_/g, '/'))
    data = parseJson(await pipe(packed, new DecompressionStream('deflate-raw')))
  } catch {
    throw new BuildImportError('encoding')
  }
  return restoreBuild(data)
}

// btoa() and atob() only handle Latin-1 characters: one character per byte.
function toBase64(bytes: Uint8Array): string {
  return btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join(''))
}

function fromBase64(text: string): Uint8Array {
  return Uint8Array.from(atob(text), (c) => c.charCodeAt(0))
}

function parseJson(bytes: Uint8Array): unknown {
  return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes))
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const output = new Blob([bytes as Uint8Array<ArrayBuffer>]).stream().pipeThrough(stream)
  return new Uint8Array(await new Response(output).arrayBuffer())
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
