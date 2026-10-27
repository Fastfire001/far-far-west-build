import { describe, expect, it } from 'vitest'
import { BuildImportError, restoreBuild } from './codec'

describe('stored builds', () => {
  it('keeps unknown ids and drops what does not fit the format', () => {
    const build = restoreBuild({ v: 1, name: 3, main: { weapon: 'itemGone', jokers: { jokerGone: 1, jokerBad: -2 } }, spells: ['itemSpellFireBall'] })
    expect(build.name).toBe('')
    expect(build.main).toEqual({ weapon: 'itemGone', jokers: { jokerGone: 1 }, upgrades: {} })
    expect(build.spells).toEqual(['itemSpellFireBall', null, null])
  })

  it('rejects data that is not a stored build', () => {
    const reason = (data: unknown) => {
      try {
        restoreBuild(data)
      } catch (error) {
        return (error as BuildImportError).reason
      }
    }
    expect(reason([])).toBe('format')
    expect(reason({ v: 2 })).toBe('version')
  })
})
