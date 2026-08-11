import { SUPPORTED_LOCALES, type BoundCandidate, type Locale } from './types.js'

export interface EngineIdentity {
  id: string
  version: string
  modelSha256?: string
}

export interface CandidateAnalysis {
  candidateId: string
  rank: number
  metrics: Readonly<Record<string, number>>
  principalVariation?: readonly string[]
}

export interface EngineAnalysis {
  stateToken: string
  source: EngineIdentity
  candidates: readonly CandidateAnalysis[]
}

export interface ValidatedAnalysis<Action> {
  stateToken: string
  source: EngineIdentity
  candidates: readonly (CandidateAnalysis & { candidate: BoundCandidate<Action> })[]
}

export class AnalysisEvidenceError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AnalysisEvidenceError'
  }
}

export function validateEngineAnalysis<Action>(
  legal: readonly BoundCandidate<Action>[],
  analysis: EngineAnalysis,
): ValidatedAnalysis<Action> {
  const stateToken = legal[0]?.stateToken
  if (!stateToken || analysis.stateToken !== stateToken) {
    throw new AnalysisEvidenceError('Engine analysis belongs to another state')
  }
  if (!analysis.source.id.trim() || !analysis.source.version.trim()) {
    throw new AnalysisEvidenceError('Engine identity and version are required')
  }
  if (analysis.source.id.length > 128 || analysis.source.version.length > 128) {
    throw new AnalysisEvidenceError('Engine identity fields exceed their bounds')
  }
  if (
    analysis.source.modelSha256 !== undefined &&
    (typeof analysis.source.modelSha256 !== 'string' || !/^[0-9a-f]{64}$/i.test(analysis.source.modelSha256))
  ) {
    throw new AnalysisEvidenceError('Engine modelSha256 must be a 64-character hexadecimal SHA-256')
  }
  const byId = new Map(legal.map((candidate) => [candidate.id, candidate]))
  if (!Array.isArray(analysis.candidates) || analysis.candidates.length > Math.min(legal.length, 1024)) {
    throw new AnalysisEvidenceError('Engine candidate list exceeds the legal bounded set')
  }
  const ids = new Set<string>()
  const ranks = new Set<number>()
  const candidates = analysis.candidates.map((item) => {
    if (typeof item.candidateId !== 'string') throw new AnalysisEvidenceError('Engine candidate id must be text')
    const candidate = byId.get(item.candidateId)
    if (!candidate) throw new AnalysisEvidenceError('Engine referenced an unknown candidate')
    if (ids.has(item.candidateId)) throw new AnalysisEvidenceError('Engine candidate is duplicated')
    if (!Number.isSafeInteger(item.rank) || item.rank < 0 || ranks.has(item.rank)) {
      throw new AnalysisEvidenceError('Engine ranks must be unique non-negative integers')
    }
    if (!item.metrics || typeof item.metrics !== 'object' || Array.isArray(item.metrics)) {
      throw new AnalysisEvidenceError('Engine metrics must be a record')
    }
    const metrics = Object.entries(item.metrics)
    if (metrics.length > 32) throw new AnalysisEvidenceError('Engine metrics exceed the per-candidate bound')
    for (const [key, value] of metrics) {
      if (!key.trim() || key.length > 64 || !Number.isFinite(value)) {
        throw new AnalysisEvidenceError('Engine metrics require finite named values')
      }
    }
    if (item.principalVariation !== undefined) {
      if (
        !Array.isArray(item.principalVariation) || item.principalVariation.length > 128 ||
        item.principalVariation.some((step: unknown) => typeof step !== 'string' || !step.trim() || step.length > 128)
      ) {
        throw new AnalysisEvidenceError('Engine principal variation exceeds its text bounds')
      }
    }
    ids.add(item.candidateId)
    ranks.add(item.rank)
    return { ...item, candidate }
  })
  return { stateToken, source: analysis.source, candidates }
}

export interface CoachDraftInput {
  locale: Locale
  candidateId?: string
  headline: string
  explanation: string
  limitation: string
}

export interface CoachDraft extends CoachDraftInput {
  evidence: 'model' | 'analogy'
}

export function validateCoachDraft<Action>(
  legal: readonly BoundCandidate<Action>[],
  draft: CoachDraftInput & { evidence?: unknown },
  provenance: 'model' | 'analogy' = 'model',
): CoachDraft {
  if (provenance !== 'model' && provenance !== 'analogy') {
    throw new AnalysisEvidenceError('Coach provenance must be model or analogy')
  }
  if (!SUPPORTED_LOCALES.includes(draft.locale)) {
    throw new AnalysisEvidenceError('Coach locale is not supported')
  }
  if (draft.candidateId && !legal.some((candidate) => candidate.id === draft.candidateId)) {
    throw new AnalysisEvidenceError('Coach referenced an unknown candidate')
  }
  if (!draft.headline.trim() || !draft.explanation.trim() || !draft.limitation.trim()) {
    throw new AnalysisEvidenceError('Coach output requires bounded text and a limitation')
  }
  if (draft.headline.length > 100 || draft.explanation.length > 900 || draft.limitation.length > 300) {
    throw new AnalysisEvidenceError('Coach output exceeds the learner-facing bounds')
  }
  if (draft.evidence !== undefined && draft.evidence !== provenance) {
    throw new AnalysisEvidenceError('Coach prose cannot assign its own provenance')
  }
  return { ...draft, evidence: provenance }
}
