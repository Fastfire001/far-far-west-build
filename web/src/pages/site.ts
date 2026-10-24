// All the static content pages, in each of their languages, and the sitemap (see docs/build-planner.md, "Content pages").
// Rendered at build time by the contentPages Vite plugin (vite-plugin-content-pages.ts), and on request by the dev
// server.
import { equipment, gameMeta, spellSchools, type Equipment } from '@/domain/gameData'
import { DEFAULT_LOCALE } from '@/i18n'
import { contextFor, type Page, type SiteOptions } from './context'
import { html } from './html'
import { jokerPages } from './jokerPages'
import { renderDocument } from './layout'
import { itemPath } from './parts'
import { progressionPage } from './progressionPage'
import { PAGE_LOCALES, pagePath } from './routes'
import { spellPages } from './spellPages'
import { weaponPages } from './weaponPages'

export type { SiteOptions }

export const PAGES: Page[] = [...jokerPages, ...weaponPages, ...spellPages, progressionPage]

export interface SiteFile {
  /** Path of the file from the root of the built site: 'fr/jokers/index.html'. */
  file: string
  /** URL path the file is served at, base included: '/far-far-west-build/fr/jokers/'. */
  url: string
  render(): Promise<string>
}

export function siteFiles(options: SiteOptions): SiteFile[] {
  return PAGE_LOCALES.flatMap((locale) => {
    const ctx = contextFor(locale, options)
    return PAGES.map((page) => ({
      file: `${pagePath(locale, page.path)}index.html`,
      url: ctx.href(page.path),
      render: async () => renderDocument(ctx, page, await page.render(ctx)),
    }))
  })
}

/** sitemap.xml: the planner and every content page. The languages of each page are given in the pages themselves. */
export function sitemap(options: SiteOptions): string {
  const urls = [options.siteUrl, ...PAGE_LOCALES.flatMap((l) => PAGES.map((page) => options.siteUrl + pagePath(l, page.path)))]
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${url}</loc></url>`).join('\n')}
</urlset>
`
}

/**
 * What the planner's index.html shows before the app mounts, for search engines that do not run JavaScript: the game
 * version, and links to the content pages of every weapon and spell school (in English, like index.html).
 */
export function homeContent(options: SiteOptions): { gameVersion: string; links: string } {
  const ctx = contextFor(DEFAULT_LOCALE, options)
  const links = (ids: string[]) => ids.map((id) => html`<a href="${ctx.href(itemPath(id))}">${ctx.name(id)}</a>`)
  const group = (label: string, ids: string[]) => html`<li>${label}: ${links(ids).flatMap((link, i) => (i ? [' · ', link] : [link]))}</li>`
  const ofType = (type: Equipment['type']) => equipment.filter((e) => e.type === type).map((e) => e.id)
  return {
    gameVersion: gameMeta.game_version,
    links: html`<ul>
        ${group(ctx.t('weapons.main'), ofType('main'))}
        ${group(ctx.t('weapons.sidearm'), ofType('sidearm'))}
        ${group(ctx.t('weapons.utility'), ofType('utility'))}
        ${group(ctx.t('spells.heading'), spellSchools.map((s) => s.id))}
      </ul>`.value,
  }
}
