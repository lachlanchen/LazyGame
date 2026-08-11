import { describe, expect, it } from 'vitest'

import { legalCandidates, resolveCandidate } from '@lazyingart/game-core'

import { lineAdapter, lineWinner, type LineState } from '../src/lineGame'

describe('line-and-light adapter', () => {
  it('starts with nine legal, state-bound actions', () => {
    const state = lineAdapter.initialState(undefined, 'seed')
    const candidates = legalCandidates(lineAdapter, state, 'sun')
    expect(candidates).toHaveLength(9)
    expect(new Set(candidates.map((candidate) => candidate.id)).size).toBe(9)
  })

  it('applies a selected action without mutating the source', () => {
    const state = lineAdapter.initialState(undefined, 'seed')
    const candidate = legalCandidates(lineAdapter, state, 'sun')[4]!
    const result = resolveCandidate(lineAdapter, state, {
      candidateId: candidate.id,
      stateToken: candidate.stateToken,
      actorId: 'sun',
    })
    expect(result.transition.state.board[4]).toBe('sun')
    expect(state.board[4]).toBeNull()
    expect(result.transition.state.turn).toBe('moon')
  })

  it('counts only lines not already blocked by the opponent', () => {
    const state: LineState = {
      board: ['moon', null, null, null, null, null, null, null, null],
      turn: 'sun',
      winner: null,
      moveNumber: 1,
    }
    const candidate = legalCandidates(lineAdapter, state, 'sun').find(
      (item) => item.action.cell === 4,
    )!
    const result = resolveCandidate(lineAdapter, state, {
      candidateId: candidate.id,
      stateToken: candidate.stateToken,
      actorId: candidate.actorId,
    })
    expect(result.teaching.reason[0]?.messageKey).toBe('teaching.reason.sun')
    expect(result.teaching.reason[0]?.params?.options).toBe(3)
  })

  it('detects rows, columns, diagonals, draws, and active turn authority', () => {
    expect(lineWinner(['sun', 'sun', 'sun', null, null, null, null, null, null])).toBe('sun')
    expect(lineWinner(['moon', null, null, 'moon', null, null, 'moon', null, null])).toBe('moon')
    expect(lineWinner(['sun', 'moon', 'sun', 'sun', 'moon', 'moon', 'moon', 'sun', 'sun'])).toBe('draw')
    const state: LineState = { board: Array(9).fill(null), turn: 'moon', winner: null, moveNumber: 0 }
    expect(() => legalCandidates(lineAdapter, state, 'sun')).toThrow(/does not own/)
  })
})
