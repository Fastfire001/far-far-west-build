// A build and the operations of the editor. Builds are plain JSON objects (they are exported as is, see codec.ts)
// and every operation returns a new build. Operations do not check the rules: the editor prevents invalid choices
// up front (see validation.ts) and an imported build may break them anyway.
import { HERO_ID, jokerById } from './gameData'
import { RULES } from './rules'

/** Upgrades and jokers of a carrier: the hero, the main weapon or the sidearm. */
export interface Loadout {
  /** Upgrade id → points (> 0). */
  upgrades: Record<string, number>
  /** Joker id → copies (> 0), in the order the jokers were added. */
  jokers: Record<string, number>
}

export type CarrierKey = 'hero' | 'main' | 'sidearm'
export const CARRIERS: readonly CarrierKey[] = ['hero', 'main', 'sidearm']

/** Upgrades, jokers and element (sidearms only, null on a main weapon) of a weapon that is not equipped. */
export type WeaponLoadout = Loadout & { element: string | null }

export interface Build {
  name: string
  hero: Loadout
  main: Loadout & { weapon: string | null }
  sidearm: Loadout & { weapon: string | null; element: string | null }
  utility: string | null
  /** One spell id per slot (A/Q, E, C keys), null for an empty slot. */
  spells: (string | null)[]
  /**
   * Weapon id → loadout of the weapons customized but not equipped: switching weapons keeps them, and equipping one
   * again brings its loadout back. Only in local saves: share codes carry the equipped weapons only.
   */
  unequipped: Record<string, WeaponLoadout>
}

/**
 * What the editor customizes: a carrier (its equipped item), or a weapon of a weapon carrier, equipped or not. The
 * weapon must be one of that carrier (main weapon or sidearm): the editor checks it.
 */
export type Target = CarrierKey | { carrier: CarrierKey; weapon: string | null }

function emptyLoadout(): Loadout {
  return { upgrades: {}, jokers: {} }
}

function emptyWeaponLoadout(): WeaponLoadout {
  return { ...emptyLoadout(), element: null }
}

export function emptyBuild(name = ''): Build {
  return {
    name,
    hero: emptyLoadout(),
    main: { weapon: null, ...emptyLoadout() },
    sidearm: { weapon: null, element: null, ...emptyLoadout() },
    utility: null,
    spells: Array(RULES.spellSlots.value).fill(null),
    unequipped: {},
  }
}

/** Item id of a carrier: itemHero, or the equipped weapon (null when none is chosen). */
export function carrierItem(build: Build, carrier: CarrierKey): string | null {
  return carrier === 'hero' ? HERO_ID : build[carrier].weapon
}

function resolve(target: Target): { carrier: CarrierKey; weapon: string | null } {
  return typeof target === 'string' ? { carrier: target, weapon: null } : target
}

/** Whether the target is the carrier's equipped item (always true for the hero, or without a weapon). */
export function isTargetEquipped(build: Build, target: Target): boolean {
  const { carrier, weapon } = resolve(target)
  return carrier === 'hero' || weapon === null || build[carrier].weapon === weapon
}

/** Item id of a target: the given weapon, otherwise the carrier's item (see carrierItem). */
export function targetItem(build: Build, target: Target): string | null {
  const { carrier, weapon } = resolve(target)
  return carrier === 'hero' || weapon === null ? carrierItem(build, carrier) : weapon
}

/** Upgrades and jokers of a target: those of the carrier if it is equipped, otherwise the weapon's saved ones. */
export function targetLoadout(build: Build, target: Target): Loadout {
  const { carrier, weapon } = resolve(target)
  if (isTargetEquipped(build, target)) return build[carrier]
  return build.unequipped[weapon!] ?? emptyWeaponLoadout()
}

/** Element of a sidearm target: the sidearm's if it is equipped, otherwise the weapon's saved one. */
export function targetElement(build: Build, target: Target): string | null {
  const { carrier, weapon } = resolve(target)
  if (carrier !== 'sidearm') return null
  return isTargetEquipped(build, target) ? build.sidearm.element : (build.unequipped[weapon!]?.element ?? null)
}

function isEmpty(loadout: WeaponLoadout): boolean {
  return Object.keys(loadout.upgrades).length === 0 && Object.keys(loadout.jokers).length === 0 && loadout.element === null
}

/** Saves the loadout of an unequipped weapon; an empty one is not kept. */
function stash(unequipped: Record<string, WeaponLoadout>, weapon: string, loadout: WeaponLoadout) {
  const { [weapon]: _, ...others } = unequipped
  return isEmpty(loadout) ? others : { ...others, [weapon]: loadout }
}

/** Changes the loadout of a target: the carrier's if it is equipped, otherwise the weapon's saved one. */
function update(build: Build, target: Target, patch: Partial<WeaponLoadout>): Build {
  const { carrier, weapon } = resolve(target)
  if (isTargetEquipped(build, target)) return { ...build, [carrier]: { ...build[carrier], ...patch } }
  const current = build.unequipped[weapon!] ?? emptyWeaponLoadout()
  return { ...build, unequipped: stash(build.unequipped, weapon!, { ...current, ...patch }) }
}

/**
 * Equips a weapon. The loadout of the weapon taken off is kept in `unequipped`, and the new weapon gets its own back
 * (empty if it was never customized).
 */
export function setWeapon(build: Build, carrier: 'main' | 'sidearm', weapon: string | null): Build {
  const current = build[carrier]
  if (current.weapon === weapon) return build
  let unequipped = build.unequipped
  if (current.weapon !== null) {
    const element = carrier === 'sidearm' ? build.sidearm.element : null
    unequipped = stash(unequipped, current.weapon, { upgrades: current.upgrades, jokers: current.jokers, element })
  }
  const { element, ...loadout } = (weapon !== null && unequipped[weapon]) || emptyWeaponLoadout()
  if (weapon !== null) unequipped = stash(unequipped, weapon, emptyWeaponLoadout())
  const equipped = carrier === 'sidearm' ? { weapon, element, ...loadout } : { weapon, ...loadout }
  return { ...build, [carrier]: equipped, unequipped }
}

/** Sets the element of the equipped sidearm, or of the given sidearm. */
export function setElement(build: Build, element: string | null, weapon: string | null = null): Build {
  return update(build, { carrier: 'sidearm', weapon }, { element })
}

/** Removes the upgrades, jokers and element of a target. */
export function clearLoadout(build: Build, target: Target): Build {
  const { carrier } = resolve(target)
  return update(build, target, carrier === 'sidearm' ? emptyWeaponLoadout() : emptyLoadout())
}

export function setUtility(build: Build, utility: string | null): Build {
  return { ...build, utility }
}

export function rename(build: Build, name: string): Build {
  return { ...build, name }
}

/**
 * Sets the count of an id. The ids keep their order: an id already there stays in its place, a new one goes last
 * (the order in which jokers were added is shown everywhere and kept by share links).
 */
function setCount(counts: Record<string, number>, id: string, count: number): Record<string, number> {
  if (count <= 0) {
    const { [id]: _, ...others } = counts
    return others
  }
  return { ...counts, [id]: count }
}

export function setUpgradePoints(build: Build, target: Target, upgrade: string, points: number): Build {
  const loadout = targetLoadout(build, target)
  return update(build, target, { upgrades: setCount(loadout.upgrades, upgrade, points) })
}

export function addJoker(build: Build, target: Target, joker: string): Build {
  const loadout = targetLoadout(build, target)
  return update(build, target, { jokers: setCount(loadout.jokers, joker, (loadout.jokers[joker] ?? 0) + 1) })
}

/** Removes one copy of a joker. */
export function removeJoker(build: Build, target: Target, joker: string): Build {
  const loadout = targetLoadout(build, target)
  return update(build, target, { jokers: setCount(loadout.jokers, joker, (loadout.jokers[joker] ?? 0) - 1) })
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
