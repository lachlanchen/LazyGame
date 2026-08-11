import { canonicalStringify, identityDigest } from './canonical.js'
import { assertResolvedDelegationProof, consumeResolvedDelegationProof } from './delegation.js'
import { validateTeachingBundle } from './teaching.js'
import type { GameSession, GameSessionMetadata, SessionMutationRecord } from './types.js'

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

/** Atomic only for one key; it does not transact the repository's lifecycle/index. */
export interface AtomicStorageLike extends StorageLike {
  compareAndSetItem(key: string, expected: string | null, next: string): boolean
}

interface IdempotencyRecord<State> {
  requestId: string
  fingerprint: string
  responseRevision: number
  responseState: State
  responseHistoryLength: number
  responseUpdatedAt: string
}

interface StoredSession<State> extends GameSession<State> {
  idempotency: IdempotencyRecord<State>[]
}

interface SessionIndex {
  ids: string[]
  resume: Record<string, string>
}

export class RevisionConflict extends Error {
  constructor(message = 'Session revision is stale') {
    super(message)
    this.name = 'RevisionConflict'
  }
}

export class RequestConflict extends Error {
  constructor(message = 'Request id was reused with another payload') {
    super(message)
    this.name = 'RequestConflict'
  }
}

export class SessionCompatibilityError extends Error {
  constructor(message = 'Stored session schema or game version is incompatible') {
    super(message)
    this.name = 'SessionCompatibilityError'
  }
}

export class MemoryStorage implements AtomicStorageLike {
  private readonly values = new Map<string, string>()

  getItem(key: string): string | null {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value)
  }

  removeItem(key: string): void {
    this.values.delete(key)
  }

  compareAndSetItem(key: string, expected: string | null, next: string): boolean {
    if (this.getItem(key) !== expected) return false
    this.setItem(key, next)
    return true
  }
}

export interface SessionRepositoryOptions<State> {
  stateToken(state: State): string
  prefix?: string
  now?: () => Date
  idFactory?: () => string
  idempotencyLimit?: number
}

export class SessionRepository<State> {
  private readonly prefix: string
  private readonly now: () => Date
  private readonly idFactory: () => string
  private readonly idempotencyLimit: number
  private readonly stateToken: (state: State) => string

  constructor(
    private readonly storage: StorageLike,
    options: SessionRepositoryOptions<State>,
  ) {
    this.stateToken = options.stateToken
    this.prefix = options.prefix ?? 'game-teaching.v1'
    this.now = options.now ?? (() => new Date())
    this.idFactory = options.idFactory ?? (() => crypto.randomUUID())
    this.idempotencyLimit = options.idempotencyLimit ?? 32
    if (!Number.isSafeInteger(this.idempotencyLimit) || this.idempotencyLimit < 1 || this.idempotencyLimit > 4096) {
      throw new TypeError('Idempotency retention must be a safe integer from 1 to 4096')
    }
  }

  private indexKey(): string {
    return `${this.prefix}.index`
  }

  private sessionKey(id: string): string {
    return `${this.prefix}.session.${id}`
  }

  private readIndex(): SessionIndex {
    const raw = this.storage.getItem(this.indexKey())
    if (!raw) return { ids: [], resume: {} }
    const parsed = JSON.parse(raw) as SessionIndex
    return { ids: [...parsed.ids], resume: { ...parsed.resume } }
  }

  private writeIndex(index: SessionIndex): void {
    this.storage.setItem(this.indexKey(), JSON.stringify(index))
  }

  private readStored(id: string): StoredSession<State> | null {
    const raw = this.storage.getItem(this.sessionKey(id))
    if (!raw) return null
    const parsed = this.decodeStored(raw)
    return parsed
  }

  private decodeStored(raw: string): StoredSession<State> {
    const parsed = JSON.parse(raw) as Omit<StoredSession<State>, 'idempotency'> & { idempotency?: unknown[] }
    if (parsed.schemaVersion !== 1 || !Array.isArray(parsed.history)) {
      throw new SessionCompatibilityError()
    }
    if (!Array.isArray(parsed.idempotency)) throw new SessionCompatibilityError()
    const idempotency = parsed.idempotency.map((rawEntry) => {
      const entry = rawEntry as Partial<IdempotencyRecord<State>> & { response?: GameSession<State> }
      if (
        typeof entry.requestId !== 'string' || typeof entry.fingerprint !== 'string'
      ) throw new SessionCompatibilityError()
      if (entry.response) {
        return {
          requestId: entry.requestId,
          fingerprint: entry.fingerprint,
          responseRevision: entry.response.revision,
          responseState: entry.response.state,
          responseHistoryLength: entry.response.history.length,
          responseUpdatedAt: entry.response.updatedAt,
        }
      }
      const responseRevision = entry.responseRevision
      const responseHistoryLength = entry.responseHistoryLength
      if (
        typeof responseRevision !== 'number' || !Number.isSafeInteger(responseRevision) || responseRevision < 1 ||
        typeof responseHistoryLength !== 'number' || !Number.isSafeInteger(responseHistoryLength) || responseHistoryLength < 0 ||
        typeof entry.responseUpdatedAt !== 'string' || !Object.hasOwn(entry, 'responseState')
      ) throw new SessionCompatibilityError()
      canonicalStringify(entry.responseState)
      return {
        requestId: entry.requestId,
        fingerprint: entry.fingerprint,
        responseRevision,
        responseState: entry.responseState as State,
        responseHistoryLength,
        responseUpdatedAt: entry.responseUpdatedAt,
      }
    })
    return { ...parsed, idempotency } as StoredSession<State>
  }

  private responseFromIdempotency(
    stored: StoredSession<State>,
    prior: IdempotencyRecord<State>,
  ): GameSession<State> {
    if (prior.responseHistoryLength > stored.history.length) throw new SessionCompatibilityError()
    return {
      schemaVersion: 1,
      id: stored.id,
      gameId: stored.gameId,
      resumeKey: stored.resumeKey,
      revision: prior.responseRevision,
      gameVersion: stored.gameVersion,
      seed: stored.seed,
      config: structuredClone(stored.config),
      initialState: structuredClone(stored.initialState),
      state: structuredClone(prior.responseState),
      history: structuredClone(stored.history.slice(0, prior.responseHistoryLength)),
      createdAt: stored.createdAt,
      updatedAt: prior.responseUpdatedAt,
    }
  }

  private writeStored(session: StoredSession<State>): void {
    this.storage.setItem(this.sessionKey(session.id), JSON.stringify(session))
  }

  private commitStored(id: string, expected: string, session: StoredSession<State>): void {
    const key = this.sessionKey(id)
    const next = JSON.stringify(session)
    const storage = this.storage as StorageLike & Partial<AtomicStorageLike>
    if (storage.compareAndSetItem) {
      if (!storage.compareAndSetItem(key, expected, next)) throw new RevisionConflict()
      return
    }
    // Browser Storage has no atomic compare-and-set. This second read blocks
    // synchronous/re-entrant overwrites, but callers must still serialize
    // writers across tabs/processes. AtomicStorageLike protects this mutate
    // key only; create/resume/delete/index still require external serialization.
    if (storage.getItem(key) !== expected) throw new RevisionConflict()
    storage.setItem(key, next)
  }

  private resumeComposite(gameId: string, resumeKey: string): string {
    return canonicalStringify([gameId, resumeKey])
  }

  get(id: string): GameSession<State> | null {
    const stored = this.readStored(id)
    if (!stored) return null
    const { idempotency: _ignored, ...session } = stored
    return structuredClone(session)
  }

  list(gameId?: string): readonly GameSession<State>[] {
    return this.readIndex()
      .ids.map((id) => this.get(id))
      .filter((session): session is GameSession<State> => Boolean(session))
      .filter((session) => gameId === undefined || session.gameId === gameId)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
  }

  resumeOrCreate(
    gameId: string,
    resumeKey: string,
    initialState: () => State,
    metadata: GameSessionMetadata,
  ): { session: GameSession<State>; created: boolean } {
    if (!metadata.gameVersion.trim() || !metadata.seed.trim()) {
      throw new TypeError('Session game version and replay seed are required')
    }
    const configIdentity = canonicalStringify(metadata.config)
    let index = this.readIndex()
    const composite = this.resumeComposite(gameId, resumeKey)
    const legacyComposite = `${gameId}:${resumeKey}`
    let existingId = index.resume[composite]
    if (!existingId) {
      const legacyId = index.resume[legacyComposite]
      const legacy = legacyId ? this.get(legacyId) : null
      if (legacy && legacy.gameId === gameId && legacy.resumeKey === resumeKey) {
        existingId = legacy.id
        index.resume[composite] = legacy.id
        delete index.resume[legacyComposite]
        this.writeIndex(index)
      }
    }
    if (existingId) {
      const existing = this.get(existingId)
      if (existing) {
        if (
          existing.gameVersion !== metadata.gameVersion ||
          canonicalStringify(existing.config) !== configIdentity
        ) {
          throw new SessionCompatibilityError('Resume key belongs to another game version or configuration')
        }
        return { session: existing, created: false }
      }
      delete index.resume[composite]
    }
    const initial = initialState()
    canonicalStringify(initial)
    if (!this.stateToken(initial).trim()) throw new TypeError('Initial state token is required')
    // The initializer is application code and may re-enter storage. Re-read
    // before claiming an id so exactly one same-key session wins.
    index = this.readIndex()
    const racedId = index.resume[composite]
    if (racedId) {
      const raced = this.get(racedId)
      if (raced) {
        if (
          raced.gameVersion !== metadata.gameVersion ||
          canonicalStringify(raced.config) !== configIdentity
        ) {
          throw new SessionCompatibilityError('Resume key was claimed by incompatible metadata')
        }
        return { session: raced, created: false }
      }
    }
    const timestamp = this.now().toISOString()
    const sessionId = this.idFactory()
    if (!sessionId.trim() || this.storage.getItem(this.sessionKey(sessionId)) !== null || index.ids.includes(sessionId)) {
      throw new TypeError('Generated session id is empty or already in use')
    }
    const session: StoredSession<State> = {
      schemaVersion: 1,
      id: sessionId,
      gameId,
      resumeKey,
      revision: 1,
      gameVersion: metadata.gameVersion,
      seed: metadata.seed,
      config: structuredClone(metadata.config),
      initialState: structuredClone(initial),
      state: initial,
      history: [],
      createdAt: timestamp,
      updatedAt: timestamp,
      idempotency: [],
    }
    index.ids = [session.id, ...index.ids.filter((id) => id !== session.id)]
    index.resume[composite] = session.id
    this.writeStored(session)
    this.writeIndex(index)
    return { session: this.get(session.id)!, created: true }
  }

  mutate(
    id: string,
    expectedRevision: number,
    requestId: string,
    payload: unknown,
    reducer: (state: State) => State,
    record: SessionMutationRecord,
  ): GameSession<State> {
    if (!requestId.trim()) throw new TypeError('Request id is required')
    const storedRaw = this.storage.getItem(this.sessionKey(id))
    if (!storedRaw) throw new RevisionConflict('Session does not exist')
    const stored = this.decodeStored(storedRaw)
    const fingerprint = identityDigest(payload)
    const prior = stored.idempotency.find((entry) => entry.requestId === requestId)
    if (prior) {
      if (prior.fingerprint !== fingerprint) throw new RequestConflict()
      return this.responseFromIdempotency(stored, prior)
    }
    if (stored.history.some((entry) => entry.requestId === requestId)) {
      throw new RequestConflict('Request id is older than the retained exact response window')
    }
    if (stored.revision !== expectedRevision) throw new RevisionConflict()
    if (
      !record.candidateId.trim() || !record.actorId.trim() ||
      !record.stateTokenBefore.trim() || !record.stateTokenAfter.trim()
    ) {
      throw new TypeError('Chronicle identity fields are required')
    }
    const rawRecord = record as SessionMutationRecord & {
      chosenByActorId?: unknown
      delegationId?: unknown
      delegationScopeId?: unknown
    }
    if (
      rawRecord.chosenByActorId !== undefined || rawRecord.delegationId !== undefined ||
      rawRecord.delegationScopeId !== undefined
    ) {
      throw new TypeError('Delegation provenance requires an issued delegation proof')
    }
    if (record.delegation) {
      assertResolvedDelegationProof(
        record.delegation, id, record.actorId, record.stateTokenBefore, record.candidateId,
      )
      // Claim the capability before any canonicalizer, reducer, or storage
      // callback can re-enter another repository. A later failure burns the
      // one-turn grant; fail-closed authority is preferable to double use.
      consumeResolvedDelegationProof(record.delegation)
    }
    canonicalStringify(record)
    const teaching = validateTeachingBundle(record.teaching)
    const committedAt = this.now().toISOString()
    const nextState = reducer(structuredClone(stored.state))
    canonicalStringify(nextState)
    if (
      record.stateTokenBefore !== this.stateToken(stored.state) ||
      record.stateTokenAfter !== this.stateToken(nextState)
    ) {
      throw new TypeError('Chronicle state tokens do not match the persisted transition')
    }
    const updated: GameSession<State> = {
      schemaVersion: 1,
      id: stored.id,
      gameId: stored.gameId,
      resumeKey: stored.resumeKey,
      revision: stored.revision + 1,
      gameVersion: stored.gameVersion,
      seed: stored.seed,
      config: stored.config,
      initialState: stored.initialState,
      state: nextState,
      history: [
        ...stored.history,
        {
          sequence: stored.history.length + 1,
          requestId,
          candidateId: record.candidateId,
          actorId: record.actorId,
          ...(record.delegation ? {
            chosenByActorId: record.delegation.chosenByActorId,
            delegationId: record.delegation.id,
            delegationScopeId: record.delegation.scopeId,
          } : {}),
          stateTokenBefore: record.stateTokenBefore,
          stateTokenAfter: record.stateTokenAfter,
          canonicalAction: structuredClone(record.canonicalAction),
          events: structuredClone(record.events),
          teaching: structuredClone(teaching),
          committedAt,
        },
      ],
      createdAt: stored.createdAt,
      updatedAt: committedAt,
    }
    const next: StoredSession<State> = {
      ...updated,
      idempotency: [
        ...stored.idempotency,
        {
          requestId,
          fingerprint,
          responseRevision: updated.revision,
          responseState: structuredClone(updated.state),
          responseHistoryLength: updated.history.length,
          responseUpdatedAt: updated.updatedAt,
        },
      ].slice(-this.idempotencyLimit),
    }
    this.commitStored(id, storedRaw, next)
    return structuredClone(updated)
  }

  delete(id: string, expectedRevision: number): boolean {
    const stored = this.readStored(id)
    if (!stored) return false
    if (stored.revision !== expectedRevision) throw new RevisionConflict()
    const index = this.readIndex()
    index.ids = index.ids.filter((candidate) => candidate !== id)
    const composite = this.resumeComposite(stored.gameId, stored.resumeKey)
    if (index.resume[composite] === id) delete index.resume[composite]
    const legacyComposite = `${stored.gameId}:${stored.resumeKey}`
    if (index.resume[legacyComposite] === id) delete index.resume[legacyComposite]
    this.storage.removeItem(this.sessionKey(id))
    this.writeIndex(index)
    return true
  }
}

export function mutationFingerprint(value: unknown): string {
  return identityDigest(value)
}
