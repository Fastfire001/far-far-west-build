// Compact share links (/#/b/<code>): the build as bytes, in URL-safe base64. Items, jokers and upgrades are numbered
// by their position in data/share-ids.json, which bin/extract-game only appends to, so a link keeps its meaning after
// a game update. Numbers are unsigned LEB128 varints, in this order:
//   format version (2); name: UTF-8 byte length, then the bytes;
//   utility, main weapon, sidearm weapon, sidearm element, spell count, spells: item number + 1, or 0 for none;
//   per carrier (hero, main, sidearm), by increasing number:
//     upgrade count, then for each the gap to the previous upgrade's number and the points;
//     joker copy count, then for each copy the gap to the previous copy's number (0 for another copy).
// A build with an id missing from the table (a hand-edited import) cannot be written this way: shareLinkPath then
// falls back to the long link (/#/share/<code>, see encodeShareCode), which is still read.
import shareIds from '@data/share-ids.json'
import { CARRIERS, emptyBuild, type Build, type Loadout } from './build'
import { BuildImportError, encodeShareCode, fromBase64Url, restoreBuild, storedBuild, toBase64Url } from './codec'

export const COMPACT_VERSION = 2

type Kind = keyof typeof shareIds
const NUMBERS = Object.fromEntries(
  Object.entries(shareIds).map(([kind, ids]) => [kind, new Map(ids.map((id, n) => [id, n]))]),
) as Record<Kind, Map<string, number>>

class UnknownId extends Error {}

/** Path of the share link of a build: the compact one, or the long one if an id is missing from the table. */
export async function shareLinkPath(build: Build): Promise<string> {
  const code = encodeCompactCode(build)
  return code === null ? `/share/${await encodeShareCode(build)}` : `/b/${code}`
}

/** Code of a compact share link, or null if the build has an id missing from data/share-ids.json. */
export function encodeCompactCode(build: Build): string | null {
  const bytes: number[] = []
  const put = (n: number) => {
    for (; n >= 0x80; n = Math.floor(n / 0x80)) bytes.push((n % 0x80) | 0x80)
    bytes.push(n)
  }
  const number = (kind: Kind, id: string) => {
    const n = NUMBERS[kind].get(id)
    if (n === undefined) throw new UnknownId(id)
    return n
  }
  const item = (id: string | null) => put(id === null ? 0 : number('items', id) + 1)
  // Numbers in increasing order, each written as the gap to the previous one.
  const gaps = (numbers: number[], extra?: (n: number) => void) => {
    put(numbers.length)
    numbers.reduce((previous, n) => (put(n - previous), extra?.(n), n), 0)
  }

  try {
    const name = new TextEncoder().encode(build.name)
    put(COMPACT_VERSION)
    put(name.length)
    bytes.push(...name)
    for (const id of [build.utility, build.main.weapon, build.sidearm.weapon, build.sidearm.element]) item(id)
    put(build.spells.length)
    build.spells.forEach(item)
    for (const carrier of CARRIERS) {
      const { upgrades, jokers } = build[carrier]
      const points = new Map(Object.entries(upgrades).map(([id, p]) => [number('upgrades', id), p]))
      gaps([...points.keys()].sort((a, b) => a - b), (n) => put(points.get(n)!))
      const copies = Object.entries(jokers).flatMap(([id, c]) => Array<number>(c).fill(number('jokers', id)))
      gaps(copies.sort((a, b) => a - b))
    }
  } catch (error) {
    if (error instanceof UnknownId) return null
    throw error
  }
  return toBase64Url(new Uint8Array(bytes))
}

/** Reads the code of a compact share link. Throws a BuildImportError if it is not one. */
export function decodeCompactCode(code: string): Build {
  let bytes: Uint8Array
  try {
    bytes = fromBase64Url(code.trim())
  } catch {
    throw new BuildImportError('encoding')
  }
  let pos = 0
  const fail = (): never => {
    throw new BuildImportError('encoding')
  }
  const get = (): number => {
    let n = 0
    for (let scale = 1; pos < bytes.length && scale < 2 ** 35; scale *= 0x80) {
      const byte = bytes[pos++]!
      n += (byte % 0x80) * scale
      if (byte < 0x80) return n
    }
    return fail()
  }
  const id = (kind: Kind, n: number) => shareIds[kind][n] ?? fail()
  const item = () => {
    const n = get()
    return n === 0 ? null : id('items', n - 1)
  }
  const loadout = (): Loadout => {
    const result: Loadout = { upgrades: {}, jokers: {} }
    for (let count = get(), n = 0; count > 0; count--) result.upgrades[id('upgrades', (n += get()))] = get()
    for (let count = get(), n = 0; count > 0; count--) {
      const joker = id('jokers', (n += get()))
      result.jokers[joker] = (result.jokers[joker] ?? 0) + 1
    }
    return result
  }

  if (get() !== COMPACT_VERSION) throw new BuildImportError('version')
  const length = get()
  if (pos + length > bytes.length) fail()
  let name = ''
  try {
    name = new TextDecoder('utf-8', { fatal: true }).decode(bytes.subarray(pos, (pos += length)))
  } catch {
    fail()
  }
  const build = emptyBuild(name)
  build.utility = item()
  build.main.weapon = item()
  build.sidearm.weapon = item()
  build.sidearm.element = item()
  build.spells = Array.from({ length: get() }, item)
  for (const carrier of CARRIERS) Object.assign(build[carrier], loadout())
  if (pos !== bytes.length) fail()
  // Same checks as an import (spell slots, points and copies > 0).
  return restoreBuild(storedBuild(build))
}
