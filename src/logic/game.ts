import { applyMove } from './move';
import { spawnTile } from './spawn';
import { UNDO_LIMIT } from './types';
import { hasLost, hasWon } from './win';
import type { GameAction, GameState, HistorySnapshot, Rng, Tile } from './types';

export type CreateInitialOptions = {
  best?: number;
};

export function createInitialState(rng: Rng, options: CreateInitialOptions = {}): GameState {
  const empty: GameState = {
    tiles: [],
    size: 4,
    status: 'idle',
    score: 0,
    best: options.best ?? 0,
    hasWon: false,
    continueAfterWin: false,
    moveCount: 0,
    nextTileId: 1,
    history: [],
  };
  let state = empty;
  for (let i = 0; i < 2; i++) {
    const { tile, nextTileId } = spawnTile(state, rng);
    if (!tile) break;
    state = { ...state, tiles: [...state.tiles, tile], nextTileId };
  }
  return state;
}

function snapshot(state: GameState): HistorySnapshot {
  // Drop the volatile per-move animation flags so an undo restore lands on a
  // visually quiet board (no spurious spawn-pop or merge-pulse triggered).
  const tiles: Tile[] = state.tiles
    .filter((t) => !t.isDying)
    .map((t) => ({ id: t.id, value: t.value, row: t.row, col: t.col }));
  return {
    tiles,
    size: state.size,
    status: state.status,
    score: state.score,
    hasWon: state.hasWon,
    continueAfterWin: state.continueAfterWin,
    moveCount: state.moveCount,
    nextTileId: state.nextTileId,
  };
}

function clearVolatileFlags(tiles: Tile[]): Tile[] {
  return tiles.map((t) => {
    if (!t.isNew && !t.mergedFrom) return t;
    const next: Tile = { id: t.id, value: t.value, row: t.row, col: t.col };
    if (t.isDying) next.isDying = true;
    return next;
  });
}

export function advanceGame(state: GameState, action: GameAction, rng: Rng): GameState {
  switch (action.type) {
    case 'restart': {
      return createInitialState(rng, { best: state.best });
    }
    case 'pause': {
      if (state.status !== 'running') return state;
      return { ...state, status: 'paused' };
    }
    case 'resume': {
      if (state.status !== 'paused') return state;
      return { ...state, status: 'running' };
    }
    case 'continueAfterWin': {
      if (state.status !== 'won') return state;
      return { ...state, status: 'running', continueAfterWin: true };
    }
    case 'commitAnimation': {
      const liveTiles = state.tiles.filter((t) => !t.isDying);
      const cleared = clearVolatileFlags(liveTiles);
      if (cleared.length === state.tiles.length) {
        let identical = true;
        for (let i = 0; i < cleared.length; i++) {
          if (cleared[i] !== state.tiles[i]) {
            identical = false;
            break;
          }
        }
        if (identical) return state;
      }
      return { ...state, tiles: cleared };
    }
    case 'move': {
      if (state.status !== 'idle' && state.status !== 'running') return state;

      const result = applyMove(state, action.direction);
      if (!result.changed) return state;

      const preMoveSnapshot = snapshot(state);

      const newScore = state.score + result.scoreDelta;
      const movedState: GameState = {
        ...state,
        tiles: result.tiles,
        score: newScore,
        best: Math.max(state.best, newScore),
        nextTileId: result.nextTileId,
        moveCount: state.moveCount + 1,
        status: 'running',
      };

      const { tile: spawned, nextTileId: afterSpawnId } = spawnTile(movedState, rng);
      const afterSpawn: GameState = spawned
        ? { ...movedState, tiles: [...movedState.tiles, spawned], nextTileId: afterSpawnId }
        : movedState;

      const justWon = !state.hasWon && (result.reachedTarget || hasWon(afterSpawn));
      const stickyWon = state.hasWon || justWon;
      const overlayWon = justWon && !state.continueAfterWin;

      let nextStatus = afterSpawn.status;
      if (overlayWon) nextStatus = 'won';
      else if (hasLost(afterSpawn)) nextStatus = 'gameOver';

      return {
        ...afterSpawn,
        hasWon: stickyWon,
        status: nextStatus,
        history: [preMoveSnapshot, ...state.history].slice(0, UNDO_LIMIT),
      };
    }
    case 'undo': {
      const [prev, ...rest] = state.history;
      if (!prev) return state;
      return {
        ...prev,
        best: state.best,
        history: rest,
      };
    }
  }
}
