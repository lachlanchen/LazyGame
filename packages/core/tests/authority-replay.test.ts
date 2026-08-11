import { describe, expect, it } from 'vitest'

import {
  DelegationError,
  MemoryStorage,
  SessionRepository,
  DelegationRegistry,
  legalCandidates,
  replaySession,
  resolveCandidate,
  stateTokenFor,
  type GameActor,
  type GameAdapter,
} from '../src'

interface State {
  value: number
  actor: 'learner' | 'opponent' | null
}

interface Action {
  amount: 1
}

const adapter: GameAdapter<State, Action, State, null> = {
  manifest: {
    id: 'replay-demo',
    version: '1',
    titleKey: 'title',
    descriptionKey: 'description',
    minPlayers: 2,
    maxPlayers: 2,
    information: 'perfect',
    locales: ['en', 'zh-Hans', 'ja'],
  },
  initialState: () => ({ value: 0, actor: 'learner' }),
  serializeState: (state) => state,
  activeActor: (state) => state.actor,
  legalActions: (state, actorId) => state.actor === actorId ? [{ amount: 1 }] : [],
  canonicalAction: (action) => action,
  describeAction: () => ({ titleKey: 'move', summaryKey: 'move.summary', intent: 'build' }),
  applyAction: (state, action, actorId) => ({
    state: { value: state.value + action.amount, actor: 'opponent' },
    events: [{ type: 'moved', actorId, messageKey: 'event.moved' }],
  }),
  publicView: (state) => state,
  teaching: () => ({
    intent: { id: 'intent', evidence: 'authored', messageKey: 'teach.intent' },
    reason: [{ id: 'reason', evidence: 'exact', messageKey: 'teach.reason' }],
    changes: [{ id: 'change', evidence: 'exact', messageKey: 'teach.change' }],
    next: { id: 'next', evidence: 'authored', messageKey: 'teach.next' },
    principle: { id: 'principle', evidence: 'authored', messageKey: 'teach.principle' },
  }),
}

const actors: GameActor[] = [
  { id: 'learner', role: 'human', labelKey: 'actor.learner' },
  { id: 'helper', role: 'player-agent', labelKey: 'actor.helper' },
  { id: 'companion', role: 'companion', labelKey: 'actor.companion' },
]

describe('delegation and replay authority', () => {
  it('allows one state-bound player-agent choice but never companion authority', () => {
    const state = adapter.initialState(null, 'seed')
    const candidate = legalCandidates(adapter, state, 'learner')[0]!
    let grantSequence = 0
    const registry = new DelegationRegistry(() => `grant-${++grantSequence}`)
    expect(() => registry.issue('session-a', adapter, state, actors, 'learner', 'companion')).toThrow(
      DelegationError,
    )
    const superseded = registry.issue('session-a', adapter, state, actors, 'learner', 'helper')
    const grant = registry.issue('session-a', adapter, state, actors, 'learner', 'helper')
    expect(() => registry.resolve(
      'session-a',
      adapter,
      state,
      { candidateId: candidate.id, stateToken: candidate.stateToken, actorId: 'learner' },
      'helper',
      superseded.id,
    )).toThrow(/unknown/)
    expect(() => registry.resolve(
      'session-b',
      adapter,
      state,
      { candidateId: candidate.id, stateToken: candidate.stateToken, actorId: 'learner' },
      'helper',
      grant.id,
    )).toThrow(/another state/)
    const resolved = registry.resolve(
      'session-a',
      adapter,
      state,
      { candidateId: candidate.id, stateToken: candidate.stateToken, actorId: 'learner' },
      'helper',
      grant.id,
    )
    expect(resolved.transition.state.value).toBe(1)
    expect(resolved.delegation).toMatchObject({
      scopeId: 'session-a', candidateId: candidate.id,
      delegatedByActorId: 'learner', chosenByActorId: 'helper',
    })
    expect(() => registry.resolve(
      'session-a',
      adapter,
      state,
      { candidateId: candidate.id, stateToken: candidate.stateToken, actorId: 'learner' },
      'helper',
      grant.id,
    )).toThrow(/consumed/)
  })

  it('persists delegation only from the registry-issued session-bound proof', () => {
    const repository = new SessionRepository<State>(new MemoryStorage(), {
      idFactory: () => 'session-a',
      stateToken: (state) => stateTokenFor(adapter, state),
    })
    const session = repository.resumeOrCreate(
      adapter.manifest.id, 'delegated', () => adapter.initialState(null, 'seed'),
      { gameVersion: adapter.manifest.version, seed: 'seed', config: null },
    ).session
    const candidate = legalCandidates(adapter, session.state, 'learner')[0]!
    const registry = new DelegationRegistry(() => 'one')
    const grant = registry.issue(session.id, adapter, session.state, actors, 'learner', 'helper')
    const resolved = registry.resolve(session.id, adapter, session.state, {
      candidateId: candidate.id, stateToken: candidate.stateToken, actorId: 'learner',
    }, 'helper', grant.id)
    const baseRecord = {
      candidateId: candidate.id,
      actorId: candidate.actorId,
      stateTokenBefore: candidate.stateToken,
      stateTokenAfter: stateTokenFor(adapter, resolved.transition.state),
      canonicalAction: adapter.canonicalAction(candidate.action),
      events: resolved.transition.events,
      teaching: resolved.teaching,
    }
    expect(() => repository.mutate(
      session.id, session.revision, 'forged', {}, () => resolved.transition.state,
      { ...baseRecord, chosenByActorId: 'helper', delegationId: 'forged' } as never,
    )).toThrow(/issued delegation proof/)
    expect(() => repository.mutate(
      session.id, session.revision, 'wrong-candidate', {}, () => resolved.transition.state,
      { ...baseRecord, candidateId: 'candidate_other', delegation: resolved.delegation },
    )).toThrow(/issued capability/)
    const updated = repository.mutate(
      session.id, session.revision, 'delegated', {}, () => resolved.transition.state,
      { ...baseRecord, delegation: resolved.delegation },
    )
    expect(updated.history[0]).toMatchObject({
      chosenByActorId: 'helper', delegationId: 'delegation_one', delegationScopeId: session.id,
    })
    expect(replaySession(adapter, updated)).toEqual(updated.state)
    const tampered = structuredClone(updated)
    tampered.history[0]!.delegationScopeId = 'session-b'
    expect(() => replaySession(adapter, tampered)).toThrow(/delegation provenance/)
  })

  it('burns a proof before a reducer can re-enter another repository', () => {
    const makeRepository = () => new SessionRepository<State>(new MemoryStorage(), {
      idFactory: () => 'shared-session-id',
      stateToken: (state) => stateTokenFor(adapter, state),
    })
    const left = makeRepository()
    const right = makeRepository()
    const metadata = { gameVersion: adapter.manifest.version, seed: 'seed', config: null }
    const leftSession = left.resumeOrCreate(
      adapter.manifest.id, 'delegated', () => adapter.initialState(null, 'seed'), metadata,
    ).session
    const rightSession = right.resumeOrCreate(
      adapter.manifest.id, 'delegated', () => adapter.initialState(null, 'seed'), metadata,
    ).session
    const candidate = legalCandidates(adapter, leftSession.state, 'learner')[0]!
    const registry = new DelegationRegistry(() => 'reentrant')
    const grant = registry.issue(leftSession.id, adapter, leftSession.state, actors, 'learner', 'helper')
    const resolved = registry.resolve(leftSession.id, adapter, leftSession.state, {
      candidateId: candidate.id, stateToken: candidate.stateToken, actorId: candidate.actorId,
    }, 'helper', grant.id)
    const record = {
      candidateId: candidate.id,
      actorId: candidate.actorId,
      stateTokenBefore: candidate.stateToken,
      stateTokenAfter: stateTokenFor(adapter, resolved.transition.state),
      canonicalAction: adapter.canonicalAction(candidate.action),
      events: resolved.transition.events,
      teaching: resolved.teaching,
      delegation: resolved.delegation,
    }
    let nestedFailure: unknown
    const updated = left.mutate(
      leftSession.id, leftSession.revision, 'left', {}, () => {
        try {
          right.mutate(
            rightSession.id, rightSession.revision, 'right', {},
            () => resolved.transition.state, record,
          )
        } catch (error) {
          nestedFailure = error
        }
        return resolved.transition.state
      }, record,
    )
    expect(nestedFailure).toBeInstanceOf(DelegationError)
    expect(updated.history).toHaveLength(1)
    expect(right.get(rightSession.id)?.history).toHaveLength(0)
  })

  it('persists an exact chronicle and deterministically replays it', () => {
    const repository = new SessionRepository<State>(new MemoryStorage(), {
      idFactory: () => 'session-1',
      now: () => new Date('2026-08-11T00:00:00Z'),
      stateToken: (state) => stateTokenFor(adapter, state),
    })
    const session = repository.resumeOrCreate(
      adapter.manifest.id,
      'default',
      () => adapter.initialState(null, 'seed'),
      { gameVersion: adapter.manifest.version, seed: 'seed', config: null },
    ).session
    const candidate = legalCandidates(adapter, session.state, 'learner')[0]!
    const resolved = resolveCandidate(adapter, session.state, {
      candidateId: candidate.id,
      stateToken: candidate.stateToken,
      actorId: candidate.actorId,
    })
    const updated = repository.mutate(
      session.id,
      session.revision,
      'request-1',
      { candidateId: candidate.id },
      () => resolved.transition.state,
      {
        candidateId: candidate.id,
        actorId: candidate.actorId,
        stateTokenBefore: candidate.stateToken,
        stateTokenAfter: stateTokenFor(adapter, resolved.transition.state),
        canonicalAction: adapter.canonicalAction(candidate.action),
        events: resolved.transition.events,
        teaching: resolved.teaching,
      },
    )
    expect(updated.history).toHaveLength(1)
    expect(replaySession(adapter, updated)).toEqual(updated.state)
    const tampered = structuredClone(updated)
    tampered.history[0]!.events = [{ type: 'invented', messageKey: 'invented' }]
    expect(() => replaySession(adapter, tampered)).toThrow(/events/)
    expect(() => replaySession(adapter, { ...updated, schemaVersion: 999 as never })).toThrow(/schema/)
    expect(() => replaySession(adapter, { ...updated, revision: 99 })).toThrow(/revision/)
    const duplicateRequest = structuredClone(updated)
    duplicateRequest.history.push({ ...duplicateRequest.history[0]!, sequence: 2 })
    duplicateRequest.revision = 3
    expect(() => replaySession(adapter, duplicateRequest)).toThrow(/request ids/)
  })
})
