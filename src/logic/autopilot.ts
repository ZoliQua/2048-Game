import { GRID_SIZE } from './constants';
import { emptyCells, tilesToBoard } from './grid';
import { applyMove } from './move';
import type { Direction, GameState, Tile } from './types';

const DIRECTIONS: readonly Direction[] = ['LEFT', 'UP', 'RIGHT', 'DOWN'];

/**
 * Snake-shaped gradient that rewards keeping big tiles stacked along the top
 * row, anchored in the top-left corner (the classic 2048 corner strategy).
 */
const WEIGHTS: readonly (readonly number[])[] = [
  [65536, 16384, 4096, 1024],
  [64, 128, 256, 512],
  [16, 8, 4, 2],
  [1, 1, 1, 1],
];

type Sim = Pick<GameState, 'tiles' | 'nextTileId'>;

function live(tiles: readonly Tile[]): Tile[] {
  return tiles.filter((t) => !t.isDying);
}

/** Static evaluation: corner gradient + free cells + adjacent equal pairs. */
export function evaluateBoard(tiles: readonly Tile[]): number {
  const board = tilesToBoard(live(tiles));
  let gradient = 0;
  let empty = 0;
  let pairs = 0;
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const t = board[r]![c];
      if (!t) {
        empty += 1;
        continue;
      }
      gradient += t.value * WEIGHTS[r]![c]!;
      const right = c + 1 < GRID_SIZE ? board[r]![c + 1] : null;
      const down = r + 1 < GRID_SIZE ? board[r + 1]![c] : null;
      if (right && right.value === t.value) pairs += t.value;
      if (down && down.value === t.value) pairs += t.value;
    }
  }
  return gradient / 64 + empty * 4096 + pairs * 64;
}

function simulate(state: Sim, direction: Direction): Sim | null {
  const result = applyMove(state as GameState, direction);
  if (!result.changed) return null;
  return { tiles: live(result.tiles), nextTileId: result.nextTileId };
}

/** Best static value reachable with one more move (or a heavy penalty if stuck). */
function bestFollowUp(state: Sim): number {
  let best = -Infinity;
  for (const d of DIRECTIONS) {
    const next = simulate(state, d);
    if (next) best = Math.max(best, evaluateBoard(next.tiles));
  }
  return best === -Infinity ? -1e12 : best;
}

/**
 * Expectimax-lite move choice for the demo: for every legal move, average
 * over each possible "2" spawn (90% of real spawns) the best follow-up move's
 * evaluation. Runs on the real `applyMove`, so it can never play an illegal
 * slide. Returns null when no move changes the board.
 */
export function chooseMove(state: Pick<GameState, 'tiles' | 'nextTileId'>): Direction | null {
  let bestDir: Direction | null = null;
  let bestScore = -Infinity;
  for (const d of DIRECTIONS) {
    const moved = simulate(state, d);
    if (!moved) continue;
    const free = emptyCells(tilesToBoard(moved.tiles));
    let total = 0;
    for (const cell of free) {
      const spawned: Tile = { id: moved.nextTileId, value: 2, row: cell.row, col: cell.col };
      total += bestFollowUp({ tiles: [...moved.tiles, spawned], nextTileId: moved.nextTileId + 1 });
    }
    const score = free.length > 0 ? total / free.length : evaluateBoard(moved.tiles);
    if (score > bestScore) {
      bestScore = score;
      bestDir = d;
    }
  }
  return bestDir;
}
