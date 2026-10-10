// What a content page needs to render in one language: its texts and the URLs of the site.
import type { Locale } from '@/i18n'
import type { Html } from './html'
import { pagePath } from './routes'
import { textsFor, type Texts } from './texts'

export interface SiteOptions {
  /** Base path of the site, as Vite's base: '/far-far-west-build/' once built, '/' on the dev server. */
  base: string
  /** Public address of the site, for canonical URLs and the sitemap. */
  siteUrl: string
}

export interface Context extends Texts, SiteOptions {
  /** Link to another page in the same language. */
  href(path: string): string
  /** Public URL of a page, in this language or another one. */
  absolute(path: string, locale?: Locale): string
  icon(id: string): string
  /** The planner (the application at the root of the site), at one of its routes. */
  planner(route?: string): string
}

export function contextFor(locale: Locale, options: SiteOptions): Context {
  return {
    ...textsFor(locale),
    ...options,
    href: (path) => options.base + pagePath(locale, path),
    absolute: (path, other = locale) => options.siteUrl + pagePath(other, path),
    icon: (id) => `${options.base}icons/${id}.svg`,
    planner: (route = '/') => `${options.base}#${route}`,
  }
}

export interface Crumb {
  label: string
  path: string
}

export interface PageContent {
  /** <title>, in the page's language. */
  title: string
  description: string
  heading: string
  /** Pages above this one (the planner's home is always first, it is added by the layout). */
  crumbs: Crumb[]
  body: Html
}

/** A content page: the same path in every language. */
export interface Page {
  /** Path from the root of the site, without the language prefix, ending with a slash: 'jokers/crackshot/'. */
  path: string
  render(ctx: Context): PageContent | Promise<PageContent>
}
