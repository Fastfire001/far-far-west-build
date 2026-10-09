// Texts and links of the validation problems (src/domain/validation.ts) for the interface.
import { useI18n } from 'vue-i18n'
import type { RouteLocationRaw } from 'vue-router'
import type { Build, CarrierKey } from '@/domain/build'
import type { Problem } from '@/domain/validation'
import { useLanguageStore } from '@/stores/language'
import { spellKeys } from '.'

export function useProblemText() {
  const { t, locale } = useI18n()
  const language = useLanguageStore()

  /** Displayed name of a carrier: the hero, or its weapon (or the slot name when none is chosen). */
  function carrierName(build: Build, carrier: CarrierKey): string {
    if (carrier === 'hero') return t('game.hero')
    const weapon = build[carrier].weapon
    return weapon ? language.gameName(weapon) : t(carrier === 'main' ? 'game.main_weapon' : 'game.sidearm')
  }

  function problemText(build: Build, problem: Problem): string {
    const code = problem.code === 'missing_weapon' ? `missing_weapon_${problem.section}` : problem.code
    const carrier = problem.section === 'utility' || problem.section === 'spells' ? '' : carrierName(build, problem.section)
    return t(`problem.${code}`, {
      ...problem.params,
      name: problem.id ? language.gameName(problem.id) : '',
      carrier,
      key: problem.params?.slot !== undefined ? spellKeys(locale.value)[problem.params.slot] : '',
    })
  }

  return { carrierName, problemText }
}

/** Screen where a problem can be fixed. */
export function problemRoute(build: Build, problem: Problem): RouteLocationRaw {
  const section = problem.section
  if (section === 'spells') return { name: 'spells' }
  if (section === 'utility') return { name: 'pick', params: { slot: 'utility' } }
  if (section === 'hero') return { name: 'customize', params: { carrier: 'hero' } }
  const chosen = build[section].weapon !== null && problem.code !== 'missing_weapon' && problem.code !== 'wrong_item'
  return chosen ? { name: 'customize', params: { carrier: section } } : { name: 'pick', params: { slot: section } }
}
