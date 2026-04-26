export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export type GameStatus = 'idle' | 'running' | 'paused' | 'won' | 'gameOver';

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
  best: number;
  hasWon: boolean;
  continueAfterWin: boolean;
  moveCount: number;
  nextTileId: number;
  history: HistorySnapshot[];
};

/**
 * Snapshot taken just before a move is applied, so `undo` can roll back the
 * exact pre-move state. `best` and `history` itself are never rolled back —
 * `best` is the running max across the session, and stacking `history` inside
 * `history` would balloon the snapshot.
 */
export type HistorySnapshot = Omit<GameState, 'best' | 'history'>;

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
