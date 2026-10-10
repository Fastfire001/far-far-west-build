// All the static content pages, in every language, and the sitemap (see docs/build-planner.md, "Content pages").
// Rendered at build time by the contentPages Vite plugin (vite-plugin-content-pages.ts), and on request by the dev
// server.
import { LOCALES } from '@/i18n'
import { contextFor, type Page, type SiteOptions } from './context'
import { jokerPages } from './jokerPages'
import { renderDocument } from './layout'
import { progressionPage } from './progressionPage'
import { pagePath } from './routes'
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
  return LOCALES.flatMap((locale) => {
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
  const urls = [options.siteUrl, ...LOCALES.flatMap((l) => PAGES.map((page) => options.siteUrl + pagePath(l, page.path)))]
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${url}</loc></url>`).join('\n')}
</urlset>
`
}
