import { SUPPORTED_LOCALES } from '@lazyingart/game-core'
import { describe, expect, it } from 'vitest'

import { isSupportedLocale, LOCALE_LABELS } from '../src/App'
import { catalogs } from '../src/catalogs'
import { lineManifest } from '../src/lineGame'

function placeholders(value: string): string[] {
  return [...value.matchAll(/\{([A-Za-z0-9_.-]+)\}/g)].map((match) => match[1]!).sort()
}

describe('demo localization', () => {
  it('keeps all 11 catalogs and interpolation contracts aligned', () => {
    const baseline = Object.keys(catalogs.en).sort()
    expect(new Set(Object.keys(catalogs))).toEqual(new Set(SUPPORTED_LOCALES))
    expect(lineManifest.locales).toEqual(SUPPORTED_LOCALES)
    for (const locale of SUPPORTED_LOCALES) {
      expect(Object.keys(catalogs[locale]).sort()).toEqual(baseline)
      for (const key of baseline) {
        expect(placeholders(catalogs[locale][key]!)).toEqual(placeholders(catalogs.en[key]!))
      }
    }
  })

  it('allowlists persisted locale values and labels every selector option', () => {
    expect(Object.keys(LOCALE_LABELS)).toEqual([...SUPPORTED_LOCALES])
    for (const locale of SUPPORTED_LOCALES) expect(isSupportedLocale(locale)).toBe(true)
    expect(isSupportedLocale('en<script>')).toBe(false)
    expect(isSupportedLocale(null)).toBe(false)
  })
})
