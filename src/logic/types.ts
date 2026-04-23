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
};

export type GameAction =
  | { type: 'move'; direction: Direction }
  | { type: 'commitAnimation' }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'continueAfterWin' }
  | { type: 'restart' };

export type Rng = () => number;

export type Cell = Tile | null;
export type Board = Cell[][];
