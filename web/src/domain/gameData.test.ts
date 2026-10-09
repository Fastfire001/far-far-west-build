import { describe, expect, it } from 'vitest'
import { equipment, HERO_ID, isEquippableInLobby, jokers, spells, spellSchools, upgrades } from './gameData'

const carrierIds = new Set([HERO_ID, ...equipment.filter((e) => e.type !== 'utility').map((e) => e.id)])

describe('game data', () => {
  it('only references known carriers', () => {
    for (const item of [...jokers, ...upgrades]) {
      for (const id of item.available_on) expect(carrierIds, `${item.id} → ${id}`).toContain(id)
    }
  })

  it('only references known spell schools', () => {
    const schoolIds = new Set(spellSchools.map((s) => s.id))
    for (const spell of spells) expect(schoolIds).toContain(spell.school)
  })

  it('excludes the jokers that cannot be equipped in the lobby', () => {
    const excluded = jokers.filter((j) => !isEquippableInLobby(j)).map((j) => j.id)
    expect(excluded.length).toBeGreaterThan(0)
    expect(excluded).toContain('jokerGiant')
  })
})
