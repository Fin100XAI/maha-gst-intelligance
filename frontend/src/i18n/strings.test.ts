import { describe, expect, it } from 'vitest'
import { LANGUAGES, STRINGS } from './strings'

describe('bilingual from day one (docs/03 section 1)', () => {
  it('ships English and Marathi', () => {
    expect(LANGUAGES).toEqual(['en', 'mr'])
  })

  it('translates every key, with no English leaking into Marathi', () => {
    const englishKeys = Object.keys(STRINGS.en)
    const marathiKeys = Object.keys(STRINGS.mr)
    expect(marathiKeys.sort()).toEqual(englishKeys.sort())

    for (const key of englishKeys) {
      const marathi = STRINGS.mr[key as keyof typeof STRINGS.mr]
      expect(marathi.trim()).not.toBe('')
      // Every Marathi string must contain Devanagari.  A key copied across
      // untranslated is exactly what makes a deployment read as a pilot.
      expect(marathi).toMatch(/[ऀ-ॿ]/)
    }
  })

  it('keeps placeholders identical across languages', () => {
    for (const key of Object.keys(STRINGS.en) as (keyof typeof STRINGS.en)[]) {
      const placeholders = (text: string): string[] =>
        [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1] ?? '').sort()
      expect(placeholders(STRINGS.mr[key])).toEqual(placeholders(STRINGS.en[key]))
    }
  })
})
