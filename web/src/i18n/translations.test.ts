// Our own translations (interface and content pages), in English and French only: the French file has the keys of the
// English file, with the same variables and the same number of plural forms, and nothing else.
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
    expect(Object.keys(translated).sort()).toEqual(Object.keys(english).sort())
    for (const [key, text] of Object.entries(english)) {
      expect(variables(translated[key]), `${locale} ${key}`).toEqual(variables(text))
      expect(pluralForms(translated[key]), `${locale} ${key}`).toBe(pluralForms(text))
      expect(translated[key].trim(), `${locale} ${key}`).not.toBe('')
    }
  })
})
