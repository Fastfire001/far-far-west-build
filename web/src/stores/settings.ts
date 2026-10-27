// The planner's settings (Settings dialog of the builds menu), remembered in localStorage. Without storage they only
// last until the page is closed.
import { defineStore } from 'pinia'
import { reactive, watch } from 'vue'

export const SETTINGS_STORAGE_KEY = 'ffw-build-planner-settings'

export interface Settings {
  /** The summary sheet is shown in English, whatever the language picked. */
  summaryInEnglish: boolean
}

const DEFAULTS: Settings = { summaryInEnglish: false }

/** Saved settings, keeping only the known ones with the right type. */
function saved(): Partial<Settings> {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) ?? '{}')
    if (typeof data !== 'object' || data === null) return {}
    return Object.fromEntries(
      Object.entries(data).filter(([key, value]) => key in DEFAULTS && typeof value === typeof DEFAULTS[key as keyof Settings]),
    )
  } catch {
    return {}
  }
}

export const useSettingsStore = defineStore('settings', () => {
  const settings = reactive<Settings>({ ...DEFAULTS, ...saved() })

  watch(settings, () => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
    } catch {
      // Storage blocked: the settings only last until the page is closed.
    }
  })

  return { settings }
})
