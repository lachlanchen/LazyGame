import type { Locale } from './types.js'

export type MessageCatalog = Readonly<Record<string, string>>
export type Catalogs = Readonly<Record<Locale, MessageCatalog>>
export type MessageParams = Readonly<Record<string, string | number | boolean>>

export interface Translator {
  locale: Locale
  t(key: string, params?: MessageParams): string
}

function interpolate(template: string, params: MessageParams): string {
  return template.replace(/\{([A-Za-z0-9_.-]+)\}/g, (whole, name: string) =>
    Object.hasOwn(params, name) ? String(params[name]) : whole,
  )
}

export function createTranslator(
  catalogs: Catalogs,
  locale: Locale,
  fallback: Locale = 'en',
): Translator {
  return {
    locale,
    t(key, params = {}) {
      const template = catalogs[locale][key] ?? catalogs[fallback][key]
      if (template === undefined) return `[${key}]`
      return interpolate(template, params)
    },
  }
}
