// Texts of the content pages in one language: the game's names and descriptions (data/i18n/), the game's menu labels
// (data/i18n/ui/) and our own page texts (pages/i18n/, English and French for now). Anything missing falls back to
// English.
import { DEFAULT_LOCALE, type Locale } from '@/i18n'
import en from './i18n/en.json'

interface GameText {
  name: string
  description?: string
}

type Messages = { [key: string]: string | Messages }

const gameTexts = import.meta.glob<Record<string, GameText>>(
  ['../../../data/i18n/*.json', '!../../../data/i18n/languages.json'],
  { eager: true, import: 'default' },
)
const gameUi = import.meta.glob<Record<string, string>>('../../../data/i18n/ui/*.json', { eager: true, import: 'default' })
const pageTexts = import.meta.glob<Messages>('./i18n/*.json', { eager: true, import: 'default' })

type Vars = Record<string, string | number>

function interpolate(text: string, vars: Vars = {}): string {
  return text.replace(/\{(\w+)\}/g, (match, key: string) => (key in vars ? String(vars[key]) : match))
}

function lookup(messages: Messages | undefined, key: string): string | undefined {
  let node: string | Messages | undefined = messages
  for (const part of key.split('.')) node = typeof node === 'object' ? node[part] : undefined
  return typeof node === 'string' ? node : undefined
}

export interface Texts {
  locale: Locale
  /** Displayed name of a game item (line breaks of the Japanese card names shown as spaces). */
  name(id: string): string
  description(id: string): string
  /** A game menu label (data/i18n/ui/), e.g. game('rarity_prime'). */
  game(key: string, vars?: Vars): string
  /** One of our page texts (pages/i18n/), e.g. t('jokers.title', { count: 149 }). */
  t(key: string, vars?: Vars): string
  number(value: number, options?: Intl.NumberFormatOptions): string
  list(items: string[]): string
  date(isoDate: string): string
}

export function textsFor(locale: Locale): Texts {
  const english = gameTexts[`../../../data/i18n/${DEFAULT_LOCALE}.json`]
  const game = gameTexts[`../../../data/i18n/${locale}.json`] ?? english
  const ui = gameUi[`../../../data/i18n/ui/${locale}.json`] ?? {}
  const englishUi = gameUi[`../../../data/i18n/ui/${DEFAULT_LOCALE}.json`]
  const page = pageTexts[`./i18n/${locale.split('-')[0]}.json`]
  return {
    locale,
    name: (id) => (game[id]?.name ?? english[id]?.name ?? id).replace(/\s*\n\s*/g, ' '),
    description: (id) => game[id]?.description ?? english[id]?.description ?? '',
    game: (key, vars) => interpolate(ui[key] ?? englishUi[key] ?? key, vars),
    t: (key, vars) => interpolate(lookup(page, key) ?? lookup(en, key) ?? key, vars),
    number: (value, options) => new Intl.NumberFormat(locale, options).format(value),
    list: (items) => new Intl.ListFormat(locale, { type: 'conjunction' }).format(items),
    date: (isoDate) => new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(new Date(`${isoDate}T00:00:00`)),
  }
}
