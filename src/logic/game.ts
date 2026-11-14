import { applyMove } from './move';
import { spawnTile } from './spawn';
import { UNDO_LIMIT } from './types';
import { hasLost, hasWon, maxTile } from './win';
import type { GameAction, GameState, HistorySnapshot, Rng, Tile } from './types';
import { TARGET_VALUE } from './constants';

export type CreateInitialOptions = Partial<Pick<GameState, 'status'>>;

/** A fresh 4×4 board with two spawned tiles, ready to play (`running`). */
export function createInitialState(rng: Rng, options: CreateInitialOptions = {}): GameState {
  let state: GameState = {
    tiles: [],
    size: 4,
    status: options.status ?? 'running',
    score: 0,
    hasWon: false,
    continueAfterWin: false,
    moveCount: 0,
    nextTileId: 1,
    history: [],
  };
  for (let i = 0; i < 2; i++) {
    const { tile, nextTileId } = spawnTile(state, rng);
    if (!tile) break;
    state = { ...state, tiles: [...state.tiles, tile], nextTileId };
  }
  return state;
}

/** Tiles without the one-render animation flags (and without dying tiles). */
export function settledTiles(tiles: readonly Tile[]): Tile[] {
  return tiles
    .filter((t) => !t.isDying)
    .map((t) => ({ id: t.id, value: t.value, row: t.row, col: t.col }));
}

function snapshot(state: GameState): HistorySnapshot {
  // Drop the volatile per-move animation flags so an undo restore lands on a
  // visually quiet board (no spurious spawn-pop or merge-pulse triggered).
  return {
    tiles: settledTiles(state.tiles),
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

/** True when the run reached the 2048 target (used for the run outcome). */
export function reachedTarget(state: GameState): boolean {
  return state.hasWon || maxTile(state) >= TARGET_VALUE;
}

/** True while undo has something to restore and input is accepted. */
export function canUndo(state: GameState): boolean {
  return state.history.length > 0 && (state.status === 'running' || state.status === 'won');
}

export function advanceGame(state: GameState, action: GameAction, rng: Rng): GameState {
  switch (action.type) {
    case 'restart': {
      return createInitialState(rng);
    }
    case 'finish': {
      if (state.status === 'gameOver' || state.moveCount === 0) return state;
      return { ...state, status: 'gameOver', finishedEarly: true };
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
      // The winning move may also have filled the board: continuing then ends the run.
      return { ...state, status: hasLost(state) ? 'gameOver' : 'running', continueAfterWin: true };
    }
    case 'commitAnimation': {
      const liveTiles = state.tiles.filter((t) => !t.isDying);
      const cleared = clearVolatileFlags(liveTiles);
      if (cleared.length === state.tiles.length && cleared.every((t, i) => t === state.tiles[i])) {
        return state;
      }
      return { ...state, tiles: cleared };
    }
    case 'move': {
      if (state.status !== 'running') return state;

      const result = applyMove(state, action.direction);
      if (!result.changed) return state;

      const movedState: GameState = {
        ...state,
        tiles: result.tiles,
        score: state.score + result.scoreDelta,
        nextTileId: result.nextTileId,
        moveCount: state.moveCount + 1,
      };

      const { tile: spawned, nextTileId: afterSpawnId } = spawnTile(movedState, rng);
      const afterSpawn: GameState = spawned
        ? { ...movedState, tiles: [...movedState.tiles, spawned], nextTileId: afterSpawnId }
        : movedState;

      const justWon = !state.hasWon && (result.reachedTarget || hasWon(afterSpawn));
      const overlayWon = justWon && !state.continueAfterWin;

      let status: GameState['status'] = 'running';
      if (overlayWon) status = 'won';
      else if (hasLost(afterSpawn)) status = 'gameOver';

      return {
        ...afterSpawn,
        hasWon: state.hasWon || justWon,
        status,
        history: [snapshot(state), ...state.history].slice(0, UNDO_LIMIT),
      };
    }
    case 'undo': {
      if (!canUndo(state)) return state;
      const [prev, ...rest] = state.history;
      return { ...prev!, history: rest };
    }
  }
}
