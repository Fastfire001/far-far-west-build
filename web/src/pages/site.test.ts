import { beforeAll, describe, expect, it } from 'vitest'
import { jokers, spellSchools } from '@/domain/gameData'
import { LOCALES } from '@/i18n'
import { html, raw } from './html'
import { masteryJoker } from './jokerPages'
import { PAGES, siteFiles, sitemap } from './site'

const options = { base: '/far-far-west-build/', siteUrl: 'https://example.org/far-far-west-build/' }

describe('html templates', () => {
  it('escapes values, not markup', () => {
    expect(html`<p title="${'"a" & <b>'}">${raw('<i>ok</i>')}${['x', null, false, 2]}</p>`.value).toBe(
      '<p title="&quot;a&quot; &amp; &lt;b&gt;">' + '<i>ok</i>x2</p>',
    )
  })
})

describe('content pages', () => {
  const files = siteFiles(options)
  const rendered = new Map<string, string>()

  beforeAll(async () => {
    for (const file of files) rendered.set(file.url, await file.render())
  })

  it('has one file per page and language, at distinct paths', () => {
    expect(new Set(PAGES.map((p) => p.path)).size).toBe(PAGES.length)
    expect(new Set(files.map((f) => f.file)).size).toBe(PAGES.length * LOCALES.length)
    expect(files.find((f) => f.file === 'fr/jokers/crackshot/index.html')?.url).toBe('/far-far-west-build/fr/jokers/crackshot/')
  })

  it('every joker and school has a page; every school has its Mastery joker', () => {
    expect(PAGES.filter((p) => /^jokers\/.+/.test(p.path))).toHaveLength(jokers.length)
    for (const school of spellSchools) expect(masteryJoker(school.id), school.id).toBeDefined()
  })

  it('links only to pages, icons and assets that exist', () => {
    const icons = new Set(
      Object.keys(import.meta.glob('../../../assets/icons/*.svg')).map((f) => `${options.base}icons/${f.split('/').pop()}`),
    )
    const assets = new Set([`${options.base}pages/style.css`, `${options.base}og-image.png`])
    for (const [url, page] of rendered) {
      for (const [, target] of page.matchAll(/(?:href|src)="([^"]+)"/g)) {
        if (target.startsWith('https://') || target.startsWith(`${options.base}#/`)) continue
        const path = target.split('#')[0]
        expect(rendered.has(path) || icons.has(path) || assets.has(path), `${url} → ${target}`).toBe(true)
      }
    }
  })

  it('gives each page a title, a description, its language and its translations', () => {
    for (const file of files) {
      const page = rendered.get(file.url)!
      expect(page).toMatch(/<title>[^<]{10,}<\/title>/)
      expect(page).toMatch(/<meta name="description" content="[^"]{30,}"/)
      expect(page.match(/hreflang="[^"]+" href=/g)).toHaveLength(LOCALES.length + 1)
      expect(page).not.toMatch(/\{\w+\}/) // a text variable left out
    }
    expect(rendered.get('/far-far-west-build/fr/spells/')).toMatch(/<html lang="fr-FR">[\s\S]*<h1>Sorts<\/h1>/)
  })

  it('lists the planner and every page in the sitemap', () => {
    const xml = sitemap(options)
    expect(xml.match(/<loc>/g)).toHaveLength(files.length + 1)
    expect(xml).toContain('<loc>https://example.org/far-far-west-build/zh-tw/progression/</loc>')
  })
})
