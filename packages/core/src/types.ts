export const SUPPORTED_LOCALES = [
  'en',
  'ar',
  'es',
  'fr',
  'ja',
  'ko',
  'vi',
  'zh-Hans',
  'zh-Hant',
  'de',
  'ru',
] as const
export type Locale = (typeof SUPPORTED_LOCALES)[number]

export const EVIDENCE_KINDS = [
  'exact',
  'calculated',
  'engine',
  'authored',
  'model',
  'analogy',
] as const
export type EvidenceKind = (typeof EVIDENCE_KINDS)[number]

export type Visibility =
  | { kind: 'public' }
  | { kind: 'actor'; actorId: string }
  | { kind: 'team'; teamId: string }
  | { kind: 'server' }

export type ViewerIdentity =
  | { role: 'spectator'; actorId?: never; teamId?: never }
  | { role: 'server'; actorId?: string; teamId?: string }
  | { role: 'player'; actorId: string; teamId?: string }
  | { role: 'companion'; actorId?: string; teamId?: string }

export interface VisibleValue<T> {
  visibility: Visibility
  value: T
}

export interface GameActor {
  id: string
  role: 'human' | 'player-agent' | 'companion' | 'narrator'
  teamId?: string
  labelKey: string
}

export interface GameManifest {
  id: string
  version: string
  titleKey: string
  descriptionKey: string
  minPlayers: number
  maxPlayers: number
  information: 'perfect' | 'hidden' | 'team-hidden'
  locales: readonly Locale[]
}

export interface ExactEvent {
  type: string
  actorId?: string
  messageKey: string
  params?: Readonly<Record<string, string | number | boolean>>
}

export interface TeachingClaim {
  id: string
  evidence: EvidenceKind
  messageKey: string
  params?: Readonly<Record<string, string | number | boolean>>
  source?: string
  limitationKey?: string
}

export interface TeachingBundle {
  intent: TeachingClaim
  reason: readonly TeachingClaim[]
  changes: readonly TeachingClaim[]
  reply?: TeachingClaim
  next: TeachingClaim
  principle: TeachingClaim
}

export interface ActionDescription {
  titleKey: string
  summaryKey: string
  intent: string
  params?: Readonly<Record<string, string | number | boolean>>
}

export interface Transition<State> {
  state: State
  events: readonly ExactEvent[]
}

export interface GameAdapter<State, Action, PublicView, Config> {
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

export interface BoundCandidate<Action> extends ActionDescription {
  id: string
  stateToken: string
  actorId: string
  action: Action
}

export interface CandidateSelection {
  candidateId: string
  stateToken: string
  actorId: string
}

export interface GameSessionMetadata {
  gameVersion: string
  seed: string
  config: unknown
}

export interface GameHistoryEntry {
  sequence: number
  requestId: string
  candidateId: string
  actorId: string
  chosenByActorId?: string
  delegationId?: string
  delegationScopeId?: string
  stateTokenBefore: string
  stateTokenAfter: string
  canonicalAction: unknown
  events: readonly ExactEvent[]
  teaching: TeachingBundle
  committedAt: string
}

export interface SessionMutationRecord {
  candidateId: string
  actorId: string
  delegation?: ResolvedDelegationProof
  stateTokenBefore: string
  stateTokenAfter: string
  canonicalAction: unknown
  events: readonly ExactEvent[]
  teaching: TeachingBundle
}

export interface ResolvedDelegationProof {
  readonly id: string
  readonly scopeId: string
  readonly stateToken: string
  readonly candidateId: string
  readonly delegatedByActorId: string
  readonly chosenByActorId: string
}

export interface GameSession<State> {
  schemaVersion: 1
  id: string
  gameId: string
  resumeKey: string
  revision: number
  gameVersion: string
  seed: string
  config: unknown
  initialState: State
  state: State
  history: readonly GameHistoryEntry[]
  createdAt: string
  updatedAt: string
}
