// Two kinds of texts: the planner's own interface (src/i18n/ui/, translated by us) and the game texts
// (data/i18n/, official translations, see stores/language.ts).
import { createI18n } from 'vue-i18n'
import en from './ui/en.json'
import fr from './ui/fr.json'

/** The game's 15 languages, as named in data/i18n/. */
export const LOCALES = [
  'de-DE', 'en-US', 'es-419', 'es-ES', 'fr-FR', 'it-IT', 'ja-JP', 'ko-KR',
  'pl-PL', 'pt-BR', 'ru-RU', 'tr-TR', 'uk-UA', 'zh-CN', 'zh-TW',
] as const
export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'en-US'

export type UiMessages = typeof en

// Only some languages have interface texts: the others fall back to English.
const messages: Partial<Record<Locale, UiMessages>> = { 'en-US': en, 'fr-FR': fr }

export const i18n = createI18n({
  legacy: false,
  locale: DEFAULT_LOCALE as Locale,
  fallbackLocale: DEFAULT_LOCALE,
  messages: messages as Record<Locale, UiMessages>,
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
