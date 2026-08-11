import { describe, expect, it } from 'vitest'

import {
  canView,
  createTranslator,
  validateTeachingBundle,
  visibleValues,
  type Catalogs,
} from '../src'

const catalogs: Catalogs = {
  en: { hello: 'Hello {name}', fallback: 'English only' },
  ar: { hello: 'مرحبًا {name}' },
  es: { hello: 'Hola {name}' },
  fr: { hello: 'Bonjour {name}' },
  'zh-Hans': { hello: '你好，{name}' },
  'zh-Hant': { hello: '你好，{name}' },
  ja: { hello: 'こんにちは、{name}' },
  ko: { hello: '안녕하세요, {name}' },
  vi: { hello: 'Xin chào {name}' },
  de: { hello: 'Hallo {name}' },
  ru: { hello: 'Здравствуйте, {name}' },
}

describe('i18n and visibility', () => {
  it('translates with explicit fallback and visible missing keys', () => {
    const zh = createTranslator(catalogs, 'zh-Hans')
    expect(zh.t('hello', { name: '小明' })).toBe('你好，小明')
    expect(zh.t('fallback')).toBe('English only')
    expect(zh.t('unknown')).toBe('[unknown]')
  })

  it('redacts actor, team, and server-only values', () => {
    const viewer = { role: 'player' as const, actorId: 'north', teamId: 'red' }
    expect(canView({ kind: 'actor', actorId: 'north' }, viewer)).toBe(true)
    expect(canView({ kind: 'actor', actorId: 'south' }, viewer)).toBe(false)
    expect(canView(
      { kind: 'actor', actorId: 'north' },
      { role: 'spectator', actorId: 'north' } as never,
    )).toBe(false)
    expect(canView({ kind: 'actor' } as never, { role: 'companion' } as never)).toBe(false)
    expect(canView({ kind: 'team' } as never, { role: 'player', actorId: 'p' } as never)).toBe(false)
    expect(canView({ kind: 'actor', actorId: ' ' }, { role: 'player', actorId: ' ' })).toBe(false)
    expect(canView(
      { kind: 'actor', actorId: 'north' },
      { role: 'unknown', actorId: 'north' } as never,
    )).toBe(false)
    expect(canView(
      { kind: 'team', teamId: 'red' },
      { role: 'spectator', teamId: 'red' } as never,
    )).toBe(false)
    expect(
      visibleValues(
        [
          { visibility: { kind: 'public' }, value: 'table' },
          { visibility: { kind: 'team', teamId: 'red' }, value: 'partner' },
          { visibility: { kind: 'server' }, value: 'deck' },
        ],
        viewer,
      ),
    ).toEqual(['table', 'partner'])
  })

  it('requires sources and limitations where provenance needs them', () => {
    const base = {
      intent: { id: 'i', evidence: 'authored' as const, messageKey: 'intent' },
      reason: [{ id: 'r', evidence: 'engine' as const, messageKey: 'reason', source: 'Engine 1' }],
      changes: [{ id: 'c', evidence: 'exact' as const, messageKey: 'change' }],
      next: { id: 'n', evidence: 'authored' as const, messageKey: 'next' },
      principle: { id: 'p', evidence: 'authored' as const, messageKey: 'principle' },
    }
    expect(validateTeachingBundle(base)).toBe(base)
    expect(() =>
      validateTeachingBundle({
        ...base,
        reason: [{ id: 'r', evidence: 'engine', messageKey: 'reason' }],
      }),
    ).toThrow(/named source/)
    expect(() => validateTeachingBundle({
      ...base,
      next: { id: 'n', evidence: 'model', messageKey: 'next', limitationKey: '   ' },
    })).toThrow(/explicit limitation/)
  })
})
