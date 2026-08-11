import type {
  GameAdapter,
  GameManifest,
  TeachingBundle,
  Transition,
  ViewerIdentity,
} from '@lazyingart/game-core'

export type Mark = 'sun' | 'moon'
export type Cell = Mark | null

export interface LineState {
  board: readonly Cell[]
  turn: Mark
  winner: Mark | 'draw' | null
  moveNumber: number
}

export interface LineAction {
  cell: number
}

export interface LineView extends LineState {}

const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
] as const

export const lineManifest: GameManifest = {
  id: 'line-and-light',
  version: '1',
  titleKey: 'app.title',
  descriptionKey: 'app.subtitle',
  minPlayers: 2,
  maxPlayers: 2,
  information: 'perfect',
  locales: ['en', 'zh-Hans', 'ja'],
}

export function lineWinner(board: readonly Cell[]): Mark | 'draw' | null {
  for (const [a, b, c] of WIN_LINES) {
    const mark = board[a]
    if (mark && mark === board[b] && mark === board[c]) return mark
  }
  return board.every(Boolean) ? 'draw' : null
}

function positionKind(cell: number): 'center' | 'corner' | 'edge' {
  if (cell === 4) return 'center'
  if ([0, 2, 6, 8].includes(cell)) return 'corner'
  return 'edge'
}

function teaching(action: LineAction, state: LineState): TeachingBundle {
  const kind = positionKind(action.cell)
  const row = Math.floor(action.cell / 3) + 1
  const column = (action.cell % 3) + 1
  const opponent: Mark = state.turn === 'sun' ? 'moon' : 'sun'
  const openLines = WIN_LINES.filter(
    (line) => line.some((cell) => cell === action.cell) && line.every((cell) => state.board[cell] !== opponent),
  ).length
  const hypothetical = [...state.board]
  hypothetical[action.cell] = state.turn
  const terminal = lineWinner(hypothetical)
  return {
    intent: {
      id: 'intent',
      evidence: 'authored',
      messageKey: `teaching.intent.${kind}`,
      params: { row, column },
    },
    reason: [{
      id: 'reason',
      evidence: 'calculated',
      messageKey: `teaching.reason.${state.turn}`,
      params: { options: openLines },
    }],
    changes: [{
      id: 'change',
      evidence: 'exact',
      messageKey: `teaching.change.${state.turn}`,
      params: { row, column },
    }],
    reply: {
      id: 'reply',
      evidence: terminal ? 'exact' : 'authored',
      messageKey: terminal ? 'teaching.reply.terminal' : 'teaching.reply',
    },
    next: {
      id: 'next',
      evidence: 'authored',
      messageKey: terminal ? 'teaching.next.terminal' : 'teaching.next',
    },
    principle: {
      id: 'principle',
      evidence: 'authored',
      messageKey: 'teaching.principle',
    },
  }
}

export const lineAdapter: GameAdapter<LineState, LineAction, LineView, undefined> = {
  manifest: lineManifest,
  initialState: () => ({ board: Array<Cell>(9).fill(null), turn: 'sun', winner: null, moveNumber: 0 }),
  serializeState: (state) => state,
  activeActor: (state) => state.winner ? null : state.turn,
  legalActions: (state, actorId) => {
    if (state.winner || actorId !== state.turn) return []
    return state.board.flatMap((cell, index) => cell ? [] : [{ cell: index }])
  },
  canonicalAction: (action) => ({ cell: action.cell }),
  describeAction: (_state, action) => ({
    titleKey: 'candidate.title',
    summaryKey: `candidate.${positionKind(action.cell)}`,
    intent: positionKind(action.cell),
    params: { row: Math.floor(action.cell / 3) + 1, column: (action.cell % 3) + 1 },
  }),
  applyAction: (state, action, actorId): Transition<LineState> => {
    if (actorId !== state.turn || state.winner || state.board[action.cell] !== null) {
      throw new Error('Illegal line-game action')
    }
    const board = [...state.board]
    board[action.cell] = state.turn
    const winner = lineWinner(board)
    return {
      state: {
        board,
        turn: state.turn === 'sun' ? 'moon' : 'sun',
        winner,
        moveNumber: state.moveNumber + 1,
      },
      events: [{
        type: 'mark-placed',
        actorId,
        messageKey: 'event.placed',
        params: { cell: action.cell + 1 },
      }],
    }
  },
  publicView: (state, _viewer: ViewerIdentity) => state,
  teaching: (state, action) => teaching(action, state),
}
