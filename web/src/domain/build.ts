// A build and the operations of the editor. Builds are plain JSON objects (they are exported as is, see codec.ts)
// and every operation returns a new build. Operations do not check the rules: the editor prevents invalid choices
// up front (see validation.ts) and an imported build may break them anyway.
import { HERO_ID, jokerById } from './gameData'
import { RULES } from './rules'

/** Upgrades and jokers of a carrier: the hero, the main weapon or the sidearm. */
export interface Loadout {
  /** Upgrade id → points (> 0). */
  upgrades: Record<string, number>
  /** Joker id → copies (> 0). */
  jokers: Record<string, number>
}

export type CarrierKey = 'hero' | 'main' | 'sidearm'
export const CARRIERS: readonly CarrierKey[] = ['hero', 'main', 'sidearm']

export interface Build {
  name: string
  hero: Loadout
  main: Loadout & { weapon: string | null }
  sidearm: Loadout & { weapon: string | null; element: string | null }
  utility: string | null
  /** One spell id per slot (A/Q, E, C keys), null for an empty slot. */
  spells: (string | null)[]
}

function emptyLoadout(): Loadout {
  return { upgrades: {}, jokers: {} }
}

export function emptyBuild(name = ''): Build {
  return {
    name,
    hero: emptyLoadout(),
    main: { weapon: null, ...emptyLoadout() },
    sidearm: { weapon: null, element: null, ...emptyLoadout() },
    utility: null,
    spells: Array(RULES.spellSlots.value).fill(null),
  }
}

/** Item id of a carrier: itemHero, or the equipped weapon (null when none is chosen). */
export function carrierItem(build: Build, carrier: CarrierKey): string | null {
  return carrier === 'hero' ? HERO_ID : build[carrier].weapon
}

/** Equips a weapon. Changing weapons clears the carrier's upgrades and jokers. */
export function setWeapon(build: Build, carrier: 'main' | 'sidearm', weapon: string | null): Build {
  if (build[carrier].weapon === weapon) return build
  return { ...build, [carrier]: { ...build[carrier], ...emptyLoadout(), weapon } }
}

export function setElement(build: Build, element: string | null): Build {
  return { ...build, sidearm: { ...build.sidearm, element } }
}

export function setUtility(build: Build, utility: string | null): Build {
  return { ...build, utility }
}

export function rename(build: Build, name: string): Build {
  return { ...build, name }
}

function setCount(counts: Record<string, number>, id: string, count: number): Record<string, number> {
  const { [id]: _, ...others } = counts
  return count > 0 ? { ...others, [id]: count } : others
}

export function setUpgradePoints(build: Build, carrier: CarrierKey, upgrade: string, points: number): Build {
  const loadout = build[carrier]
  return { ...build, [carrier]: { ...loadout, upgrades: setCount(loadout.upgrades, upgrade, points) } }
}

export function addJoker(build: Build, carrier: CarrierKey, joker: string): Build {
  const loadout = build[carrier]
  return { ...build, [carrier]: { ...loadout, jokers: setCount(loadout.jokers, joker, (loadout.jokers[joker] ?? 0) + 1) } }
}

/** Removes one copy of a joker. */
export function removeJoker(build: Build, carrier: CarrierKey, joker: string): Build {
  const loadout = build[carrier]
  return { ...build, [carrier]: { ...loadout, jokers: setCount(loadout.jokers, joker, (loadout.jokers[joker] ?? 0) - 1) } }
}

/** Puts a spell in a slot, replacing the one there. A spell already in another slot moves: never a duplicate. */
export function placeSpell(build: Build, slot: number, spell: string): Build {
  const spells = build.spells.map((s) => (s === spell ? null : s))
  spells[slot] = spell
  return { ...build, spells }
}

export function clearSpellSlot(build: Build, slot: number): Build {
  return { ...build, spells: build.spells.map((s, i) => (i === slot ? null : s)) }
}

export function upgradePointsUsed(loadout: Loadout): number {
  return Object.values(loadout.upgrades).reduce((sum, points) => sum + points, 0)
}

/** Joker slots used. Unknown jokers (removed by a game update) count for nothing. */
export function jokerSlotsUsed(loadout: Loadout): number {
  return Object.entries(loadout.jokers).reduce(
    (sum, [id, copies]) => sum + (jokerById.get(id)?.slot_cost ?? 0) * copies,
    0,
  )
}
