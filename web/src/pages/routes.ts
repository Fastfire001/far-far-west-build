// URLs of the static content pages (see docs/build-planner.md, "Content pages"): English at the root of the site,
// French under a prefix (/fr/jokers/). Also used by the planner to link to the pages.
import { DEFAULT_LOCALE, type Locale } from '@/i18n'

/** The languages of the content pages (those of our page texts, pages/i18n/), with their URL prefix. */
export const LOCALE_PREFIXES: Partial<Record<Locale, string>> = {
  'en-US': '',
  'fr-FR': 'fr',
}

export const PAGE_LOCALES = Object.keys(LOCALE_PREFIXES) as Locale[]

/** Path of a page from the root of the site, e.g. pagePath('fr-FR', 'jokers/') → 'fr/jokers/'. The English page for a
 * language without pages. */
export function pagePath(locale: Locale, path: string): string {
  const prefix = LOCALE_PREFIXES[locale] ?? LOCALE_PREFIXES[DEFAULT_LOCALE]
  return prefix ? `${prefix}/${path}` : path
}

/** Slug of an English name in a URL: ASCII lower-case words joined by dashes ("DEATH'S DANCE" → deaths-dance). */
export function slugify(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[̀-ͯ'’]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
