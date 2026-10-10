import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LOCALE_STORAGE_KEY, useLanguageStore } from './language'

function memoryStorage() {
  const items = new Map<string, string>()
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
    removeItem: (key: string) => void items.delete(key),
  }
}

/** A fresh page load: new Pinia, same storage. */
async function reload() {
  setActivePinia(createPinia())
  const language = useLanguageStore()
  await language.init()
  return language
}

describe('language store', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', memoryStorage())
    vi.stubGlobal('document', { documentElement: {} })
    vi.stubGlobal('navigator', { languages: ['de-DE'] })
  })

  it("starts in the browser's language", async () => {
    expect((await reload()).locale).toBe('de-DE')
  })

  it('remembers the language picked in the menu', async () => {
    await (await reload()).chooseLocale('ja-JP')
    expect((await reload()).locale).toBe('ja-JP')
  })

  it('ignores an unknown saved language', async () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, 'xx-XX')
    expect((await reload()).locale).toBe('de-DE')
  })

  it('works without storage', async () => {
    vi.stubGlobal('localStorage', undefined)
    const language = await reload()
    await language.chooseLocale('fr-FR')
    expect(language.locale).toBe('fr-FR')
  })
})
