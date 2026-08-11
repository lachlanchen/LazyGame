import { describe, expect, it } from 'vitest'

import { canonicalStringify, createCandidateId, createStateToken, identityDigest } from '../src'

describe('canonical identity', () => {
  it('sorts object keys without reordering arrays', () => {
    expect(canonicalStringify({ z: [2, 1], a: { y: true, x: 3 } })).toBe(
      '{"a":{"x":3,"y":true},"z":[2,1]}',
    )
  })

  it('produces stable state and action identities', () => {
    const left = createStateToken('demo', { board: ['x', null], turn: 'o' })
    const right = createStateToken('demo', { turn: 'o', board: ['x', null] })
    expect(left).toBe(right)
    expect(createCandidateId(left, 'o', { cell: 1 })).toMatch(/^candidate_[0-9a-f]{32}$/)
    expect(identityDigest({ x: 1 })).not.toBe(identityDigest({ x: 2 }))
  })

  it('rejects non-JSON and cyclic values', () => {
    expect(() => canonicalStringify({ value: Number.NaN })).toThrow(/finite/)
    expect(() => canonicalStringify({ value: undefined })).toThrow(/JSON-safe/)
    const cycle: { self?: unknown } = {}
    cycle.self = cycle
    expect(() => canonicalStringify(cycle)).toThrow(/cycles/)
    const cyclicArray: unknown[] = []
    cyclicArray.push(cyclicArray)
    expect(() => canonicalStringify(cyclicArray)).toThrow(/cycles/)
    expect(() => canonicalStringify(new Date('2026-08-11T00:00:00Z'))).toThrow(/plain JSON/)
    expect(() => canonicalStringify(new Map([['x', 1]]))).toThrow(/plain JSON/)
    expect(canonicalStringify(JSON.parse('{"__proto__":{"move":7}}'))).toBe('{"__proto__":{"move":7}}')
    expect(() => canonicalStringify({ [Symbol('hidden')]: 1 })).toThrow(/symbol/)
  })

  it('rejects sparse or decorated arrays instead of aliasing them', () => {
    expect(() => canonicalStringify(Array(1))).toThrow(/sparse/)
    expect(canonicalStringify([null])).toBe('[null]')
    const named = [1] as number[] & { note?: string }
    named.note = 'hidden'
    expect(() => canonicalStringify(named)).toThrow(/named/)
    const symbolic = [] as unknown[] & { [key: symbol]: number }
    symbolic[Symbol('hidden')] = 1
    expect(() => canonicalStringify(symbolic)).toThrow(/named/)
    const accessor: unknown[] = []
    Object.defineProperty(accessor, '0', { enumerable: true, get: () => Math.random() })
    accessor.length = 1
    expect(() => canonicalStringify(accessor)).toThrow(/data property/)
  })
})
