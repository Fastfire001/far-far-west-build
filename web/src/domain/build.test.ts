import { describe, expect, it } from 'vitest'
import { addJoker, clearSpellSlot, emptyBuild, jokerSlotsUsed, placeSpell, removeJoker, setUpgradePoints, setWeapon } from './build'

describe('build operations', () => {
  it('starts empty', () => {
    const build = emptyBuild('Test')
    expect(build.main.weapon).toBeNull()
    expect(build.spells).toEqual([null, null, null])
  })

  it('clears the jokers and upgrades of a carrier when its weapon changes', () => {
    let build = setWeapon(emptyBuild(), 'sidearm', 'itemPistol')
    build = addJoker(build, 'sidearm', 'jokerCrackShot')
    build = setUpgradePoints(build, 'sidearm', 'jokerUpgradeDamage', 3)
    expect(setWeapon(build, 'sidearm', 'itemPistol')).toBe(build)
    const changed = setWeapon(build, 'sidearm', 'itemBow')
    expect(changed.sidearm).toMatchObject({ weapon: 'itemBow', jokers: {}, upgrades: {} })
  })

  it('counts joker copies and slots', () => {
    let build = addJoker(emptyBuild(), 'main', 'jokerCrackShot')
    build = addJoker(build, 'main', 'jokerCrackShot')
    expect(build.main.jokers).toEqual({ jokerCrackShot: 2 })
    expect(jokerSlotsUsed(build.main)).toBe(4)
    build = removeJoker(removeJoker(build, 'main', 'jokerCrackShot'), 'main', 'jokerCrackShot')
    expect(build.main.jokers).toEqual({})
  })

  it('moves a spell instead of duplicating it', () => {
    let build = placeSpell(emptyBuild(), 0, 'itemSpellFireBall')
    build = placeSpell(build, 2, 'itemSpellFireBall')
    expect(build.spells).toEqual([null, null, 'itemSpellFireBall'])
    expect(clearSpellSlot(build, 2).spells).toEqual([null, null, null])
  })
})
