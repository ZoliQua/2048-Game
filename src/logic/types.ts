export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

/**
 * 2048 has no "idle" phase: a fresh board is immediately `running` (the run
 * clock starts with the first move). `won` is the win/continue choice shown
 * when the first 2048 tile appears; the arcade layer treats it like a pause.
 */
export type GameStatus = 'running' | 'paused' | 'won' | 'gameOver';

export type Tile = {
  id: number;
  value: number;
  row: number;
  col: number;
  mergedFrom?: [number, number];
  isNew?: boolean;
  isDying?: boolean;
};

export type GameState = {
  tiles: Tile[];
  size: 4;
  status: GameStatus;
  score: number;
  hasWon: boolean;
  continueAfterWin: boolean;
  moveCount: number;
  nextTileId: number;
  history: HistorySnapshot[];
};

/**
 * Snapshot taken just before a move is applied, so `undo` can roll back the
 * exact pre-move state. `history` itself is never nested inside a snapshot.
 */
export type HistorySnapshot = Omit<GameState, 'history'>;

export const UNDO_LIMIT = 2 as const;

export type GameAction =
  | { type: 'move'; direction: Direction }
  | { type: 'commitAnimation' }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'continueAfterWin' }
  | { type: 'restart' }
  | { type: 'undo' };

export type Rng = () => number;

export type Cell = Tile | null;
export type Board = Cell[][];
