import { describe, expect, it } from 'vitest'

import {
  AnalysisEvidenceError,
  validateCoachDraft,
  validateEngineAnalysis,
  type BoundCandidate,
} from '../src'

const legal: BoundCandidate<{ move: string }>[] = [
  {
    id: 'candidate_a',
    stateToken: 'state_1',
    actorId: 'north',
    action: { move: 'A' },
    titleKey: 'a',
    summaryKey: 'a.summary',
    intent: 'build',
  },
  {
    id: 'candidate_b',
    stateToken: 'state_1',
    actorId: 'north',
    action: { move: 'B' },
    titleKey: 'b',
    summaryKey: 'b.summary',
    intent: 'block',
  },
]

describe('bounded analysis evidence', () => {
  it('accepts only the current legal candidate set and finite metrics', () => {
    const result = validateEngineAnalysis(legal, {
      stateToken: 'state_1',
      source: { id: 'engine', version: '1', modelSha256: 'a'.repeat(64) },
      candidates: [
        { candidateId: 'candidate_b', rank: 0, metrics: { value: 0.4 } },
        { candidateId: 'candidate_a', rank: 1, metrics: { value: -0.2 } },
      ],
    })
    expect(result.candidates[0]?.candidate.action.move).toBe('B')
    expect(() =>
      validateEngineAnalysis(legal, {
        stateToken: 'state_old',
        source: { id: 'engine', version: '1' },
        candidates: [],
      }),
    ).toThrow(AnalysisEvidenceError)
    expect(() =>
      validateEngineAnalysis(legal, {
        stateToken: 'state_1',
        source: { id: 'engine', version: '1' },
        candidates: [{ candidateId: 'invented', rank: 0, metrics: {} }],
      }),
    ).toThrow(/unknown candidate/)
    expect(() =>
      validateEngineAnalysis(legal, {
        stateToken: 'state_1',
        source: { id: 'engine', version: '1' },
        candidates: [{ candidateId: 'candidate_a', rank: 0, metrics: { value: Number.NaN } }],
      }),
    ).toThrow(/finite/)
    expect(() =>
      validateEngineAnalysis(legal, {
        stateToken: 'state_1',
        source: { id: 'engine', version: '1', modelSha256: 'abc' },
        candidates: [],
      }),
    ).toThrow(/SHA-256/)
    expect(() =>
      validateEngineAnalysis(legal, {
        stateToken: 'state_1',
        source: { id: 'engine', version: '1', modelSha256: 0 as never },
        candidates: [],
      }),
    ).toThrow(/SHA-256/)
    expect(() => validateEngineAnalysis(legal, {
      stateToken: 'state_1', source: { id: 'engine', version: '1' },
      candidates: [{
        candidateId: 'candidate_a', rank: 0,
        metrics: Object.fromEntries(Array.from({ length: 33 }, (_, index) => [`m${index}`, index])),
      }],
    })).toThrow(/metrics exceed/)
    expect(() => validateEngineAnalysis(legal, {
      stateToken: 'state_1', source: { id: 'engine', version: '1' },
      candidates: [{
        candidateId: 'candidate_a', rank: 0, metrics: {},
        principalVariation: Array.from({ length: 129 }, () => 'A1'),
      }],
    })).toThrow(/principal variation/)
  })

  it('never upgrades free-form coach prose to exact or engine evidence', () => {
    expect(
      validateCoachDraft(legal, {
        locale: 'ja',
        candidateId: 'candidate_a',
        headline: '候補',
        explanation: 'これは比較のための説明です。',
        evidence: 'model',
        limitation: 'モデルの説明であり、合法性は決定論的コードが検証します。',
      }).candidateId,
    ).toBe('candidate_a')
    expect(() =>
      validateCoachDraft(legal, {
        locale: 'en',
        headline: 'Claim',
        explanation: 'Unverified prose',
        evidence: 'exact',
        limitation: 'None',
      }),
    ).toThrow(/provenance/)
    expect(() => validateCoachDraft(legal, {
      locale: 'xx' as never,
      headline: 'Claim',
      explanation: 'Unverified prose',
      limitation: 'None',
    })).toThrow(/locale/)
    expect(validateCoachDraft(legal, {
      locale: 'en',
      headline: 'Picture',
      explanation: 'A bounded analogy.',
      evidence: 'analogy',
      limitation: 'This is an analogy.',
    }, 'analogy').evidence).toBe('analogy')
    expect(() => validateCoachDraft(legal, {
      locale: 'en', headline: 'Claim', explanation: 'Text', limitation: 'Bounded.',
    }, 'exact' as never)).toThrow(/model or analogy/)
  })
})
