// URLs of the static content pages (see docs/build-planner.md, "Content pages"): English at the root of the site,
// the other languages under a prefix (/fr/jokers/). Also used by the planner to link to the pages.
import type { Locale } from '@/i18n'

export const LOCALE_PREFIXES: Record<Locale, string> = {
  'en-US': '',
  'de-DE': 'de',
  'es-419': 'es-419',
  'es-ES': 'es',
  'fr-FR': 'fr',
  'it-IT': 'it',
  'ja-JP': 'ja',
  'ko-KR': 'ko',
  'pl-PL': 'pl',
  'pt-BR': 'pt-br',
  'ru-RU': 'ru',
  'tr-TR': 'tr',
  'uk-UA': 'uk',
  'zh-CN': 'zh-cn',
  'zh-TW': 'zh-tw',
}

/** Path of a page from the root of the site, e.g. pagePath('fr-FR', 'jokers/') → 'fr/jokers/'. */
export function pagePath(locale: Locale, path: string): string {
  const prefix = LOCALE_PREFIXES[locale]
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
