import type { BoundCandidate } from '@lazyingart/game-core'
import { useRef } from 'react'

export interface CandidateListProps<Action> {
  candidates: readonly BoundCandidate<Action>[]
  selectedId: string | null
  inspectedId: string | null
  visualId: string | null
  title(candidate: BoundCandidate<Action>): string
  summary(candidate: BoundCandidate<Action>): string
  onInspect(id: string | null): void
  onSelect(id: string): void
  heading: string
}

export function CandidateList<Action>({
  candidates,
  selectedId,
  inspectedId,
  visualId,
  title,
  summary,
  onInspect,
  onSelect,
  heading,
}: CandidateListProps<Action>) {
  const hoveredId = useRef<string | null>(null)
  const focusedId = useRef<string | null>(null)

  return (
    <section className="game-candidates" aria-label={heading}>
      <h2>{heading}</h2>
      <div role="list">
        {candidates.map((candidate) => {
          const active = visualId === candidate.id
          return (
            <div key={candidate.id} role="listitem" className="game-candidate-item">
              <button
                type="button"
                className="game-candidate"
                data-testid="candidate"
                data-candidate-id={candidate.id}
                data-active={active}
                data-visual={active}
                aria-pressed={selectedId === candidate.id}
                aria-current={active ? 'true' : undefined}
                onPointerEnter={() => {
                  hoveredId.current = candidate.id
                  onInspect(candidate.id)
                }}
                onPointerLeave={() => {
                  if (hoveredId.current === candidate.id) hoveredId.current = null
                  onInspect(focusedId.current)
                }}
                onFocus={() => {
                  focusedId.current = candidate.id
                  onInspect(candidate.id)
                }}
                onBlur={() => {
                  if (focusedId.current === candidate.id) focusedId.current = null
                  onInspect(hoveredId.current)
                }}
                onClick={() => onSelect(candidate.id)}
              >
                <strong>{title(candidate)}</strong>
                <span>{summary(candidate)}</span>
              </button>
            </div>
          )
        })}
      </div>
    </section>
  )
}
