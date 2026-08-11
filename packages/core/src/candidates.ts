import { createCandidateId, createStateToken } from './canonical.js'
import { validateTeachingBundle } from './teaching.js'
import type {
  BoundCandidate,
  CandidateSelection,
  GameAdapter,
  TeachingBundle,
  Transition,
} from './types.js'

export class CandidateError extends Error {
  constructor(
    readonly code: 'wrong-actor' | 'stale-state' | 'unknown-candidate' | 'inactive-game' | 'duplicate-candidate',
    message: string,
  ) {
    super(message)
    this.name = 'CandidateError'
  }
}

export function stateTokenFor<State, Action, View, Config>(
  adapter: GameAdapter<State, Action, View, Config>,
  state: State,
): string {
  return createStateToken(adapter.manifest.id, adapter.serializeState(state), {
    version: adapter.manifest.version,
    activeActor: adapter.activeActor(state),
  })
}

export function legalCandidates<State, Action, View, Config>(
  adapter: GameAdapter<State, Action, View, Config>,
  state: State,
  actorId: string,
): readonly BoundCandidate<Action>[] {
  const active = adapter.activeActor(state)
  if (active === null) return []
  if (active !== actorId) {
    throw new CandidateError('wrong-actor', `Actor ${actorId} does not own the active turn`)
  }
  const stateToken = stateTokenFor(adapter, state)
  const ids = new Set<string>()
  return adapter.legalActions(state, actorId).map((action) => {
    const id = createCandidateId(stateToken, actorId, adapter.canonicalAction(action))
    if (ids.has(id)) {
      throw new CandidateError(
        'duplicate-candidate',
        'Adapter returned duplicate canonical legal actions',
      )
    }
    ids.add(id)
    return {
      ...adapter.describeAction(state, action, actorId),
      id,
      stateToken,
      actorId,
      action,
    }
  })
}

export interface ResolvedCandidate<State, Action> {
  candidate: BoundCandidate<Action>
  transition: Transition<State>
  teaching: TeachingBundle
}

export function resolveCandidate<State, Action, View, Config>(
  adapter: GameAdapter<State, Action, View, Config>,
  state: State,
  selection: CandidateSelection,
): ResolvedCandidate<State, Action> {
  const currentToken = stateTokenFor(adapter, state)
  if (selection.stateToken !== currentToken) {
    throw new CandidateError('stale-state', 'Candidate belongs to another state')
  }
  const active = adapter.activeActor(state)
  if (active === null) throw new CandidateError('inactive-game', 'The game has no active actor')
  if (active !== selection.actorId) {
    throw new CandidateError('wrong-actor', 'Candidate actor does not own the turn')
  }
  const candidate = legalCandidates(adapter, state, selection.actorId).find(
    (item) => item.id === selection.candidateId,
  )
  if (!candidate) {
    throw new CandidateError('unknown-candidate', 'Candidate is not legal in this state')
  }
  return {
    candidate,
    transition: adapter.applyAction(state, candidate.action, selection.actorId),
    teaching: validateTeachingBundle(adapter.teaching(state, candidate.action, selection.actorId)),
  }
}
