import {
  legalCandidates,
  resolveCandidate,
  validateTeachingBundle,
  type BoundCandidate,
  type GameAdapter,
  type TeachingBundle,
  type Transition,
} from '@lazyingart/game-core'
import { useEffect, useMemo, useState } from 'react'

export interface GameController<State, Action> {
  state: State
  candidates: readonly BoundCandidate<Action>[]
  selectedId: string | null
  inspectedId: string | null
  visualCandidate: BoundCandidate<Action> | null
  preview: Transition<State> | null
  teaching: TeachingBundle | null
  selectedTransition: Transition<State> | null
  selectedTeaching: TeachingBundle | null
  inspect(id: string | null): void
  select(id: string): void
  clear(): void
  replaceState(state: State): void
}

export function useGameController<State, Action, View, Config>(
  adapter: GameAdapter<State, Action, View, Config>,
  initialState: State,
): GameController<State, Action> {
  const [state, setState] = useState(initialState)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [inspectedId, setInspectedId] = useState<string | null>(null)
  const actorId = adapter.activeActor(state)
  const candidates = useMemo(
    () => (actorId ? legalCandidates(adapter, state, actorId) : []),
    [adapter, actorId, state],
  )
  const visualCandidate = useMemo(
    () => candidates.find((item) => item.id === (inspectedId ?? selectedId)) ?? candidates[0] ?? null,
    [candidates, inspectedId, selectedId],
  )
  const selected = candidates.find((item) => item.id === selectedId) ?? null
  const selectedResolved = selected
    ? resolveCandidate(adapter, state, {
        candidateId: selected.id,
        stateToken: selected.stateToken,
        actorId: selected.actorId,
      })
    : null
  const visualResolved = visualCandidate
    ? resolveCandidate(adapter, state, {
        candidateId: visualCandidate.id,
        stateToken: visualCandidate.stateToken,
        actorId: visualCandidate.actorId,
      })
    : null

  useEffect(() => {
    setSelectedId(null)
    setInspectedId(null)
  }, [state])

  function clear() {
    setSelectedId(null)
    setInspectedId(null)
  }

  return {
    state,
    candidates,
    selectedId,
    inspectedId,
    visualCandidate,
    preview: visualResolved?.transition ?? null,
    teaching: visualResolved?.teaching ?? (visualCandidate && actorId
      ? validateTeachingBundle(adapter.teaching(state, visualCandidate.action, actorId))
      : null),
    selectedTransition: selectedResolved?.transition ?? null,
    selectedTeaching: selectedResolved?.teaching ?? null,
    inspect: setInspectedId,
    select(id) {
      setSelectedId((current) => current === id ? null : id)
    },
    clear,
    replaceState(next) {
      setState(next)
      clear()
    },
  }
}
