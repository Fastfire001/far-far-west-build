import shareIds from '@data/share-ids.json'
import { describe, expect, it } from 'vitest'
import { addJoker, CARRIERS, carrierItem, emptyBuild, placeSpell, setElement, setUpgradePoints, setUtility, setWeapon, type Build } from './build'
import { fromBase64Url, storedBuild, toBase64Url } from './codec'
import { equipment, jokers, spells, spellSchools, upgrades } from './gameData'
import { decodeShareCode, encodeShareCode } from './shareCode'

/** A build with every part filled in: 5 upgrades and 6 jokers (one with 2 copies) per carrier. */
function fullBuild(): Build {
  let build = setUtility(emptyBuild('Pistolero à l’ancienne 🤠'), 'itemUtilityAmmo')
  build = setWeapon(setWeapon(build, 'main', 'itemWinchester'), 'sidearm', 'itemPistol')
  build = setElement(build, 'itemFire')
  for (const [slot, spell] of ['itemSpellFireBall', 'itemSpellCactusUlti', 'itemSpellIceLance'].entries()) build = placeSpell(build, slot, spell)
  for (const carrier of CARRIERS) {
    const item = carrierItem(build, carrier)!
    for (const upgrade of upgrades.filter((u) => u.available_on.includes(item)).slice(0, 5)) build = setUpgradePoints(build, carrier, upgrade.id, 4)
    // Not in the order of data/share-ids.json, which the code must not fall back to.
    const compatible = jokers.filter((j) => j.available_on.includes(item)).slice(0, 6).reverse()
    for (const joker of [...compatible, compatible[0]!]) build = addJoker(build, carrier, joker.id)
  }
  return build
}

describe('share id table', () => {
  it('numbers every id of the game data, once', () => {
    const tables = {
      items: [...equipment, ...spellSchools, ...spells],
      jokers,
      upgrades,
    }
    for (const [kind, entries] of Object.entries(tables)) {
      const table = shareIds[kind as keyof typeof shareIds]
      expect(new Set(table).size).toBe(table.length)
      expect(table).toEqual(expect.arrayContaining(entries.map((e) => e.id)))
    }
  })
})

describe('share links', () => {
  it('round-trips a build in a short URL-safe code', () => {
    const code = encodeShareCode(fullBuild())
    expect(code).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(code.length).toBeLessThan(JSON.stringify(storedBuild(fullBuild())).length / 7)
    expect(decodeShareCode(code)).toEqual(fullBuild())
    expect(decodeShareCode(encodeShareCode(emptyBuild()))).toEqual(emptyBuild())
  })

  it('keeps the jokers in their order', () => {
    // toEqual ignores the order of the keys: compare it on its own.
    const order = (build: Build) => CARRIERS.map((carrier) => Object.keys(build[carrier].jokers))
    const build = fullBuild()
    expect(order(build).flat().map((id) => shareIds.jokers.indexOf(id))).not.toEqual(
      order(build).flat().map((id) => shareIds.jokers.indexOf(id)).sort((a, b) => a - b),
    )
    expect(order(decodeShareCode(encodeShareCode(build)))).toEqual(order(build))
    const weapon = { carrier: 'main', weapon: 'itemMinigun' } as const
    const withUnequipped = addJoker(addJoker(build, weapon, 'jokerCrackShot'), weapon, 'jokerBracing')
    expect(Object.keys(decodeShareCode(encodeShareCode(withUnequipped, true)).unequipped.itemMinigun!.jokers)).toEqual([
      'jokerCrackShot',
      'jokerBracing',
    ])
  })

  it('shares the unequipped weapons only when asked', () => {
    let build = fullBuild()
    build = addJoker(build, { carrier: 'main', weapon: 'itemMinigun' }, 'jokerCrackShot')
    build = setUpgradePoints(build, { carrier: 'main', weapon: 'itemMinigun' }, 'jokerUpgradeDamage', 2)
    build = setElement(build, 'itemIce', 'itemBow')
    // Without them: the code of the build without unequipped weapons, which opens with none.
    expect(encodeShareCode(build)).toBe(encodeShareCode(fullBuild()))
    expect(decodeShareCode(encodeShareCode(build)).unequipped).toEqual({})
    const code = encodeShareCode(build, true)
    expect(fromBase64Url(code)[0]).toBe(3) // format version
    expect(decodeShareCode(code)).toEqual(build)
  })

  it('reads a whole share link too', () => {
    const code = encodeShareCode(fullBuild())
    expect(decodeShareCode(` https://fastfire001.github.io/far-far-west-build/#/share/${code}\n`)).toEqual(fullBuild())
  })

  it('still opens a link of format 1', () => {
    // Fails if data/share-ids.json was reordered, or if a change of the format broke the links already shared.
    expect(decodeShareCode('AQlQeXJvIPCfpKAxNg8IAyIAKwELBgAAASEBBggDDAAV')).toEqual({
      name: 'Pyro 🤠',
      hero: { upgrades: { jokerUpgradeHeal: 6 }, jokers: {} },
      main: { weapon: 'itemWinchester', upgrades: {}, jokers: { jokerCrackShot: 1 } },
      sidearm: {
        weapon: 'itemPistol',
        element: 'itemFire',
        upgrades: { jokerUpgradeDamage: 8 },
        jokers: { jokerCrackShot: 1, jokerBracing: 2 },
      },
      utility: 'itemUtilityAmmo',
      spells: ['itemSpellFireBall', null, 'itemSpellIceLance'],
      // Links carry the equipped weapons only.
      unequipped: {},
    })
  })

  it('still opens a link of format 2', () => {
    // Jokers by increasing number in this format: they open in that order.
    const build = decodeShareCode('AgpGcm9zdCDwn6SgMTYPCQMiAAAAAgwAAAEhAQYDAAIDCAAACgAAASE')
    expect(build).toEqual({
      name: 'Frost 🤠',
      hero: { upgrades: {}, jokers: { jokerBracing: 2 } },
      main: { weapon: 'itemWinchester', upgrades: {}, jokers: { jokerCrackShot: 1 } },
      sidearm: { weapon: 'itemPistol', element: 'itemIce', upgrades: { jokerUpgradeDamage: 3 }, jokers: {} },
      utility: 'itemUtilityAmmo',
      spells: ['itemSpellFireBall', null, null],
      unequipped: {
        itemMinigun: { upgrades: {}, jokers: { jokerCrackShot: 1 }, element: null },
        itemBow: { upgrades: {}, jokers: {}, element: 'itemFire' },
      },
    })
  })

  it('leaves out the ids missing from the table', () => {
    const build = setUtility(addJoker(fullBuild(), 'hero', 'jokerGone'), 'itemGone')
    expect(decodeShareCode(encodeShareCode(build))).toEqual(setUtility(fullBuild(), null))
  })

  it('rejects a damaged code', () => {
    const code = encodeShareCode(fullBuild())
    const reason = (text: string) => {
      try {
        decodeShareCode(text)
      } catch (error) {
        return (error as { reason: string }).reason
      }
    }
    expect(reason(code.slice(0, -2))).toBe('encoding')
    expect(reason(code + 'AA')).toBe('encoding')
    expect(reason('%%%')).toBe('encoding')
    expect(reason('')).toBe('encoding')
    expect(reason(toBase64Url(new Uint8Array([99, 0])))).toBe('version')
    // Format 1, joker number past the end of the table.
    expect(reason(toBase64Url(new Uint8Array([1, 0, 0, 0, 0, 0, 0, 0, 1, 0x80, 0x10, 0, 0, 0, 0])))).toBe('encoding')
    // Format 3, two jokers on the hero: rank 1 puts them in reverse order, there are only 2 orders.
    const twoJokers = (rank: number) => toBase64Url(new Uint8Array([3, 0, 0, 0, 0, 0, 0, 0, 2, 12, 21, rank, 0, 0, 0, 0, 0]))
    expect(Object.keys(decodeShareCode(twoJokers(1)).hero.jokers)).toEqual(['jokerCrackShot', 'jokerBracing'])
    expect(reason(twoJokers(2))).toBe('encoding')
  })
})
