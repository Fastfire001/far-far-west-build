import { describe, expect, it } from 'vitest'
import {
  addJoker,
  clearLoadout,
  clearSpellSlot,
  emptyBuild,
  isTargetEquipped,
  jokerSlotsUsed,
  placeSpell,
  removeJoker,
  setElement,
  setUpgradePoints,
  setWeapon,
  targetItem,
  targetLoadout,
} from './build'

describe('build operations', () => {
  it('starts empty', () => {
    const build = emptyBuild('Test')
    expect(build.main.weapon).toBeNull()
    expect(build.spells).toEqual([null, null, null])
  })

  it('keeps the loadout of a weapon taken off and gives it back when it is equipped again', () => {
    let build = setWeapon(emptyBuild(), 'sidearm', 'itemPistol')
    build = addJoker(build, 'sidearm', 'jokerCrackShot')
    build = setUpgradePoints(build, 'sidearm', 'jokerUpgradeDamage', 3)
    build = setElement(build, 'itemFire')
    expect(setWeapon(build, 'sidearm', 'itemPistol')).toBe(build)

    const changed = setWeapon(build, 'sidearm', 'itemBow')
    expect(changed.sidearm).toEqual({ weapon: 'itemBow', element: null, jokers: {}, upgrades: {} })
    expect(changed.unequipped).toEqual({
      itemPistol: { jokers: { jokerCrackShot: 1 }, upgrades: { jokerUpgradeDamage: 3 }, element: 'itemFire' },
    })

    const back = setWeapon(changed, 'sidearm', 'itemPistol')
    expect(back.sidearm).toEqual(build.sidearm)
    // The Bow was left empty: nothing to keep.
    expect(back.unequipped).toEqual({})
  })

  it('customizes a weapon that is not equipped', () => {
    const build = setWeapon(emptyBuild(), 'main', 'itemShotgun')
    const target = { carrier: 'main', weapon: 'itemMinigun' } as const
    expect(isTargetEquipped(build, target)).toBe(false)
    expect(targetItem(build, target)).toBe('itemMinigun')

    let changed = addJoker(build, target, 'jokerCrackShot')
    changed = setUpgradePoints(changed, target, 'jokerUpgradeDamage', 2)
    expect(changed.main).toEqual(build.main)
    expect(targetLoadout(changed, target)).toEqual({ upgrades: { jokerUpgradeDamage: 2 }, jokers: { jokerCrackShot: 1 }, element: null })

    // Equipping it brings its loadout, and the Shotgun (empty) is not kept.
    const equipped = setWeapon(changed, 'main', 'itemMinigun')
    expect(equipped.main).toEqual({ weapon: 'itemMinigun', upgrades: { jokerUpgradeDamage: 2 }, jokers: { jokerCrackShot: 1 } })
    expect(equipped.unequipped).toEqual({})

    // Removing the last joker and point of an unequipped weapon forgets it.
    changed = removeJoker(setUpgradePoints(changed, target, 'jokerUpgradeDamage', 0), target, 'jokerCrackShot')
    expect(changed.unequipped).toEqual({})
  })

  it('clears the loadout of a carrier or an unequipped weapon', () => {
    let build = setElement(addJoker(setWeapon(emptyBuild(), 'sidearm', 'itemPistol'), 'sidearm', 'jokerCrackShot'), 'itemFire')
    build = setElement(build, 'itemIce', 'itemBow')
    expect(clearLoadout(build, 'sidearm').sidearm).toEqual({ weapon: 'itemPistol', element: null, jokers: {}, upgrades: {} })
    expect(clearLoadout(build, { carrier: 'sidearm', weapon: 'itemBow' }).unequipped).toEqual({})
  })

  it('counts joker copies and slots', () => {
    let build = addJoker(emptyBuild(), 'main', 'jokerCrackShot')
    build = addJoker(build, 'main', 'jokerCrackShot')
    expect(build.main.jokers).toEqual({ jokerCrackShot: 2 })
    expect(jokerSlotsUsed(build.main)).toBe(4)
    build = removeJoker(removeJoker(build, 'main', 'jokerCrackShot'), 'main', 'jokerCrackShot')
    expect(build.main.jokers).toEqual({})
  })

  it('keeps the jokers in the order they were added', () => {
    let build = emptyBuild()
    for (const joker of ['jokerCrackShot', 'jokerBracing', 'jokerCrackShot', 'jokerA', 'jokerBracing']) build = addJoker(build, 'hero', joker)
    expect(Object.keys(build.hero.jokers)).toEqual(['jokerCrackShot', 'jokerBracing', 'jokerA'])
    // Removing a copy keeps the joker in its place; removing the last one drops it, and adding it again puts it last.
    build = removeJoker(build, 'hero', 'jokerCrackShot')
    expect(Object.keys(build.hero.jokers)).toEqual(['jokerCrackShot', 'jokerBracing', 'jokerA'])
    build = addJoker(removeJoker(build, 'hero', 'jokerCrackShot'), 'hero', 'jokerCrackShot')
    expect(Object.keys(build.hero.jokers)).toEqual(['jokerBracing', 'jokerA', 'jokerCrackShot'])
  })

  it('moves a spell instead of duplicating it', () => {
    let build = placeSpell(emptyBuild(), 0, 'itemSpellFireBall')
    build = placeSpell(build, 2, 'itemSpellFireBall')
    expect(build.spells).toEqual([null, null, 'itemSpellFireBall'])
    expect(clearSpellSlot(build, 2).spells).toEqual([null, null, null])
  })
})
