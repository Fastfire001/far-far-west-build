import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { SETTINGS_STORAGE_KEY, useSettingsStore } from './settings'

function memoryStorage() {
  const items = new Map<string, string>()
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
    removeItem: (key: string) => void items.delete(key),
  }
}

/** A fresh page load: new Pinia, same storage. */
function reload() {
  setActivePinia(createPinia())
  return useSettingsStore()
}

describe('settings store', () => {
  beforeEach(() => vi.stubGlobal('localStorage', memoryStorage()))

  it('remembers the settings', async () => {
    expect(reload().settings.summaryInEnglish).toBe(false)
    reload().settings.summaryInEnglish = true
    await nextTick()
    expect(reload().settings.summaryInEnglish).toBe(true)
  })

  it('ignores unknown or broken saved settings', () => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ summaryInEnglish: 'yes', other: 1 }))
    expect(reload().settings).toEqual({ summaryInEnglish: false })
    localStorage.setItem(SETTINGS_STORAGE_KEY, '{')
    expect(reload().settings).toEqual({ summaryInEnglish: false })
  })

  it('works without storage', () => {
    vi.stubGlobal('localStorage', undefined)
    reload().settings.summaryInEnglish = true
  })
})
