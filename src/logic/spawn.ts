import { SPAWN_FOUR_PROBABILITY } from './constants';
import { emptyCells, tilesToBoard } from './grid';
import type { GameState, Rng, Tile } from './types';

export type SpawnResult = {
  tile: Tile | null;
  nextTileId: number;
};

/**
 * Pick a uniformly random empty cell and place a tile of value 2 (90%) or
 * 4 (10%). RNG is injected so the function is deterministic in tests.
 *
 * Returns `tile: null` when there are no empty cells (full board) — the caller
 * decides whether that means game-over.
 */
export function spawnTile(state: GameState, rng: Rng): SpawnResult {
  const liveTiles = state.tiles.filter((t) => !t.isDying);
  const board = tilesToBoard(liveTiles);
  const free = emptyCells(board);
  if (free.length === 0) return { tile: null, nextTileId: state.nextTileId };

  const cell = free[Math.floor(rng() * free.length)]!;
  const value = rng() < SPAWN_FOUR_PROBABILITY ? 4 : 2;
  const id = state.nextTileId;
  const tile: Tile = {
    id,
    value,
    row: cell.row,
    col: cell.col,
    isNew: true,
  };
  return { tile, nextTileId: id + 1 };
}
