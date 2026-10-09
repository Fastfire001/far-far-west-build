// Current language, for both kinds of texts: the planner's interface (vue-i18n, src/i18n/ui/) and the official
// game texts (names, descriptions) keyed by game id. Each game language file (data/i18n/) is loaded on demand;
// a missing text falls back to the English one from data/.
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { equipment, jokers, spells, spellSchools, upgrades } from '@/domain/gameData'
import { DEFAULT_LOCALE, i18n, type Locale } from '@/i18n'

interface GameText {
  name: string
  description?: string
}
type GameTexts = Record<string, GameText>

const loaders = import.meta.glob<GameTexts>('../../../data/i18n/*.json', { import: 'default' })

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
    const loaded = load ? await load() : {}
    // Switch everything at once, once the game texts are there.
    texts.value = loaded
    locale.value = value
    i18n.global.locale.value = value
    document.documentElement.lang = value
  }

  /** Displayed name of a game item. Japanese names contain line breaks to fit on the cards: shown as spaces. */
  function gameName(id: string): string {
    const name = texts.value[id]?.name ?? english[id]?.name ?? id
    return name.replace(/\s*\n\s*/g, ' ')
  }

  function gameDescription(id: string): string {
    return texts.value[id]?.description ?? english[id]?.description ?? ''
  }

  return { locale, setLocale, gameName, gameDescription }
})
