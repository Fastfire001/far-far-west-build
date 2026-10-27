// Share codes, in share links (/#/share/<code>) or copied as text: the build as bytes, in URL-safe base64. The bytes are unsigned LEB128 varints and
// UTF-8 texts; the first varint is the format version, which picks the reader. Items, jokers and upgrades are
// numbered by their position in data/share-ids.json, which bin/extract-game only appends to, so a link keeps its
// meaning after a game update.
//
// To add a format: write its writer and reader below, add the reader to READERS under the next version and make
// CURRENT and WRITE point to the new format. Keep the old readers, so that the links already shared still open.
import shareIds from '@data/share-ids.json'
import { CARRIERS, emptyBuild, type Build, type Loadout } from './build'
import { BuildImportError, fromBase64Url, restoreBuild, storedBuild, toBase64Url } from './codec'

type Kind = keyof typeof shareIds
const NUMBERS = Object.fromEntries(
  Object.entries(shareIds).map(([kind, ids]) => [kind, new Map(ids.map((id, n) => [id, n]))]),
) as Record<Kind, Map<string, number>>

class Writer {
  readonly bytes: number[] = []

  uint(n: number) {
    for (; n >= 0x80; n = Math.floor(n / 0x80)) this.bytes.push((n % 0x80) | 0x80)
    this.bytes.push(n)
  }

  text(value: string) {
    const bytes = new TextEncoder().encode(value)
    this.uint(bytes.length)
    this.bytes.push(...bytes)
  }
}

class Reader {
  private pos = 0

  constructor(private readonly bytes: Uint8Array) {}

  uint(): number {
    let n = 0
    for (let scale = 1; this.pos < this.bytes.length && scale < 2 ** 35; scale *= 0x80) {
      const byte = this.bytes[this.pos++]!
      n += (byte % 0x80) * scale
      if (byte < 0x80) return n
    }
    return fail()
  }

  text(): string {
    const length = this.uint()
    const end = this.pos + length
    if (end > this.bytes.length) fail()
    try {
      return new TextDecoder('utf-8', { fatal: true }).decode(this.bytes.subarray(this.pos, (this.pos = end)))
    } catch {
      return fail()
    }
  }

  /** Id of a number of data/share-ids.json. */
  id(kind: Kind, n: number): string {
    return shareIds[kind][n] ?? fail()
  }

  end() {
    if (this.pos !== this.bytes.length) fail()
  }
}

function fail(): never {
  throw new BuildImportError('encoding')
}

// Format 1:
//   name; utility, main weapon, sidearm weapon, sidearm element, spell count, spells: item number + 1, or 0 for none;
//   per carrier (hero, main, sidearm), by increasing number:
//     upgrade count, then for each the gap to the previous upgrade's number and the points;
//     joker copy count, then for each copy the gap to the previous copy's number (0 for another copy).
// Ids missing from the table (a hand-edited import, never a game id) are left out: an item becomes none.

function writeV1(w: Writer, build: Build) {
  const number = (kind: Kind, id: string | null) => (id === null ? undefined : NUMBERS[kind].get(id))
  const item = (id: string | null) => w.uint((number('items', id) ?? -1) + 1)
  // Numbers in increasing order, each written as the gap to the previous one.
  const gaps = (numbers: number[], extra?: (n: number) => void) => {
    w.uint(numbers.length)
    numbers.reduce((previous, n) => (w.uint(n - previous), extra?.(n), n), 0)
  }
  const known = (kind: Kind, counts: Record<string, number>) =>
    Object.entries(counts).flatMap(([id, count]) => {
      const n = number(kind, id)
      return n === undefined ? [] : [[n, count] as const]
    })

  w.text(build.name)
  for (const id of [build.utility, build.main.weapon, build.sidearm.weapon, build.sidearm.element]) item(id)
  w.uint(build.spells.length)
  build.spells.forEach(item)
  for (const carrier of CARRIERS) {
    const points = new Map(known('upgrades', build[carrier].upgrades))
    gaps([...points.keys()].sort((a, b) => a - b), (n) => w.uint(points.get(n)!))
    const copies = known('jokers', build[carrier].jokers).flatMap(([n, count]) => Array<number>(count).fill(n))
    gaps(copies.sort((a, b) => a - b))
  }
}

function readV1(r: Reader): Build {
  const item = () => {
    const n = r.uint()
    return n === 0 ? null : r.id('items', n - 1)
  }
  const loadout = (): Loadout => {
    const result: Loadout = { upgrades: {}, jokers: {} }
    for (let count = r.uint(), n = 0; count > 0; count--) result.upgrades[r.id('upgrades', (n += r.uint()))] = r.uint()
    for (let count = r.uint(), n = 0; count > 0; count--) {
      const joker = r.id('jokers', (n += r.uint()))
      result.jokers[joker] = (result.jokers[joker] ?? 0) + 1
    }
    return result
  }

  const build = emptyBuild(r.text())
  build.utility = item()
  build.main.weapon = item()
  build.sidearm.weapon = item()
  build.sidearm.element = item()
  build.spells = Array.from({ length: r.uint() }, item)
  for (const carrier of CARRIERS) Object.assign(build[carrier], loadout())
  return build
}

const CURRENT = 1
const WRITE = writeV1
const READERS: Record<number, (r: Reader) => Build> = { 1: readV1 }

/** Code of the share link of a build, in the current format. */
export function encodeShareCode(build: Build): string {
  const w = new Writer()
  w.uint(CURRENT)
  WRITE(w, build)
  return toBase64Url(new Uint8Array(w.bytes))
}

/** Reads a share code, in any format, or a whole share link. Throws a BuildImportError if it is not one. */
export function decodeShareCode(text: string): Build {
  let r: Reader
  try {
    r = new Reader(fromBase64Url(text.trim().replace(/^.*\/share\//, '')))
  } catch {
    return fail()
  }
  const read = READERS[r.uint()]
  if (!read) throw new BuildImportError('version')
  const build = read(r)
  r.end()
  // Same checks as an import (spell slots, points and copies > 0).
  return restoreBuild(storedBuild(build))
}
