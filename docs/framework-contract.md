# Game Teaching Contract v1

## Deterministic adapter

Each product supplies a pure `GameAdapter`:

```ts
interface GameAdapter<State, Action, PublicView, Config> {
  manifest: GameManifest
  initialState(config: Config, seed: string): State
  serializeState(state: State): unknown
  activeActor(state: State): string | null
  legalActions(state: State, actorId: string): readonly Action[]
  canonicalAction(action: Action): unknown
  describeAction(state: State, action: Action, actorId: string): ActionDescription
  applyAction(state: State, action: Action, actorId: string): Transition<State>
  publicView(state: State, viewer: ViewerIdentity): PublicView
  teaching(state: State, action: Action, actorId: string): TeachingBundle
}
```

`applyAction` is the adapter's internal deterministic primitive. Untrusted UI or
agent choices go through `legalCandidates` and `resolveCandidate`; those
helpers recompute the legal set and reject stale state, wrong actors, unknown
ids, and duplicate canonical actions before invoking `applyAction`.

Games own their exact terminal/scoring logic. Engine evaluation has a separate
validated `EngineAnalysis` contract so an estimate is never confused with a
rule result. `validateTeachingBundle` enforces the provenance requirements on
both committed and inspected teaching.

## Stable concepts

- `stateToken`: checksum of adapter id/version, serialized authoritative state,
  and active actor. It is an integrity identity, not an authentication secret.
- `candidateId`: checksum of state token, authoritative actor, and canonical
  action. The authoritative legal set is always recomputed.
- `revision`: persistence version, separate from game state.
- `requestId`: idempotency key bound to the exact mutation payload.
- `visibility`: public, actor-private, team-private, or server-only. Actor/team
  identity is supplied by an authenticated boundary; spectators can never carry
  private actor or team scope.
- `evidence`: exact, calculated, engine, authored, model, or analogy.
- `locale`: `en`, `zh-Hans`, or `ja`.

Models receive only a bounded redacted view, legal candidate identifiers, and
validated evidence. Their output is learner-facing explanation, never hidden
reasoning or game authority.

## History, replay, and persistence

Every `GameSession` stores the game version, seed, JSON-safe configuration,
initial state, current state, and an append-only `GameHistoryEntry` for each
commit. A history entry binds the request, candidate, actor, before/after state
tokens, canonical action, exact events, and validated teaching evidence.
`replaySession` regenerates the initial state and verifies the complete chain.
Applications must run it before treating a hydrated session as authority; the
reference demo verifies every resumed and newly persisted session before use.

`SessionRepository` provides exact request-id replay within a bounded response
window and revision checks. Older request ids remain reserved in the append-only
history and are rejected rather than re-applied. Its `MemoryStorage` implements
atomic compare-and-set for the single session value changed by `mutate`.
`AtomicStorageLike` does **not** make multi-key create, resume, delete, or index
updates transactional. Browser `localStorage` has no multi-key transaction, so
the complete repository lifecycle is deliberately single-writer. Production
multi-tab, multi-process, or multi-user products must externally serialize all
lifecycle operations or use a transactional server/database.

## Delegation

`DelegationRegistry` is a domain/server-owned one-use capability registry. It
issues an opaque random grant only from the active human to a declared
`player-agent`, binds it to an authority/session scope and one state, and consumes it after one successfully
resolved candidate. Only one live grant exists per scope; abandoned grants
expire and a global capacity bounds the registry. Companion and narrator roles cannot receive a grant. Keep
the registry and authenticated caller binding outside model/UI reach. Passing
the resolved proof into persistence claims it before any reducer or storage
callback; if the later mutation fails, that one-turn proof remains burned.
Authority scope/session identifiers must be globally unique across stores.

## Common interaction

Every product keeps the same learning loop:

1. Show legal intentions before commitment.
2. Hover, focus, or tap a candidate to preview consequences.
3. Keep previews non-mutating and visibly hypothetical.
4. Persist with the expected revision before updating visible committed state.
5. Explain exact change, strategic purpose, likely response, failure condition,
   and transferable principle with separate evidence labels.
6. Preserve the replayable chronicle and resume one logical session without
   creating duplicates in the supported single-writer browser scope.
