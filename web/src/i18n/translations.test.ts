// Our own texts (interface and content pages), in English and French only, written by hand: no AI text or translation
// (request of the game's team). A text not written yet is "todo". French has no key that English does not have, and
// each French text has the variables and number of plural forms of the English one, once both are written.
import { describe, expect, it } from 'vitest'

type Messages = { [key: string]: string | Messages }

const sets = {
  interface: import.meta.glob<Messages>('./ui/*.json', { eager: true, import: 'default' }),
  pages: import.meta.glob<Messages>('../pages/i18n/*.json', { eager: true, import: 'default' }),
}

function flatten(messages: Messages, prefix = ''): Record<string, string> {
  return Object.fromEntries(
    Object.entries(messages).flatMap(([key, value]) =>
      typeof value === 'string' ? [[prefix + key, value]] : Object.entries(flatten(value, `${prefix}${key}.`)),
    ),
  )
}

const variables = (text: string) => [...new Set(text.match(/\{\w+\}/g) ?? [])].sort()
const pluralForms = (text: string) => text.split(' | ').length

describe.each(Object.entries(sets))('%s translations', (_, files) => {
  const fileOf = (locale: string) => Object.entries(files).find(([path]) => path.endsWith(`/${locale}.json`))?.[1]
  const english = flatten(fileOf('en-US')!)

  it('has an English and a French file', () => {
    expect(Object.keys(files).map((path) => path.split('/').pop()!.replace('.json', '')).sort()).toEqual(['en-US', 'fr-FR'])
  })

  it.each(['fr-FR'])('%s matches the English keys, variables and plural forms', (locale) => {
    const translated = flatten(fileOf(locale) ?? {})
    expect(Object.keys(translated).filter((key) => !(key in english))).toEqual([])
    const written = (text: string | undefined) => text !== undefined && text !== 'todo'
    for (const [key, text] of Object.entries(english).filter(([key, text]) => written(text) && written(translated[key]))) {
      expect(variables(translated[key]), `${locale} ${key}`).toEqual(variables(text))
      expect(pluralForms(translated[key]), `${locale} ${key}`).toBe(pluralForms(text))
      expect(translated[key].trim(), `${locale} ${key}`).not.toBe('')
    }
  })
})
