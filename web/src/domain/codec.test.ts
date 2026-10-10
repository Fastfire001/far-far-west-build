import { describe, expect, it } from 'vitest'
import { addJoker, emptyBuild, setWeapon } from './build'
import { BuildImportError, decodeBuild, decodeShareCode, encodeBuild, encodeShareCode } from './codec'

describe('build export', () => {
  it('round-trips a build, accents and all', () => {
    const build = addJoker(setWeapon(emptyBuild('Pistolero à l’ancienne 🤠'), 'sidearm', 'itemPistol'), 'sidearm', 'jokerCrackShot')
    const text = encodeBuild(build)
    expect(text.startsWith('FFW1:')).toBe(true)
    expect(decodeBuild(`  ${text}\n`)).toEqual(build)
  })

  it('keeps unknown ids and drops what does not fit the format', () => {
    const json = JSON.stringify({ v: 1, name: 3, main: { weapon: 'itemGone', jokers: { jokerGone: 1, jokerBad: -2 } }, spells: ['itemSpellFireBall'] })
    const build = decodeBuild('FFW1:' + btoa(json))
    expect(build.name).toBe('')
    expect(build.main).toEqual({ weapon: 'itemGone', jokers: { jokerGone: 1 }, upgrades: {} })
    expect(build.spells).toEqual(['itemSpellFireBall', null, null])
  })

  it('rejects text that is not a build export', () => {
    const reason = (text: string) => {
      try {
        decodeBuild(text)
      } catch (error) {
        return (error as BuildImportError).reason
      }
    }
    expect(reason('hello')).toBe('prefix')
    expect(reason('FFW1:%%%')).toBe('encoding')
    expect(reason('FFW1:' + btoa('[]'))).toBe('format')
    expect(reason('FFW1:' + btoa('{"v":2}'))).toBe('version')
  })
})

describe('share links', () => {
  it('round-trips a build with a URL-safe code shorter than the export', async () => {
    let build = setWeapon(emptyBuild('Pistolero à l’ancienne 🤠'), 'sidearm', 'itemPistol')
    for (const joker of ['jokerCrackShot', 'jokerBracing', 'jokerBracing']) build = addJoker(build, 'sidearm', joker)
    const code = await encodeShareCode(build)
    expect(code).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(code.length).toBeLessThan(encodeBuild(build).length)
    expect(await decodeShareCode(code)).toEqual(build)
  })

  it('rejects a damaged code', async () => {
    const code = await encodeShareCode(emptyBuild('x'))
    await expect(decodeShareCode(code.slice(0, -4))).rejects.toMatchObject({ reason: 'encoding' })
    await expect(decodeShareCode('%%%')).rejects.toMatchObject({ reason: 'encoding' })
  })
})
