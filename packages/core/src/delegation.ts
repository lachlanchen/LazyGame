import { resolveCandidate, stateTokenFor } from './candidates.js'
import type {
  CandidateSelection,
  GameActor,
  GameAdapter,
  ResolvedDelegationProof,
} from './types.js'

const liveProofs = new WeakSet<object>()

export function assertResolvedDelegationProof(
  proof: unknown,
  scopeId: string,
  actorId: string,
  stateToken: string,
  candidateId: string,
): asserts proof is ResolvedDelegationProof {
  if (
    !proof || typeof proof !== 'object' || !liveProofs.has(proof) ||
    (proof as ResolvedDelegationProof).scopeId !== scopeId ||
    (proof as ResolvedDelegationProof).delegatedByActorId !== actorId ||
    (proof as ResolvedDelegationProof).stateToken !== stateToken ||
    (proof as ResolvedDelegationProof).candidateId !== candidateId ||
    !(proof as ResolvedDelegationProof).chosenByActorId.trim() ||
    (proof as ResolvedDelegationProof).chosenByActorId === actorId
  ) {
    throw new DelegationError('Delegation proof is not an issued capability for this session and turn')
  }
}

export function consumeResolvedDelegationProof(proof: ResolvedDelegationProof): void {
  if (!liveProofs.delete(proof)) throw new DelegationError('Delegation proof was already consumed')
}

export interface OneTurnDelegation {
  id: string
  scopeId: string
  stateToken: string
  delegatedByActorId: string
  playerAgentActorId: string
  expiresAt: number
}

export class DelegationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DelegationError'
  }
}

/**
 * Server/domain-owned one-use capability registry. Keep the instance outside
 * model/UI reach; only its opaque grant id crosses an agent boundary.
 */
export class DelegationRegistry {
  readonly #grants = new Map<string, OneTurnDelegation>()

  constructor(
    private readonly idFactory: () => string = () => crypto.randomUUID(),
    private readonly now: () => number = () => Date.now(),
    private readonly ttlMs = 5 * 60 * 1000,
    private readonly maxGrants = 1024,
  ) {
    if (!Number.isSafeInteger(ttlMs) || ttlMs < 1 || !Number.isSafeInteger(maxGrants) || maxGrants < 1) {
      throw new TypeError('Delegation TTL and capacity must be positive safe integers')
    }
  }

  private prune(): void {
    const now = this.now()
    for (const [id, grant] of this.#grants) {
      if (grant.expiresAt <= now) this.#grants.delete(id)
    }
  }

  issue<State, Action, View, Config>(
    scopeId: string,
    adapter: GameAdapter<State, Action, View, Config>,
    state: State,
    actors: readonly GameActor[],
    delegatedByActorId: string,
    playerAgentActorId: string,
  ): OneTurnDelegation {
    this.prune()
    if (!scopeId.trim()) throw new DelegationError('Delegation scope is required')
    const delegator = actors.find((actor) => actor.id === delegatedByActorId)
    const delegate = actors.find((actor) => actor.id === playerAgentActorId)
    if (!delegator || delegator.role !== 'human') {
      throw new DelegationError('Only the active human may delegate a turn')
    }
    if (!delegate || delegate.role !== 'player-agent') {
      throw new DelegationError('A turn may be delegated only to a player agent')
    }
    if (adapter.activeActor(state) !== delegatedByActorId) {
      throw new DelegationError('Delegator does not own the active turn')
    }
    // One live capability per session/scope prevents repeated delegate clicks
    // from leaking memory or leaving multiple usable grants for one turn.
    for (const [id, existing] of this.#grants) {
      if (existing.scopeId === scopeId) this.#grants.delete(id)
    }
    while (this.#grants.size >= this.maxGrants) {
      const oldest = this.#grants.keys().next().value as string | undefined
      if (!oldest) break
      this.#grants.delete(oldest)
    }
    const grant: OneTurnDelegation = {
      id: `delegation_${this.idFactory()}`,
      scopeId,
      stateToken: stateTokenFor(adapter, state),
      delegatedByActorId,
      playerAgentActorId,
      expiresAt: this.now() + this.ttlMs,
    }
    if (this.#grants.has(grant.id)) throw new DelegationError('Delegation id was reused')
    this.#grants.set(grant.id, grant)
    return structuredClone(grant)
  }

  resolve<State, Action, View, Config>(
    scopeId: string,
    adapter: GameAdapter<State, Action, View, Config>,
    state: State,
    selection: CandidateSelection,
    chosenByActorId: string,
    grantId: string,
  ) {
    this.prune()
    const grant = this.#grants.get(grantId)
    if (!grant || grant.scopeId !== scopeId || grant.stateToken !== stateTokenFor(adapter, state)) {
      throw new DelegationError('Delegation is unknown, consumed, or belongs to another state')
    }
    if (
      chosenByActorId !== grant.playerAgentActorId ||
      selection.actorId !== grant.delegatedByActorId
    ) {
      throw new DelegationError('Delegated choice does not match the one-turn grant')
    }
    const resolved = resolveCandidate(adapter, state, selection)
    for (const [id, existing] of this.#grants) {
      if (existing.scopeId === scopeId) this.#grants.delete(id)
    }
    const delegation: ResolvedDelegationProof = Object.freeze({
      id: grant.id,
      scopeId: grant.scopeId,
      stateToken: grant.stateToken,
      candidateId: selection.candidateId,
      delegatedByActorId: grant.delegatedByActorId,
      chosenByActorId,
    })
    liveProofs.add(delegation)
    return { ...resolved, delegation }
  }

  revoke(grantId: string): boolean {
    return this.#grants.delete(grantId)
  }
}
