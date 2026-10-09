// Typed access to the game data extracted into data/ (see docs/game-mechanics.md).
// Kept free of Vue so that the build rules can be unit-tested on their own.
import equipmentJson from '@data/equipment.json'
import jokersJson from '@data/jokers.json'
import progressionJson from '@data/progression.json'
import spellsJson from '@data/spells.json'
import upgradesJson from '@data/upgrades.json'

/** Carriers of upgrades and jokers: the hero, a main weapon or a sidearm. */
export const HERO_ID = 'itemHero'

export type EquipmentType = 'main' | 'sidearm' | 'utility'

export interface Equipment {
  id: string
  name: string
  type: EquipmentType
  description: string
}

export interface SpellSchool {
  id: string
  name: string
  description: string
}

export interface Spell {
  id: string
  name: string
  school: string
  description: string
}

export type Rarity = 'Normal' | 'Fine' | 'Prime' | 'Mythic' | 'Legendary' | 'Unique'

export interface Joker {
  id: string
  name: string
  rarity: Rarity
  slot_cost: number
  max_equip: number
  buy_price: number
  sell_price: number
  description: string
  /** [HERO_ID] for a hero joker, otherwise the ids of the compatible weapons. */
  available_on: string[]
  can_be_bought: boolean
  can_be_gambled: boolean
  /** Challenge that unlocks the joker, e.g. challengeLvl40ItemBow. */
  unlocked_by: string | null
  can_drop_in_mission: boolean
  droppable: boolean
}

export interface Upgrade {
  id: string
  name: string
  /** Bonus per point: a fraction (0.05 = +5%) unless flat. */
  value: number
  flat: boolean
  max_slots: number
  gold_cost: number
  available_on: string[]
}

export interface Progression {
  /** Level that unlocks joker slot n + 1. */
  joker_slot_levels: number[]
}

export const equipment = equipmentJson as Equipment[]
export const spellSchools = spellsJson.schools as SpellSchool[]
export const spells = spellsJson.spells as Spell[]
export const jokers = jokersJson as Joker[]
export const upgrades = upgradesJson as Upgrade[]
export const progression = progressionJson as Progression

/** Jokers that can be equipped in the lobby: the others only drop in missions (Camper, Giant…). */
export function isEquippableInLobby(joker: Joker): boolean {
  return joker.can_be_bought || joker.can_be_gambled
}

function byId<T extends { id: string }>(items: T[]): ReadonlyMap<string, T> {
  return new Map(items.map((item) => [item.id, item]))
}

export const equipmentById = byId(equipment)
export const spellSchoolById = byId(spellSchools)
export const spellById = byId(spells)
export const jokerById = byId(jokers)
export const upgradeById = byId(upgrades)
