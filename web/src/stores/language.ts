// Current language, for both kinds of texts: the planner's interface (vue-i18n, src/i18n/ui/) and the official
// game texts (names, descriptions) keyed by game id. Each game language file (data/i18n/) is loaded on demand;
// a missing text falls back to the English one from data/. The language picked in the menu is remembered in
// localStorage; otherwise (or if storage is blocked) the browser's language is used.
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { equipment, jokers, spells, spellSchools, upgrades } from '@/domain/gameData'
import { DEFAULT_LOCALE, detectLocale, i18n, LOCALES, type Locale } from '@/i18n'

interface GameText {
  name: string
  description?: string
}
type GameTexts = Record<string, GameText>

export const LOCALE_STORAGE_KEY = 'ffw-build-planner-locale'

function savedLocale(): Locale | null {
  try {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY)
    return LOCALES.find((l) => l === saved) ?? null
  } catch {
    return null
  }
}

const loaders = import.meta.glob<GameTexts>(['../../../data/i18n/*.json', '!../../../data/i18n/languages.json'], { import: 'default' })
const uiLoaders = import.meta.glob<Record<string, string>>('../../../data/i18n/ui/*.json', { import: 'default' })

const english: GameTexts = Object.fromEntries(
  [...equipment, ...spellSchools, ...spells, ...jokers, ...upgrades].map((item) => [
    item.id,
    { name: item.name, description: 'description' in item ? item.description : undefined },
  ]),
)

export const useLanguageStore = defineStore('language', () => {
  const locale = ref<Locale>(DEFAULT_LOCALE)
  const texts = ref<GameTexts>({})

  async function setLocale(value: Locale): Promise<void> {
    const load = loaders[`../../../data/i18n/${value}.json`]
    const loadUi = uiLoaders[`../../../data/i18n/ui/${value}.json`]
    const [loaded, ui] = await Promise.all([load ? load() : {}, loadUi ? loadUi() : {}])
    // Switch everything at once, once the game texts are there.
    i18n.global.mergeLocaleMessage(value, { game: ui })
    texts.value = loaded
    locale.value = value
    i18n.global.locale.value = value
    document.documentElement.lang = value
  }

  /** Startup: the language picked last time, else the browser's. */
  function init(): Promise<void> {
    return setLocale(savedLocale() ?? detectLocale())
  }

  /** Language picked by the user: remembered for the next visits. */
  function chooseLocale(value: Locale): Promise<void> {
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, value)
    } catch {
      // Storage blocked: the choice only lasts until the page is closed.
    }
    return setLocale(value)
  }

  /** Displayed name of a game item. Japanese names contain line breaks to fit on the cards: shown as spaces. */
  function gameName(id: string): string {
    const name = texts.value[id]?.name ?? english[id]?.name ?? id
    return name.replace(/\s*\n\s*/g, ' ')
  }

  function gameDescription(id: string): string {
    return texts.value[id]?.description ?? english[id]?.description ?? ''
  }

  return { locale, init, chooseLocale, gameName, gameDescription }
})
