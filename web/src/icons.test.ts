import { describe, expect, it } from 'vitest'
import { equipment, HERO_ID, jokers, spells, spellSchools, upgrades } from '@/domain/gameData'
import { iconFile, iconUrl } from './icons'

describe('icons', () => {
  it('has an icon for every item of the game data', () => {
    const ids = [HERO_ID, ...[equipment, jokers, upgrades, spellSchools, spells].flat().map((item) => item.id)]
    expect(ids.filter((id) => !iconUrl(id))).toEqual([])
  })

  it('publishes an icon under its id and extension', () => {
    expect(iconFile('jokerCrackShot')).toMatch(/^jokerCrackShot\.(png|svg)$/)
  })
})
