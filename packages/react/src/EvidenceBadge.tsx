import type { EvidenceKind } from '@lazyingart/game-core'

export interface EvidenceBadgeProps {
  kind: EvidenceKind
  label: string
}

export function EvidenceBadge({ kind, label }: EvidenceBadgeProps) {
  return (
    <span className={`game-evidence game-evidence-${kind}`} data-evidence={kind}>
      {label}
    </span>
  )
}
