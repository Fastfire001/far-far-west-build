import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { BuildImportError } from '@/domain/codec'
import { useBuildStore } from './build'

describe('build store', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('starts with an empty, incomplete build', () => {
    const store = useBuildStore()
    expect(store.build.main.weapon).toBeNull()
    expect(store.problems.every((p) => p.severity === 'incomplete')).toBe(true)
    expect(store.requirements.hero).toMatchObject({ level: 1, prestiges: 0 })
  })

  it('only adds jokers the carrier has room for', () => {
    const store = useBuildStore()
    expect(store.addJoker('main', 'jokerCrackShot')).toBe(false)
    store.setWeapon('main', 'itemShotgun')
    expect(store.addJoker('main', 'jokerCrackShot')).toBe(true)
    expect(store.addJoker('main', 'jokerCrackShot')).toBe(true)
    expect(store.addJoker('main', 'jokerCrackShot')).toBe(false)
    expect(store.build.main.jokers).toEqual({ jokerCrackShot: 2 })
    expect(store.requirements.main.jokerSlots.used).toBe(4)
  })

  it('keeps upgrade points within the stat maximum and the budget', () => {
    const store = useBuildStore()
    store.changeUpgrade('hero', 'jokerUpgradeHeal', 10)
    expect(store.build.hero.upgrades).toEqual({ jokerUpgradeHeal: 6 })
    store.changeUpgrade('hero', 'jokerUpgradeTotalAmmoBag', 16)
    store.changeUpgrade('hero', 'jokerUpgradeJumpHeight', 6)
    expect(store.build.hero.upgrades.jokerUpgradeJumpHeight).toBe(4)
    expect(store.requirements.hero).toMatchObject({ level: 100, prestiges: 3 })
    store.changeUpgrade('hero', 'jokerUpgradeHeal', -10)
    expect(store.build.hero.upgrades.jokerUpgradeHeal).toBeUndefined()
  })

  it('keeps the loadout of a weapon taken off', () => {
    const store = useBuildStore()
    store.setWeapon('sidearm', 'itemPistol')
    store.addJoker('sidearm', 'jokerBracing')
    store.setWeapon('sidearm', 'itemBow')
    expect(store.build.sidearm.jokers).toEqual({})
    store.setWeapon('sidearm', 'itemPistol')
    expect(store.build.sidearm.jokers).toEqual({ jokerBracing: 1 })
  })

  it('customizes a weapon without equipping it', () => {
    const store = useBuildStore()
    store.setWeapon('main', 'itemShotgun')
    const target = { carrier: 'main', weapon: 'itemMinigun' } as const
    expect(store.addJoker(target, 'jokerCrackShot')).toBe(true)
    store.changeUpgrade(target, 'jokerUpgradeDamage', 1)
    expect(store.build.main).toEqual({ weapon: 'itemShotgun', upgrades: {}, jokers: {} })
    expect(store.build.unequipped.itemMinigun).toMatchObject({ jokers: { jokerCrackShot: 1 }, upgrades: { jokerUpgradeDamage: 1 } })
    store.clearLoadout(target)
    expect(store.build.unequipped).toEqual({})
  })

  it('shares only the equipped weapons', () => {
    const store = useBuildStore()
    store.setWeapon('main', 'itemShotgun')
    store.addJoker({ carrier: 'main', weapon: 'itemMinigun' }, 'jokerCrackShot')
    store.importText(store.exportText())
    expect(store.build.main.weapon).toBe('itemShotgun')
    expect(store.build.unequipped).toEqual({})
  })

  it('exports and imports the build', () => {
    const store = useBuildStore()
    store.rename('Mon build')
    store.placeSpell(0, 'itemSpellFireBall')
    const text = store.exportText()
    store.reset()
    store.importText(text)
    expect(store.build).toMatchObject({ name: 'Mon build', spells: ['itemSpellFireBall', null, null] })
    expect(() => store.importText('nope')).toThrow(BuildImportError)
  })
})
