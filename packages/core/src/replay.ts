import { canonicalStringify } from './canonical.js'
import { resolveCandidate, stateTokenFor } from './candidates.js'
import type { GameAdapter, GameSession } from './types.js'

export class ReplayError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ReplayError'
  }
}

export function replaySession<State, Action, View, Config>(
  adapter: GameAdapter<State, Action, View, Config>,
  session: GameSession<State>,
): State {
  if (
    session.schemaVersion !== 1 || !Number.isSafeInteger(session.revision) ||
    session.revision !== session.history.length + 1
  ) {
    throw new ReplayError('Session schema, revision, or chronicle length is invalid')
  }
  const requestIds = new Set<string>()
  for (const entry of session.history) {
    if (!entry.requestId.trim() || requestIds.has(entry.requestId)) {
      throw new ReplayError('Chronicle request ids must be nonblank and unique')
    }
    const delegated = [entry.chosenByActorId, entry.delegationId, entry.delegationScopeId]
    const delegatedFieldCount = delegated.filter((value) => value !== undefined).length
    if (
      delegatedFieldCount !== 0 && (
        delegatedFieldCount !== 3 || delegated.some((value) => typeof value !== 'string' || !value.trim()) ||
        entry.chosenByActorId === entry.actorId || entry.delegationScopeId !== session.id
      )
    ) {
      throw new ReplayError('Chronicle delegation provenance is incomplete or belongs to another session')
    }
    requestIds.add(entry.requestId)
  }
  if (session.gameId !== adapter.manifest.id || session.gameVersion !== adapter.manifest.version) {
    throw new ReplayError('Session game identity does not match the adapter')
  }
  const generated = adapter.initialState(session.config as Config, session.seed)
  if (canonicalStringify(generated) !== canonicalStringify(session.initialState)) {
    throw new ReplayError('Stored initial state does not match its seed and configuration')
  }
  let state = generated
  for (const [index, entry] of session.history.entries()) {
    if (entry.sequence !== index + 1 || entry.stateTokenBefore !== stateTokenFor(adapter, state)) {
      throw new ReplayError('Chronicle sequence or before-state token is invalid')
    }
    const resolved = resolveCandidate(adapter, state, {
      candidateId: entry.candidateId,
      stateToken: entry.stateTokenBefore,
      actorId: entry.actorId,
    })
    if (
      canonicalStringify(adapter.canonicalAction(resolved.candidate.action)) !==
      canonicalStringify(entry.canonicalAction)
    ) {
      throw new ReplayError('Chronicle action does not match its candidate')
    }
    if (canonicalStringify(resolved.transition.events) !== canonicalStringify(entry.events)) {
      throw new ReplayError('Chronicle exact events do not match deterministic replay')
    }
    if (canonicalStringify(resolved.teaching) !== canonicalStringify(entry.teaching)) {
      throw new ReplayError('Chronicle teaching evidence does not match deterministic replay')
    }
    if (entry.stateTokenAfter !== stateTokenFor(adapter, resolved.transition.state)) {
      throw new ReplayError('Chronicle after-state token is invalid')
    }
    state = resolved.transition.state
  }
  if (canonicalStringify(state) !== canonicalStringify(session.state)) {
    throw new ReplayError('Replayed state does not match the stored current state')
  }
  return state
}
