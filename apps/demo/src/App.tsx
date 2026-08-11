import {
  SUPPORTED_LOCALES,
  SessionRepository,
  createTranslator,
  replaySession,
  stateTokenFor,
  type Locale,
  type TeachingClaim,
} from '@lazyingart/game-core'
import { CandidateList, EvidenceBadge, GameFrame, useGameController } from '@lazyingart/game-react'
import { useMemo, useState } from 'react'

import { catalogs } from './catalogs'
import { lineAdapter, type LineState } from './lineGame'

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  ar: 'العربية',
  es: 'Español',
  fr: 'Français',
  ja: '日本語',
  ko: '한국어',
  vi: 'Tiếng Việt',
  'zh-Hans': '简体中文',
  'zh-Hant': '繁體中文',
  de: 'Deutsch',
  ru: 'Русский',
}

export function isSupportedLocale(value: string | null): value is Locale {
  return value !== null && (SUPPORTED_LOCALES as readonly string[]).includes(value)
}

function TeachingCard({ claim, t }: { claim: TeachingClaim; t: ReturnType<typeof createTranslator>['t'] }) {
  return (
    <article className="teaching-claim">
      <EvidenceBadge kind={claim.evidence} label={t(`evidence.${claim.evidence}`)} />
      <div>
        <p>{t(claim.messageKey, claim.params)}</p>
        {claim.source && <small className="teaching-source">{claim.source}</small>}
        {claim.limitationKey && <small className="teaching-limitation">{t(claim.limitationKey)}</small>}
      </div>
    </article>
  )
}

export function App() {
  const [locale, setLocale] = useState<Locale>(() => {
    const stored = localStorage.getItem('game-demo.locale')
    return isSupportedLocale(stored) ? stored : 'en'
  })
  const repository = useMemo(
    () => new SessionRepository<LineState>(localStorage, {
      prefix: 'game-demo.sessions.v2',
      stateToken: (state) => stateTokenFor(lineAdapter, state),
    }),
    [],
  )
  const [session, setSession] = useState(() =>
    repository.resumeOrCreate(
      'line-and-light',
      'default',
      () => lineAdapter.initialState(undefined, 'demo'),
      { gameVersion: lineAdapter.manifest.version, seed: 'demo', config: null },
    ).session,
  )
  const verifiedState = useMemo(() => replaySession(lineAdapter, session), [session])
  const controller = useGameController(lineAdapter, verifiedState)
  const translator = useMemo(() => createTranslator(catalogs, locale), [locale])
  const { t } = translator
  const visibleCandidate = controller.visualCandidate
  const selectedCandidate = controller.candidates.find((candidate) => candidate.id === controller.selectedId) ?? null
  const previewState = controller.preview?.state ?? controller.state

  function changeLocale(next: Locale) {
    localStorage.setItem('game-demo.locale', next)
    setLocale(next)
  }

  function commit() {
    const transition = controller.selectedTransition
    const teaching = controller.selectedTeaching
    if (!transition || !selectedCandidate || !teaching) return
    const requestId = crypto.randomUUID()
    const updated = repository.mutate(
      session.id,
      session.revision,
      requestId,
      { candidateId: selectedCandidate.id },
      () => transition.state,
      {
        candidateId: selectedCandidate.id,
        actorId: selectedCandidate.actorId,
        stateTokenBefore: selectedCandidate.stateToken,
        stateTokenAfter: stateTokenFor(lineAdapter, transition.state),
        canonicalAction: lineAdapter.canonicalAction(selectedCandidate.action),
        events: transition.events,
        teaching,
      },
    )
    setSession(updated)
    controller.replaceState(updated.state)
  }

  function reset() {
    repository.delete(session.id, session.revision)
    const seed = crypto.randomUUID()
    const fresh = repository.resumeOrCreate(
      'line-and-light',
      'default',
      () => lineAdapter.initialState(undefined, seed),
      { gameVersion: lineAdapter.manifest.version, seed, config: null },
    ).session
    replaySession(lineAdapter, fresh)
    setSession(fresh)
    controller.replaceState(fresh.state)
  }

  const finishedKey = controller.state.winner ? `app.finished.${controller.state.winner}` : null

  return (
    <GameFrame
      title={t('app.title')}
      subtitle={t('app.subtitle')}
      locale={locale}
      localeLabels={LOCALE_LABELS}
      languageLabel={t('action.language')}
      onLocaleChange={changeLocale}
      toolbar={<button type="button" onClick={reset}>{t('action.reset')}</button>}
      board={(
        <div className="demo-board-wrap">
          <div className="demo-status" aria-live="polite">
            <span>{t('app.demo')}</span>
            <strong>{finishedKey ? t(finishedKey) : t('app.turn', { mark: t(`mark.${controller.state.turn}`) })}</strong>
            <small>{t('app.resume')}</small>
          </div>
          <div className="demo-board" role="grid" aria-label={t('app.demo')} data-testid="demo-board">
            {previewState.board.map((previewMark, index) => {
              const committedMark = controller.state.board[index]
              const candidate = controller.candidates.find((item) => item.action.cell === index)
              const inspectedGhost = !committedMark && candidate?.id === visibleCandidate?.id
              const selectedGhost = !committedMark && Boolean(previewMark)
              const ghost = inspectedGhost || selectedGhost
              const displayMark = committedMark ?? (ghost ? previewMark ?? controller.state.turn : null)
              return (
                <button
                  key={index}
                  type="button"
                  role="gridcell"
                  className={`demo-cell ${committedMark ?? ''} ${ghost ? 'ghost' : ''}`}
                  aria-label={`${Math.floor(index / 3) + 1}, ${(index % 3) + 1}`}
                  aria-selected={candidate?.id === controller.selectedId}
                  disabled={Boolean(committedMark) || !candidate}
                  onPointerEnter={() => candidate && controller.inspect(candidate.id)}
                  onPointerLeave={() => controller.inspect(null)}
                  onFocus={() => candidate && controller.inspect(candidate.id)}
                  onBlur={() => controller.inspect(null)}
                  onClick={() => candidate && controller.select(candidate.id)}
                >
                  {displayMark ? (displayMark === 'sun' ? '●' : '○') : ''}
                </button>
              )
            })}
          </div>
          {controller.selectedId && <div className="preview-notice">{t('teaching.preview')}</div>}
        </div>
      )}
      teaching={(
        <div className="teaching-stack">
          <CandidateList
            candidates={controller.candidates}
            selectedId={controller.selectedId}
            inspectedId={controller.inspectedId}
            visualId={visibleCandidate?.id ?? null}
            title={(candidate) => t(candidate.titleKey, candidate.params)}
            summary={(candidate) => t(candidate.summaryKey, candidate.params)}
            onInspect={controller.inspect}
            onSelect={controller.select}
            heading={t('candidate.heading')}
          />
          <section className="teacher-panel" aria-live="polite">
            <h2>{t('teaching.heading')}</h2>
            {controller.teaching ? (
              <>
                <TeachingCard claim={controller.teaching.intent} t={t} />
                {controller.teaching.reason.map((claim) => <TeachingCard key={claim.id} claim={claim} t={t} />)}
                {controller.teaching.changes.map((claim) => <TeachingCard key={claim.id} claim={claim} t={t} />)}
                {controller.teaching.reply && <TeachingCard claim={controller.teaching.reply} t={t} />}
                <TeachingCard claim={controller.teaching.next} t={t} />
                <TeachingCard claim={controller.teaching.principle} t={t} />
              </>
            ) : <p>{t('teaching.select')}</p>}
          </section>
        </div>
      )}
      actions={(
        <>
          <button type="button" onClick={controller.clear} disabled={!controller.selectedId}>
            {t('action.cancel')}
          </button>
          <button type="button" className="primary" onClick={commit} disabled={!controller.selectedId}>
            {t('action.commit')}
          </button>
        </>
      )}
    />
  )
}
