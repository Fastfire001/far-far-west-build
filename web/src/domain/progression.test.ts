import { describe, expect, it } from 'vitest'
import type { Loadout } from './build'
import { jokerById } from './gameData'
import { requirements, uniqueUnlockLevel } from './progression'

// jokerBracing costs 1 slot: n copies use n slots (progression does not check the copy limit).
const loadout = (points: number, slots: number, jokers: Record<string, number> = {}): Loadout => ({
  upgrades: points ? { jokerUpgradeDamage: points } : {},
  jokers: slots ? { jokerBracing: slots, ...jokers } : jokers,
})

describe('requirements', () => {
  it('needs level 1 for an empty carrier', () => {
    expect(requirements(loadout(0, 0))).toMatchObject({ level: 1, prestiges: 0, assumed: false })
  })

  it('gives 1 upgrade point every 2 levels, 20 at level 40', () => {
    expect(requirements(loadout(1, 0)).level).toBe(2)
    expect(requirements(loadout(20, 0)).level).toBe(40)
  })

  it('uses the joker slot levels of the game', () => {
    expect(requirements(loadout(0, 1)).level).toBe(1)
    expect(requirements(loadout(0, 9)).level).toBe(40)
    expect(requirements(loadout(0, 14)).level).toBe(100)
  })

  it('buys at the prestige shop only what levels cannot give', () => {
    const result = requirements(loadout(22, 0))
    expect(result).toMatchObject({ level: 40, prestiges: 1, assumed: true })
    expect(result.upgradePoints).toEqual({ used: 22, bought: 2, level: 40 })
    expect(requirements(loadout(0, 15))).toMatchObject({ level: 100, prestiges: 1 })
  })

  it('adds up prestige tokens across prestiges', () => {
    // 5 points = 10 tokens = 2 prestiges of 5 tokens.
    expect(requirements(loadout(25, 0)).prestiges).toBe(2)
    // Everything: 2 slots (10 tokens) + 6 points (12 tokens) = 22 tokens → 5 prestiges.
    expect(requirements(loadout(26, 16))).toMatchObject({ level: 100, prestiges: 5 })
  })

  it('takes the unlock level of Unique jokers into account', () => {
    const result = requirements(loadout(0, 0, { jokerFanningAce: 1 }))
    expect(result.uniqueJokers).toEqual([{ joker: 'jokerFanningAce', level: 40 }])
    expect(result.level).toBe(40)
  })
})

describe('uniqueUnlockLevel', () => {
  it('reads both spellings of the level challenges', () => {
    const unique = [...jokerById.values()].filter((j) => j.rarity === 'Unique')
    expect(unique.length).toBeGreaterThan(0)
    for (const joker of unique) expect(uniqueUnlockLevel(joker), joker.id).toBeGreaterThan(0)
    expect(uniqueUnlockLevel(jokerById.get('jokerCrackShot')!)).toBeNull()
  })
})
