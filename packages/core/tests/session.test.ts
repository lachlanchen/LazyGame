import { describe, expect, it } from 'vitest'

import {
  MemoryStorage,
  mutationFingerprint,
  RequestConflict,
  RevisionConflict,
  SessionCompatibilityError,
  SessionRepository,
  identityDigest,
} from '../src'

const metadata = { gameVersion: '1', seed: 'seed-1', config: null }
function recordFor(before: number, after: number) {
  return {
    candidateId: 'candidate-1',
    actorId: 'actor-1',
    stateTokenBefore: `moves-${before}`,
    stateTokenAfter: `moves-${after}`,
    canonicalAction: { move: after - before },
    events: [{ type: 'moved', messageKey: 'event.moved' }],
    teaching: {
      intent: { id: 'intent', evidence: 'authored' as const, messageKey: 'teach.intent' },
      reason: [{ id: 'reason', evidence: 'exact' as const, messageKey: 'teach.reason' }],
      changes: [{ id: 'change', evidence: 'exact' as const, messageKey: 'teach.change' }],
      next: { id: 'next', evidence: 'authored' as const, messageKey: 'teach.next' },
      principle: { id: 'principle', evidence: 'authored' as const, messageKey: 'teach.principle' },
    },
  }
}

describe('session repository', () => {
  it('resumes one logical session without creating duplicates', () => {
    const repository = new SessionRepository<{ moves: number }>(new MemoryStorage(), {
      idFactory: () => 'session-1',
      now: () => new Date('2026-08-11T00:00:00Z'),
      stateToken: (state) => `moves-${state.moves}`,
    })
    const first = repository.resumeOrCreate('demo', 'learner-default', () => ({ moves: 0 }), metadata)
    const second = repository.resumeOrCreate('demo', 'learner-default', () => ({ moves: 99 }), metadata)
    expect(first.created).toBe(true)
    expect(second.created).toBe(false)
    expect(second.session).toEqual(first.session)
    expect(repository.list()).toHaveLength(1)
  })

  it('keeps delimiter-like game and resume keys distinct', () => {
    let id = 0
    const repository = new SessionRepository<{ value: string }>(new MemoryStorage(), {
      idFactory: () => `session-${++id}`,
      stateToken: (state) => `value-${state.value}`,
    })
    const left = repository.resumeOrCreate('a:b', 'c', () => ({ value: 'left' }), metadata).session
    const right = repository.resumeOrCreate('a', 'b:c', () => ({ value: 'right' }), metadata).session
    expect(left.id).not.toBe(right.id)
    expect(repository.list()).toHaveLength(2)
    expect(repository.resumeOrCreate('a:b', 'c', () => ({ value: 'wrong' }), metadata).session).toEqual(left)
    expect(repository.resumeOrCreate('a', 'b:c', () => ({ value: 'wrong' }), metadata).session).toEqual(right)
  })

  it('rejects an empty or reused generated session id', () => {
    const storage = new MemoryStorage()
    const repository = new SessionRepository<{ value: string }>(storage, {
      idFactory: () => 'same',
      stateToken: (state) => `value-${state.value}`,
    })
    repository.resumeOrCreate('demo', 'a', () => ({ value: 'left' }), metadata)
    expect(() => repository.resumeOrCreate('demo', 'b', () => ({ value: 'right' }), metadata)).toThrow(/already in use/)
    expect(repository.get('same')?.state).toEqual({ value: 'left' })
    expect(() => new SessionRepository(new MemoryStorage(), {
      idFactory: () => ' ', stateToken: () => 'state',
    }).resumeOrCreate('demo', 'a', () => ({}), metadata)).toThrow(/empty/)
  })

  it('rechecks storage after a re-entrant initializer and keeps one session', () => {
    const storage = new MemoryStorage()
    let id = 0
    const outer = new SessionRepository<{ moves: number }>(storage, {
      idFactory: () => `session-${++id}`,
      stateToken: (state) => `moves-${state.moves}`,
    })
    const inner = new SessionRepository<{ moves: number }>(storage, {
      idFactory: () => `session-${++id}`,
      stateToken: (state) => `moves-${state.moves}`,
    })
    const result = outer.resumeOrCreate('demo', 'same', () => {
      inner.resumeOrCreate('demo', 'same', () => ({ moves: 0 }), metadata)
      return { moves: 99 }
    }, metadata)
    expect(result.created).toBe(false)
    expect(result.session.state).toEqual({ moves: 0 })
    expect(outer.list()).toHaveLength(1)
  })

  it('refuses to resume a key under another game version', () => {
    const repository = new SessionRepository<{ moves: number }>(new MemoryStorage(), {
      idFactory: () => 'session-1',
      stateToken: (state) => `moves-${state.moves}`,
    })
    repository.resumeOrCreate('demo', 'one', () => ({ moves: 0 }), metadata)
    expect(() => repository.resumeOrCreate(
      'demo',
      'one',
      () => ({ moves: 0 }),
      { ...metadata, gameVersion: '2' },
    )).toThrow(SessionCompatibilityError)
  })

  it('exports the same canonical payload fingerprint used by mutations', () => {
    expect(mutationFingerprint({ move: 2, nested: { a: true } })).toBe(
      identityDigest({ nested: { a: true }, move: 2 }),
    )
  })

  it('uses CAS and exact idempotent retries', () => {
    let sequence = 0
    const repository = new SessionRepository<{ moves: number }>(new MemoryStorage(), {
      idFactory: () => 'session-1',
      now: () => new Date(Date.UTC(2026, 7, 11, 0, 0, sequence++)),
      stateToken: (state) => `moves-${state.moves}`,
    })
    const created = repository.resumeOrCreate('demo', 'one', () => ({ moves: 0 }), metadata).session
    const changed = repository.mutate(created.id, 1, 'request-1', { move: 2 }, (state) => ({
      moves: state.moves + 2,
    }), recordFor(0, 2))
    const retry = repository.mutate(created.id, 1, 'request-1', { move: 2 }, () => ({ moves: 999 }), recordFor(0, 2))
    expect(changed).toEqual(retry)
    expect(changed.revision).toBe(2)
    expect(changed.history).toHaveLength(1)
    expect(changed.history[0]).toMatchObject({
      requestId: 'request-1',
      stateTokenBefore: 'moves-0',
      stateTokenAfter: 'moves-2',
    })
    expect(() => repository.mutate(created.id, 1, 'request-2', {}, (state) => state, recordFor(0, 0))).toThrow(
      RevisionConflict,
    )
    expect(() => repository.mutate(created.id, 2, 'request-1', { move: 3 }, (state) => state, recordFor(2, 2))).toThrow(
      RequestConflict,
    )
  })

  it('never re-applies an idempotency key after its exact response is evicted', () => {
    const repository = new SessionRepository<{ moves: number }>(new MemoryStorage(), {
      idFactory: () => 'session-1',
      idempotencyLimit: 1,
      stateToken: (state) => `moves-${state.moves}`,
    })
    const initial = repository.resumeOrCreate('demo', 'one', () => ({ moves: 0 }), metadata).session
    const one = repository.mutate(initial.id, 1, 'request-1', { move: 1 }, () => ({ moves: 1 }), recordFor(0, 1))
    const two = repository.mutate(one.id, 2, 'request-2', { move: 1 }, () => ({ moves: 2 }), recordFor(1, 2))
    expect(() => repository.mutate(two.id, 3, 'request-1', { move: 1 }, () => ({ moves: 3 }), recordFor(2, 3))).toThrow(
      RequestConflict,
    )
    expect(repository.get(two.id)?.history.map((entry) => entry.requestId)).toEqual(['request-1', 'request-2'])
    expect(() => repository.mutate(two.id, 3, ' ', {}, (state) => state, recordFor(2, 2))).toThrow(/required/)
    expect(() => new SessionRepository(new MemoryStorage(), { idempotencyLimit: 0, stateToken: () => 'state' })).toThrow(
      /retention/,
    )
  })

  it('keeps idempotency responses compact instead of copying the full chronicle', () => {
    const storage = new MemoryStorage()
    const repository = new SessionRepository<{ moves: number }>(storage, {
      idFactory: () => 'session-1',
      stateToken: (state) => `moves-${state.moves}`,
    })
    let session = repository.resumeOrCreate('demo', 'one', () => ({ moves: 0 }), metadata).session
    for (let move = 1; move <= 200; move += 1) {
      session = repository.mutate(
        session.id,
        session.revision,
        `request-${move}`,
        { move },
        () => ({ moves: move }),
        recordFor(move - 1, move),
      )
    }
    const raw = storage.getItem('game-teaching.v1.session.session-1')!
    const visible = JSON.stringify(repository.get(session.id))
    expect(raw).not.toContain('"response":')
    expect(raw.length).toBeLessThan(visible.length * 2)
  })

  it('rejects a re-entrant writer instead of overwriting its committed state', () => {
    const storage = new MemoryStorage()
    const outer = new SessionRepository<{ moves: number }>(storage, {
      idFactory: () => 'session-1',
      stateToken: (state) => `moves-${state.moves}`,
    })
    const inner = new SessionRepository<{ moves: number }>(storage, {
      stateToken: (state) => `moves-${state.moves}`,
    })
    const session = outer.resumeOrCreate('demo', 'one', () => ({ moves: 0 }), metadata).session
    expect(() => outer.mutate(session.id, 1, 'outer', {}, () => {
      inner.mutate(session.id, 1, 'inner', {}, () => ({ moves: 1 }), recordFor(0, 1))
      return { moves: 2 }
    }, recordFor(0, 2))).toThrow(RevisionConflict)
    expect(outer.get(session.id)?.state).toEqual({ moves: 1 })
    expect(outer.get(session.id)?.revision).toBe(2)
  })

  it('deletes only the expected revision', () => {
    const repository = new SessionRepository<{ moves: number }>(new MemoryStorage(), {
      idFactory: () => 'session-1',
      stateToken: (state) => `moves-${state.moves}`,
    })
    const session = repository.resumeOrCreate('demo', 'one', () => ({ moves: 0 }), metadata).session
    expect(() => repository.delete(session.id, 2)).toThrow(RevisionConflict)
    expect(repository.delete(session.id, 1)).toBe(true)
    expect(repository.list()).toEqual([])
  })
})
