import type { BoundCandidate } from '@lazyingart/game-core'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { CandidateList, documentMetadata, EvidenceBadge, GameFrame } from '../src'

const candidate: BoundCandidate<{ cell: number }> = {
  id: 'candidate_1',
  stateToken: 'state_1',
  actorId: 'sun',
  action: { cell: 4 },
  titleKey: 'candidate.title',
  summaryKey: 'candidate.summary',
  intent: 'center',
}

describe('shared teaching components', () => {
  it('renders evidence provenance as data, text, and class', () => {
    const html = renderToStaticMarkup(<EvidenceBadge kind="exact" label="Exact" />)
    expect(html).toContain('data-evidence="exact"')
    expect(html).toContain('game-evidence-exact')
    expect(html).toContain('Exact')
  })

  it('keeps candidate selection accessible to pointer and keyboard users', () => {
    const html = renderToStaticMarkup(
      <CandidateList
        candidates={[candidate]}
        selectedId="candidate_1"
        inspectedId={null}
        visualId="candidate_1"
        title={() => 'Center'}
        summary={() => 'Four lines'}
        onInspect={() => undefined}
        onSelect={() => undefined}
        heading="Legal ideas"
      />,
    )
    expect(html).toContain('aria-pressed="true"')
    expect(html).toContain('data-candidate-id="candidate_1"')
    expect(html).toContain('aria-current="true"')
    expect(html).toContain('Legal ideas')
  })

  it('exposes the active locale and language selector in the frame', () => {
    const html = renderToStaticMarkup(
      <GameFrame
        title="Teacher"
        subtitle="Demo"
        locale="ja"
        localeLabels={{
          en: 'English', ar: 'العربية', es: 'Español', fr: 'Français', ja: '日本語',
          ko: '한국어', vi: 'Tiếng Việt', 'zh-Hans': '简体中文', 'zh-Hant': '繁體中文',
          de: 'Deutsch', ru: 'Русский',
        }}
        languageLabel="言語"
        onLocaleChange={() => undefined}
        board={<div>Board</div>}
        teaching={<div>Teaching</div>}
        actions={<button type="button">Commit</button>}
      />,
    )
    expect(html).toContain('data-locale="ja"')
    expect(html).toContain('data-testid="locale-switch"')
    expect(html).toContain('>言語</span>')
    expect(html).toContain('<option value="ja" selected="">日本語</option>')
  })

  it('derives localized document metadata and RTL direction', () => {
    expect(documentMetadata('ar', 'إطار تعليم الألعاب', 'درس بقواعد حتمية')).toEqual({
      locale: 'ar',
      direction: 'rtl',
      title: 'إطار تعليم الألعاب',
      description: 'درس بقواعد حتمية',
    })
    expect(documentMetadata('de', 'Spielunterricht', 'Deterministische Regeln').direction).toBe('ltr')
  })
})
