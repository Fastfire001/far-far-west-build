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
    expect(store.requirements.hero).toMatchObject({ prestiges: 3, assumed: true })
    store.changeUpgrade('hero', 'jokerUpgradeHeal', -10)
    expect(store.build.hero.upgrades.jokerUpgradeHeal).toBeUndefined()
  })

  it('clears a carrier when its weapon changes', () => {
    const store = useBuildStore()
    store.setWeapon('sidearm', 'itemPistol')
    store.addJoker('sidearm', 'jokerBracing')
    store.setWeapon('sidearm', 'itemBow')
    expect(store.build.sidearm.jokers).toEqual({})
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
