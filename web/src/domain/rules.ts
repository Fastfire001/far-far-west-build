// Progression rules that are not in data/progression.json, each marked confirmed or assumed with its source
// (see docs/game-mechanics.md, "Prestige", and docs/build-planner.md, "Questions ouvertes").
import { progression } from './gameData'

export type RuleStatus = 'confirmed' | 'assumed'

export interface Rule<T> {
  value: T
  status: RuleStatus
  source: string
}

export const RULES = {
  /** One upgrade point every 2 levels: point n is unlocked at level 2n. */
  levelsPerUpgradePoint: {
    value: 2,
    status: 'confirmed',
    source: 'patch notes V644; game text ST_UI_Upgrades_Description',
  },
  /** Upgrade points given by levels: 20 at level 40. */
  upgradePointsFromLevels: {
    value: 20,
    status: 'confirmed',
    source: 'patch notes V644; game text ST_UI_Equipment_AmountUpgrades',
  },
  /** Joker slots given by levels, and the level unlocking each one. */
  jokerSlotLevels: {
    value: progression.joker_slot_levels,
    status: 'confirmed',
    source: 'game file C_UnlockedJokers',
  },
  maxLevel: { value: 100, status: 'confirmed', source: 'game text ST_UI_Prestige_LevelRequired' },
  tokensPerPrestige: { value: 5, status: 'confirmed', source: 'patch notes; wikily.gg build planner' },
  maxPrestiges: { value: 15, status: 'confirmed', source: 'neonsect.com, Prestige explained' },
  /** Prestige shop: extra joker slots. */
  prestigeJokerSlot: {
    value: { cost: 5, max: 2 },
    status: 'confirmed',
    source: 'patch notes; wikily.gg build planner',
  },
  /** Prestige shop: extra upgrade points. */
  prestigeUpgradePoint: {
    value: { cost: 2, max: 6 },
    status: 'confirmed',
    source: 'patch notes V644 (6 bonus points); wikily.gg build planner (cost)',
  },
  /**
   * Slots and points bought at the prestige shop can be used right away, whatever the level: only what levels
   * cannot give is bought, and the level shown is the one needed for the rest. Open question 1 in
   * docs/build-planner.md: the shop logic is in a Blueprint (UI_PrestigeShop) we cannot read.
   */
  prestigeBonusesUsableAtAnyLevel: {
    value: true,
    status: 'assumed',
    source: 'not verified in game',
  },
  /** Elements of a sidearm (spell school ids): all 4 are available on every sidearm. */
  sidearmElements: {
    value: ['itemAcid', 'itemElec', 'itemFire', 'itemIce'],
    status: 'confirmed',
    source: 'farfarwest.wiki.gg',
  },
  spellSlots: { value: 3, status: 'confirmed', source: 'game (Q, E, C keys)' },
} as const satisfies Record<string, Rule<unknown>>

export const MAX_UPGRADE_POINTS = RULES.upgradePointsFromLevels.value + RULES.prestigeUpgradePoint.value.max
export const MAX_JOKER_SLOTS = RULES.jokerSlotLevels.value.length + RULES.prestigeJokerSlot.value.max
