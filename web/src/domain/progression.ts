// Minimum level and prestiges needed by a carrier for its upgrades and jokers (see docs/build-planner.md, "Rules").
// Only what levels cannot give is bought at the prestige shop; the level is the one needed for the rest, after the last
// prestige.
import { jokerSlotsUsed, upgradePointsUsed, type Loadout } from './build'
import { jokerById, type Joker } from './gameData'
import { RULES } from './rules'

export interface UniqueRequirement {
  joker: string
  level: number
}

export interface Requirements {
  /** Level to reach (after the last prestige, if any). */
  level: number
  prestiges: number
  upgradePoints: { used: number; bought: number; level: number }
  jokerSlots: { used: number; bought: number; level: number }
  /** Unique jokers and the carrier level that unlocks them. */
  uniqueJokers: UniqueRequirement[]
  /** True when the result relies on an assumed rule (see RULES): to be shown with a warning. */
  assumed: boolean
}

/** Level of the challenge unlocking a Unique joker (challengeLvl40ItemBow, challengeLevel35ItemShotgun → 40, 35). */
export function uniqueUnlockLevel(joker: Joker): number | null {
  if (joker.rarity !== 'Unique' || !joker.unlocked_by) return null
  const match = /^challenge(?:Lvl|Level)(\d+)Item/.exec(joker.unlocked_by)
  return match ? Number(match[1]) : null
}

export function requirements(loadout: Loadout): Requirements {
  const pointsUsed = upgradePointsUsed(loadout)
  const pointsBought = clamp(pointsUsed - RULES.upgradePointsFromLevels.value, 0, RULES.prestigeUpgradePoint.value.max)
  const pointsLevel = Math.max(1, (pointsUsed - pointsBought) * RULES.levelsPerUpgradePoint.value)

  const slotLevels = RULES.jokerSlotLevels.value
  const slotsUsed = jokerSlotsUsed(loadout)
  const slotsBought = clamp(slotsUsed - slotLevels.length, 0, RULES.prestigeJokerSlot.value.max)
  const slotsFromLevels = Math.min(slotsUsed - slotsBought, slotLevels.length)
  const slotsLevel = slotsFromLevels > 0 ? slotLevels[slotsFromLevels - 1] : 1

  const uniqueJokers = Object.keys(loadout.jokers).flatMap((id) => {
    const joker = jokerById.get(id)
    const level = joker && uniqueUnlockLevel(joker)
    return level ? [{ joker: id, level }] : []
  })

  // Prestige tokens add up from one prestige to the next: 2 bought points cost 4 of the 5 tokens of a prestige,
  // and the token left is used by the next purchase.
  const tokens = slotsBought * RULES.prestigeJokerSlot.value.cost + pointsBought * RULES.prestigeUpgradePoint.value.cost
  const prestiges = Math.ceil(tokens / RULES.tokensPerPrestige.value)

  return {
    level: Math.min(Math.max(pointsLevel, slotsLevel, ...uniqueJokers.map((u) => u.level)), RULES.maxLevel.value),
    prestiges,
    upgradePoints: { used: pointsUsed, bought: pointsBought, level: pointsLevel },
    jokerSlots: { used: slotsUsed, bought: slotsBought, level: slotsLevel },
    uniqueJokers,
    assumed: prestiges > 0 && RULES.prestigeBonusesUsableAtAnyLevel.status === 'assumed',
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}
