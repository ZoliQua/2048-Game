import { GRID_SIZE, TARGET_VALUE } from './constants';
import { tilesToBoard } from './grid';
import type { GameState } from './types';

export function hasWon(state: GameState): boolean {
  for (const tile of state.tiles) {
    if (tile.isDying) continue;
    if (tile.value >= TARGET_VALUE) return true;
  }
  return false;
}

export function hasLost(state: GameState): boolean {
  const liveTiles = state.tiles.filter((t) => !t.isDying);
  if (liveTiles.length < GRID_SIZE * GRID_SIZE) return false;

  const board = tilesToBoard(liveTiles);
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const cell = board[r]![c];
      if (!cell) return false;
      const right = c + 1 < GRID_SIZE ? board[r]![c + 1] : null;
      const down = r + 1 < GRID_SIZE ? board[r + 1]![c] : null;
      if (right && right.value === cell.value) return false;
      if (down && down.value === cell.value) return false;
    }
  }
  return true;
}
