import { describe, expect, it } from 'vitest'
import { addJoker, emptyBuild, placeSpell, setElement, setUpgradePoints, setUtility, setWeapon, type Build } from './build'
import { jokerAddBlocker, upgradeRoom, validateBuild } from './validation'

function completeBuild(): Build {
  let build = setWeapon(setWeapon(emptyBuild(), 'main', 'itemShotgun'), 'sidearm', 'itemPistol')
  build = setElement(setUtility(build, 'itemUtilityAmmo'), 'itemFire')
  build = placeSpell(placeSpell(placeSpell(build, 0, 'itemSpellFireBall'), 1, 'itemSpellFireBeam'), 2, 'itemSpellAcidRain')
  return build
}

const codes = (build: Build) => validateBuild(build).map((p) => p.code)

describe('validateBuild', () => {
  it('accepts a complete build', () => {
    expect(validateBuild(completeBuild())).toEqual([])
  })

  it('reports what is not chosen yet as incomplete', () => {
    const problems = validateBuild(emptyBuild())
    expect(problems.every((p) => p.severity === 'incomplete')).toBe(true)
    expect(problems.map((p) => p.code)).toEqual([
      'missing_weapon', 'missing_weapon', 'missing_utility', 'missing_element',
      'missing_spell', 'missing_spell', 'missing_spell',
    ])
  })

  it('reports unknown ids and items in the wrong place', () => {
    let build = setWeapon(completeBuild(), 'main', 'itemPistol')
    build = { ...build, utility: 'itemRemovedByPatch' }
    expect(codes(build)).toEqual(['wrong_item', 'unknown_id'])
  })

  it('checks jokers against their carrier', () => {
    let build = addJoker(completeBuild(), 'hero', 'jokerCrackShot')
    build = addJoker(build, 'hero', 'jokerGiant')
    build = addJoker(addJoker(addJoker(build, 'sidearm', 'jokerBracing'), 'sidearm', 'jokerBracing'), 'sidearm', 'jokerBracing')
    expect(codes(build)).toEqual(['joker_incompatible', 'joker_not_equippable', 'joker_too_many_copies'])
  })

  it('checks the joker slot budget', () => {
    const build = { ...completeBuild(), hero: { upgrades: {}, jokers: { jokerBattleMage: 1, jokerCastAway: 1, jokerCoinFlip: 1, jokerDoubleDown: 1 } } }
    expect(validateBuild(build)).toEqual([
      expect.objectContaining({ code: 'joker_slots_exceeded', section: 'hero', params: { used: 20, max: 16 } }),
    ])
  })

  it('checks upgrade points', () => {
    let build = setUpgradePoints(completeBuild(), 'hero', 'jokerUpgradeHeal', 7)
    build = setUpgradePoints(build, 'hero', 'jokerUpgradeTotalAmmoBag', 16)
    build = setUpgradePoints(build, 'hero', 'jokerUpgradeJumpHeight', 6)
    build = setUpgradePoints(build, 'main', 'jokerUpgradeLifesteal', 1)
    expect(codes(build)).toEqual(['upgrade_too_many_points', 'upgrade_points_exceeded', 'upgrade_incompatible'])
  })
})

describe('editor checks', () => {
  it('tells why a joker cannot be added', () => {
    let build = completeBuild()
    expect(jokerAddBlocker(build, 'hero', 'jokerCrackShot')).toBe('incompatible')
    expect(jokerAddBlocker(build, 'hero', 'jokerGiant')).toBe('not_equippable')
    build = addJoker(addJoker(build, 'sidearm', 'jokerBracing'), 'sidearm', 'jokerBracing')
    expect(jokerAddBlocker(build, 'sidearm', 'jokerBracing')).toBe('max_copies')
    build = { ...build, hero: { upgrades: {}, jokers: { jokerBattleMage: 1, jokerCastAway: 1, jokerCoinFlip: 1 } } }
    expect(jokerAddBlocker(build, 'hero', 'jokerDoubleDown')).toBe('no_room')
    expect(jokerAddBlocker(emptyBuild(), 'main', 'jokerCrackShot')).toBe('incompatible')
  })

  it('limits upgrade points to the stat maximum and the carrier budget', () => {
    let build = completeBuild()
    expect(upgradeRoom(build, 'hero', 'jokerUpgradeHeal')).toBe(6)
    build = setUpgradePoints(build, 'hero', 'jokerUpgradeTotalAmmoBag', 16)
    build = setUpgradePoints(build, 'hero', 'jokerUpgradeJumpHeight', 6)
    expect(upgradeRoom(build, 'hero', 'jokerUpgradeHeal')).toBe(4)
  })
})
