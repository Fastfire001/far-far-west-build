// Share codes, in share links (/#/share/<code>) or copied as text: the build as bytes, in URL-safe base64. The bytes are unsigned LEB128 varints and
// UTF-8 texts; the first varint is the format version, which picks the reader. Items, jokers and upgrades are
// numbered by their position in data/share-ids.json, which bin/extract-game only appends to, so a link keeps its
// meaning after a game update.
//
// To add a format: write its writer and reader below, add the reader to READERS under the next version and make
// CURRENT and WRITE point to the new format. Keep the old readers, so that the links already shared still open (the
// old writers can go: only the current format is written).
// Codes of format 1 have no unequipped weapons: they open with none. Codes of formats 1 and 2 have the jokers by
// increasing number: they open in that order.
import shareIds from '@data/share-ids.json'
import { CARRIERS, emptyBuild, type Build, type Loadout, type WeaponLoadout } from './build'
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

  /** A varint too large for a number. */
  bigUint(n: bigint) {
    for (; n >= 0x80n; n /= 0x80n) this.bytes.push(Number(n % 0x80n) | 0x80)
    this.bytes.push(Number(n))
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

  bigUint(): bigint {
    let n = 0n
    for (let scale = 1n; this.pos < this.bytes.length; scale *= 0x80n) {
      const byte = this.bytes[this.pos++]!
      n += BigInt(byte % 0x80) * scale
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

const number = (kind: Kind, id: string | null) => (id === null ? undefined : NUMBERS[kind].get(id))

function writeItem(w: Writer, id: string | null) {
  w.uint((number('items', id) ?? -1) + 1)
}

/** Numbers in increasing order, each written as the gap to the previous one, after their count. */
function writeGaps(w: Writer, numbers: number[], extra?: (n: number) => void) {
  w.uint(numbers.length)
  numbers.reduce((previous, n) => (w.uint(n - previous), extra?.(n), n), 0)
}

/** Numbers and values of the known ids, in their order. */
const known = <T>(kind: Kind, values: Record<string, T>) =>
  Object.entries(values).flatMap(([id, value]) => {
    const n = number(kind, id)
    return n === undefined ? [] : [[n, value] as const]
  })

// Format 2: format 1, then the unequipped weapons by increasing item number: their count, then for each the gap to
// the previous weapon's number, its element (item number + 1, or 0) and its loadout as in format 1.
//
// Format 3: format 2, with after the jokers of each loadout, when it has at least 2 different ones, their order in
// the build: its rank among the k! orders of its k jokers, as one varint (0 when they come by increasing number).
// The rank is a number in a mixed base: taking the jokers in their order, each gives a digit, its position among
// the jokers not placed yet (by increasing number), in base k, then k - 1… About 1 byte per 2 jokers, where a
// position per joker would take 1 byte each.

function writeLoadout(w: Writer, loadout: Loadout) {
  const points = new Map(known('upgrades', loadout.upgrades))
  writeGaps(w, [...points.keys()].sort((a, b) => a - b), (n) => w.uint(points.get(n)!))
  const jokers = known('jokers', loadout.jokers)
  const copies = jokers.flatMap(([n, count]) => Array<number>(count).fill(n))
  writeGaps(w, copies.sort((a, b) => a - b))
  if (jokers.length < 2) return
  const left = jokers.map(([n]) => n).sort((a, b) => a - b)
  let rank = 0n
  for (const [n] of jokers) {
    const position = left.indexOf(n)
    rank = rank * BigInt(left.length) + BigInt(position)
    left.splice(position, 1)
  }
  w.bigUint(rank)
}

function writeV3(w: Writer, build: Build) {
  w.text(build.name)
  for (const id of [build.utility, build.main.weapon, build.sidearm.weapon, build.sidearm.element]) writeItem(w, id)
  w.uint(build.spells.length)
  build.spells.forEach((id) => writeItem(w, id))
  for (const carrier of CARRIERS) writeLoadout(w, build[carrier])
  const weapons = new Map(known('items', build.unequipped))
  writeGaps(w, [...weapons.keys()].sort((a, b) => a - b), (n) => {
    writeItem(w, weapons.get(n)!.element)
    writeLoadout(w, weapons.get(n)!)
  })
}

function readItem(r: Reader): string | null {
  const n = r.uint()
  return n === 0 ? null : r.id('items', n - 1)
}

/** Loadout of formats 1 and 2 (jokers by increasing number, one entry per copy). */
function readLoadoutV1(r: Reader): Loadout {
  const result: Loadout = { upgrades: {}, jokers: {} }
  for (let count = r.uint(), n = 0; count > 0; count--) result.upgrades[r.id('upgrades', (n += r.uint()))] = r.uint()
  for (let count = r.uint(), n = 0; count > 0; count--) {
    const joker = r.id('jokers', (n += r.uint()))
    result.jokers[joker] = (result.jokers[joker] ?? 0) + 1
  }
  return result
}

/** Loadout of format 3: that of format 1, then the order of its jokers. */
function readLoadoutV3(r: Reader): Loadout {
  const result = readLoadoutV1(r)
  const left = Object.keys(result.jokers) // by increasing number
  if (left.length < 2) return result
  // Digits of the rank, from the last joker (base 1) to the first (base k).
  let rank = r.bigUint()
  const positions: number[] = []
  for (let base = 1; base <= left.length; base++) {
    positions.unshift(Number(rank % BigInt(base)))
    rank /= BigInt(base)
  }
  if (rank !== 0n) fail()
  const order = positions.map((position) => left.splice(position, 1)[0]!)
  result.jokers = Object.fromEntries(order.map((id) => [id, result.jokers[id]!]))
  return result
}

type LoadoutReader = (r: Reader) => Loadout

function readEquipped(r: Reader, readLoadout: LoadoutReader): Build {
  const build = emptyBuild(r.text())
  build.utility = readItem(r)
  build.main.weapon = readItem(r)
  build.sidearm.weapon = readItem(r)
  build.sidearm.element = readItem(r)
  build.spells = Array.from({ length: r.uint() }, () => readItem(r))
  for (const carrier of CARRIERS) Object.assign(build[carrier], readLoadout(r))
  return build
}

function readWithUnequipped(r: Reader, readLoadout: LoadoutReader): Build {
  const build = readEquipped(r, readLoadout)
  for (let count = r.uint(), n = 0; count > 0; count--) {
    const weapon = r.id('items', (n += r.uint()))
    const element = readItem(r)
    build.unequipped[weapon] = { ...readLoadout(r), element } satisfies WeaponLoadout
  }
  return build
}

const CURRENT = 3
const WRITE = writeV3
const READERS: Record<number, (r: Reader) => Build> = {
  1: (r) => readEquipped(r, readLoadoutV1),
  2: (r) => readWithUnequipped(r, readLoadoutV1),
  3: (r) => readWithUnequipped(r, readLoadoutV3),
}

/**
 * Code of the share link of a build, in the current format. With `withUnequipped`, the loadouts of its unequipped
 * weapons too; otherwise the code has none.
 */
export function encodeShareCode(build: Build, withUnequipped = false): string {
  const w = new Writer()
  w.uint(CURRENT)
  WRITE(w, withUnequipped ? build : { ...build, unequipped: {} })
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
