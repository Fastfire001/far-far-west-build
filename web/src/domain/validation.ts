// Build validation. Problems are codes with parameters, translated by the interface. The same rules apply in the
// editor and on import (an imported build is kept even when invalid, with its problems shown).
import { CARRIERS, carrierItem, jokerSlotsUsed, upgradePointsUsed, type Build, type CarrierKey, type Loadout } from './build'
import { equipmentById, isEquippableInLobby, jokerById, spellById, upgradeById, type EquipmentType } from './gameData'
import { MAX_JOKER_SLOTS, MAX_UPGRADE_POINTS, RULES } from './rules'

export type ProblemCode =
  // Something not chosen yet.
  | 'missing_weapon'
  | 'missing_element'
  | 'missing_utility'
  | 'missing_spell'
  // An id that does not exist (removed by a game update) or that does not fit where it is.
  | 'unknown_id'
  | 'wrong_item'
  | 'duplicate_spell'
  | 'joker_incompatible'
  | 'joker_not_equippable'
  | 'joker_too_many_copies'
  | 'joker_slots_exceeded'
  | 'upgrade_incompatible'
  | 'upgrade_too_many_points'
  | 'upgrade_points_exceeded'

export type Section = CarrierKey | 'utility' | 'spells'

export interface Problem {
  code: ProblemCode
  /** 'incomplete': the build is not finished; 'error': it breaks a rule of the game. */
  severity: 'incomplete' | 'error'
  /** Screen where the problem can be fixed. */
  section: Section
  /** Item concerned, if any. */
  id?: string
  params?: Record<string, number>
}

export function validateBuild(build: Build): Problem[] {
  const problems: Problem[] = []
  const add = (section: Section, code: ProblemCode, id?: string, params?: Record<string, number>) =>
    problems.push({ code, severity: code.startsWith('missing_') ? 'incomplete' : 'error', section, id, params })

  const checkItem = (section: Section, id: string | null, type: EquipmentType, missing: ProblemCode) => {
    if (id === null) add(section, missing)
    else if (!equipmentById.has(id)) add(section, 'unknown_id', id)
    else if (equipmentById.get(id)!.type !== type) add(section, 'wrong_item', id)
  }
  checkItem('main', build.main.weapon, 'main', 'missing_weapon')
  checkItem('sidearm', build.sidearm.weapon, 'sidearm', 'missing_weapon')
  checkItem('utility', build.utility, 'utility', 'missing_utility')

  const element = build.sidearm.element
  if (element === null) add('sidearm', 'missing_element')
  else if (!(RULES.sidearmElements.value as readonly string[]).includes(element)) add('sidearm', 'wrong_item', element)

  for (const carrier of CARRIERS) validateLoadout(build[carrier], carrier, carrierItem(build, carrier), add)

  const seen = new Set<string>()
  build.spells.forEach((spell, slot) => {
    if (spell === null) add('spells', 'missing_spell', undefined, { slot })
    else if (!spellById.has(spell)) add('spells', 'unknown_id', spell, { slot })
    else if (seen.has(spell)) add('spells', 'duplicate_spell', spell, { slot })
    seen.add(spell ?? '')
  })
  return problems
}

function validateLoadout(
  loadout: Loadout,
  carrier: CarrierKey,
  item: string | null,
  add: (section: Section, code: ProblemCode, id?: string, params?: Record<string, number>) => void,
) {
  for (const [id, copies] of Object.entries(loadout.jokers)) {
    const joker = jokerById.get(id)
    if (!joker) add(carrier, 'unknown_id', id)
    else if (item === null || !joker.available_on.includes(item)) add(carrier, 'joker_incompatible', id)
    else if (!isEquippableInLobby(joker)) add(carrier, 'joker_not_equippable', id)
    else if (copies > joker.max_equip) add(carrier, 'joker_too_many_copies', id, { copies, max: joker.max_equip })
  }
  const slots = jokerSlotsUsed(loadout)
  if (slots > MAX_JOKER_SLOTS) add(carrier, 'joker_slots_exceeded', undefined, { used: slots, max: MAX_JOKER_SLOTS })

  for (const [id, points] of Object.entries(loadout.upgrades)) {
    const upgrade = upgradeById.get(id)
    if (!upgrade) add(carrier, 'unknown_id', id)
    else if (item === null || !upgrade.available_on.includes(item)) add(carrier, 'upgrade_incompatible', id)
    else if (points > upgrade.max_slots) add(carrier, 'upgrade_too_many_points', id, { points, max: upgrade.max_slots })
  }
  const points = upgradePointsUsed(loadout)
  if (points > MAX_UPGRADE_POINTS) add(carrier, 'upgrade_points_exceeded', undefined, { used: points, max: MAX_UPGRADE_POINTS })
}

/** Why a joker cannot be added to a carrier right now, or null if it can (used by the joker screen). */
export function jokerAddBlocker(
  build: Build,
  carrier: CarrierKey,
  jokerId: string,
): 'incompatible' | 'not_equippable' | 'max_copies' | 'no_room' | null {
  const joker = jokerById.get(jokerId)
  const item = carrierItem(build, carrier)
  if (!joker || item === null || !joker.available_on.includes(item)) return 'incompatible'
  if (!isEquippableInLobby(joker)) return 'not_equippable'
  const loadout = build[carrier]
  if ((loadout.jokers[jokerId] ?? 0) >= joker.max_equip) return 'max_copies'
  if (jokerSlotsUsed(loadout) + joker.slot_cost > MAX_JOKER_SLOTS) return 'no_room'
  return null
}

/** Points that can still be added to an upgrade of a carrier (used by the ▶ arrow). */
export function upgradeRoom(build: Build, carrier: CarrierKey, upgradeId: string): number {
  const upgrade = upgradeById.get(upgradeId)
  if (!upgrade) return 0
  const loadout = build[carrier]
  const current = loadout.upgrades[upgradeId] ?? 0
  return Math.max(0, Math.min(upgrade.max_slots - current, MAX_UPGRADE_POINTS - upgradePointsUsed(loadout)))
}
