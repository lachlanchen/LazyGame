import { EVIDENCE_KINDS } from './types.js'
import type { EvidenceKind, TeachingBundle, TeachingClaim } from './types.js'

const EVIDENCE_SET = new Set<string>(EVIDENCE_KINDS)

function validateClaim(claim: TeachingClaim): void {
  if (!claim.id.trim()) throw new TypeError('Teaching claim id is required')
  if (!claim.messageKey.trim()) throw new TypeError('Teaching message key is required')
  if (!EVIDENCE_SET.has(claim.evidence)) throw new TypeError('Unknown evidence kind')
  if (claim.evidence === 'engine' && !claim.source?.trim()) {
    throw new TypeError('Engine claims require a named source')
  }
  if ((claim.evidence === 'model' || claim.evidence === 'analogy') && !claim.limitationKey?.trim()) {
    throw new TypeError(`${claim.evidence} claims require an explicit limitation`)
  }
}

export function validateTeachingBundle(bundle: TeachingBundle): TeachingBundle {
  const claims = [
    bundle.intent,
    ...bundle.reason,
    ...bundle.changes,
    ...(bundle.reply ? [bundle.reply] : []),
    bundle.next,
    bundle.principle,
  ]
  for (const claim of claims) validateClaim(claim)
  const ids = new Set<string>()
  for (const claim of claims) {
    if (ids.has(claim.id)) throw new TypeError(`Duplicate teaching claim id: ${claim.id}`)
    ids.add(claim.id)
  }
  return bundle
}

export function evidenceLabelKey(kind: EvidenceKind): string {
  return `evidence.${kind}`
}
