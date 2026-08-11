import { describe, expect, it } from 'vitest'

import {
  CandidateError,
  legalCandidates,
  resolveCandidate,
  stateTokenFor,
  type GameAdapter,
  type GameManifest,
} from '../src'

interface State {
  count: number
  actor: string | null
}

interface Action {
  amount: 1 | 2
}

const manifest: GameManifest = {
  id: 'counter',
  version: '1',
  titleKey: 'counter.title',
  descriptionKey: 'counter.description',
  minPlayers: 2,
  maxPlayers: 2,
  information: 'perfect',
  locales: ['en', 'zh-Hans', 'ja'],
}

const adapter: GameAdapter<State, Action, State, undefined> = {
  manifest,
  initialState: () => ({ count: 0, actor: 'a' }),
  serializeState: (state) => state,
  activeActor: (state) => state.actor,
  legalActions: (state, actor) =>
    state.actor === actor && state.count < 3 ? [{ amount: 1 }, { amount: 2 }] : [],
  canonicalAction: (action) => action,
  describeAction: (_state, action) => ({
    titleKey: 'counter.add',
    summaryKey: 'counter.add.summary',
    intent: 'build',
    params: { amount: action.amount },
  }),
  applyAction: (state, action) => ({
    state: { count: state.count + action.amount, actor: 'b' },
    events: [{ type: 'added', messageKey: 'counter.added', params: { amount: action.amount } }],
  }),
  publicView: (state) => state,
  teaching: (_state, action) => ({
    intent: { id: 'intent', evidence: 'authored', messageKey: 'counter.intent' },
    reason: [{ id: 'reason', evidence: 'exact', messageKey: 'counter.reason' }],
    changes: [{ id: 'change', evidence: 'exact', messageKey: 'counter.change', params: { amount: action.amount } }],
    next: { id: 'next', evidence: 'authored', messageKey: 'counter.next' },
    principle: { id: 'principle', evidence: 'authored', messageKey: 'counter.principle' },
  }),
}

describe('bound candidates', () => {
  it('resolves only a legal state-bound action', () => {
    const state = { count: 0, actor: 'a' }
    const [candidate] = legalCandidates(adapter, state, 'a')
    expect(candidate).toBeDefined()
    const resolved = resolveCandidate(adapter, state, {
      candidateId: candidate!.id,
      stateToken: candidate!.stateToken,
      actorId: 'a',
    })
    expect(resolved.transition.state).toEqual({ count: 1, actor: 'b' })
    expect(state).toEqual({ count: 0, actor: 'a' })
  })

  it('rejects stale, unknown, and unauthorized selections', () => {
    const state = { count: 0, actor: 'a' }
    const candidate = legalCandidates(adapter, state, 'a')[0]!
    expect(() =>
      resolveCandidate(adapter, { count: 1, actor: 'a' }, {
        candidateId: candidate.id,
        stateToken: candidate.stateToken,
        actorId: 'a',
      }),
    ).toThrowError(CandidateError)
    expect(() =>
      resolveCandidate(adapter, state, {
        candidateId: 'candidate_missing',
        stateToken: stateTokenFor(adapter, state),
        actorId: 'a',
      }),
    ).toThrow(/not legal/)
    expect(() => legalCandidates(adapter, state, 'b')).toThrow(/does not own/)
  })

  it('binds the active actor and rejects duplicate canonical actions', () => {
    const actorBindingAdapter: typeof adapter = {
      ...adapter,
      serializeState: (state) => ({ count: state.count }),
    }
    expect(stateTokenFor(actorBindingAdapter, { count: 0, actor: 'a' })).not.toBe(
      stateTokenFor(actorBindingAdapter, { count: 0, actor: 'b' }),
    )
    const duplicateAdapter: typeof adapter = {
      ...adapter,
      legalActions: () => [{ amount: 1 }, { amount: 1 }],
    }
    expect(() => legalCandidates(duplicateAdapter, { count: 0, actor: 'a' }, 'a')).toThrow(
      /duplicate canonical/,
    )
  })
})
