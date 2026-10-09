// Two kinds of texts: the planner's own interface (src/i18n/ui/, translated by us, English fallback) and the game
// texts (official translations from data/i18n/, see stores/language.ts). The game's menu labels (data/i18n/ui/)
// are merged into the interface messages under the "game" key: t('game.back').
import { createI18n } from 'vue-i18n'
import gameUiEn from '@data/i18n/ui/en-US.json'
import languageNames from '@data/i18n/languages.json'
import en from './ui/en.json'
import fr from './ui/fr.json'

/** The game's 15 languages, as named in data/i18n/. */
export const LOCALES = [
  'de-DE', 'en-US', 'es-419', 'es-ES', 'fr-FR', 'it-IT', 'ja-JP', 'ko-KR',
  'pl-PL', 'pt-BR', 'ru-RU', 'tr-TR', 'uk-UA', 'zh-CN', 'zh-TW',
] as const
export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'en-US'

/** Name of each language, written in that language (from the game). */
export const LANGUAGE_NAMES = languageNames as Record<Locale, string>

export type UiMessages = typeof en & { game: typeof gameUiEn }

// Only some languages have our own interface texts: the others fall back to English.
const messages: Partial<Record<Locale, UiMessages>> = {
  'en-US': { ...en, game: gameUiEn },
  'fr-FR': fr as UiMessages,
}

export const i18n = createI18n({
  legacy: false,
  locale: DEFAULT_LOCALE as Locale,
  fallbackLocale: DEFAULT_LOCALE,
  messages: messages as Record<Locale, UiMessages>,
  // Falling back to English is expected for most languages: no console warning.
  missingWarn: false,
  fallbackWarn: false,
})

/** Picks the game language closest to the browser's, English otherwise. */
export function detectLocale(preferred: readonly string[] = navigator.languages): Locale {
  for (const tag of preferred) {
    const exact = LOCALES.find((l) => l.toLowerCase() === tag.toLowerCase())
    if (exact) return exact
    const sameLanguage = LOCALES.find((l) => l.split('-')[0] === tag.split('-')[0].toLowerCase())
    if (sameLanguage) return sameLanguage
  }
  return DEFAULT_LOCALE
}

/** Keys of the 3 spell slots, as shown by the game: AZERTY keyboards in French, QWERTY otherwise. */
export function spellKeys(locale: string): string[] {
  return locale === 'fr-FR' ? ['A', 'E', 'C'] : ['Q', 'E', 'C']
}
