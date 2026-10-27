// Current language, for both kinds of texts: the planner's interface (vue-i18n, src/i18n/ui/) and the official
// game texts (names, descriptions) keyed by game id. Each game language file (data/i18n/) is loaded on demand;
// a missing text falls back to the English one from data/. The language picked in the menu is remembered in
// localStorage; otherwise (or if storage is blocked) the browser's language is used. A screen can show another
// language for as long as it is open (force), without changing the one picked.
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { equipment, jokers, spells, spellSchools, upgrades } from '@/domain/gameData'
import { DEFAULT_LOCALE, detectLocale, i18n, loadUiMessages, LOCALES, type Locale } from '@/i18n'

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
  /** Language shown. */
  const locale = ref<Locale>(DEFAULT_LOCALE)
  /** Language picked by the user (or detected): the one shown, unless a screen forces another. */
  const chosen = ref<Locale>(DEFAULT_LOCALE)
  const forced = ref<Locale | null>(null)
  const texts = ref<GameTexts>({})

  async function setLocale(value: Locale): Promise<void> {
    const load = loaders[`../../../data/i18n/${value}.json`]
    const loadUi = uiLoaders[`../../../data/i18n/ui/${value}.json`]
    const [loaded, ui, own] = await Promise.all([load ? load() : {}, loadUi ? loadUi() : {}, loadUiMessages(value)])
    // Another language was asked for while this one was loading.
    if (value !== (forced.value ?? chosen.value)) return
    // Switch everything at once, once the game texts are there.
    i18n.global.mergeLocaleMessage(value, { ...own, game: ui })
    texts.value = loaded
    locale.value = value
    i18n.global.locale.value = value
    document.documentElement.lang = value
  }

  /** Startup: the language picked last time, else the browser's. */
  function init(): Promise<void> {
    chosen.value = savedLocale() ?? detectLocale()
    return setLocale(chosen.value)
  }

  /** Language picked by the user: remembered for the next visits. */
  function chooseLocale(value: Locale): Promise<void> {
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, value)
    } catch {
      // Storage blocked: the choice only lasts until the page is closed.
    }
    chosen.value = value
    return setLocale(forced.value ?? value)
  }

  /** Shows a language other than the chosen one, until force(null). */
  function force(value: Locale | null): Promise<void> {
    forced.value = value
    return setLocale(value ?? chosen.value)
  }

  /** Displayed name of a game item. Japanese names contain line breaks to fit on the cards: shown as spaces. */
  function gameName(id: string): string {
    const name = texts.value[id]?.name ?? english[id]?.name ?? id
    return name.replace(/\s*\n\s*/g, ' ')
  }

  function gameDescription(id: string): string {
    return texts.value[id]?.description ?? english[id]?.description ?? ''
  }

  return { locale, chosen, init, chooseLocale, force, gameName, gameDescription }
})
