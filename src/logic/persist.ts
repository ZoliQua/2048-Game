import { GRID_SIZE } from './constants';
import { UNDO_LIMIT } from './types';
import type { GameState, GameStatus, HistorySnapshot, Tile } from './types';

const STATUSES: readonly GameStatus[] = ['running', 'paused', 'won', 'gameOver'];
/** Largest representable 2048 tile on a 4×4 board is 2^17. */
const MAX_TILE = 2 ** 17;

const isInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v);
const isPowerOfTwo = (v: number) => v >= 2 && v <= MAX_TILE && (v & (v - 1)) === 0;

function isTile(v: unknown): v is Tile {
  if (typeof v !== 'object' || v === null) return false;
  const t = v as Record<string, unknown>;
  if (!isInt(t.id) || (t.id as number) < 1) return false;
  if (!isInt(t.value) || !isPowerOfTwo(t.value as number)) return false;
  if (!isInt(t.row) || !isInt(t.col)) return false;
  const row = t.row as number;
  const col = t.col as number;
  if (row < 0 || col < 0 || row >= GRID_SIZE || col >= GRID_SIZE) return false;
  if (t.isNew !== undefined && typeof t.isNew !== 'boolean') return false;
  if (t.isDying !== undefined && typeof t.isDying !== 'boolean') return false;
  if (t.mergedFrom !== undefined) {
    const m = t.mergedFrom;
    if (!Array.isArray(m) || m.length !== 2 || !m.every(isInt)) return false;
  }
  return true;
}

/** Live tiles must sit on distinct cells and carry distinct ids below nextTileId. */
function areTilesConsistent(tiles: Tile[], nextTileId: number): boolean {
  const cells = new Set<number>();
  const ids = new Set<number>();
  for (const t of tiles) {
    if (t.id >= nextTileId || ids.has(t.id)) return false;
    ids.add(t.id);
    if (t.isDying) continue;
    const cell = t.row * GRID_SIZE + t.col;
    if (cells.has(cell)) return false;
    cells.add(cell);
  }
  return true;
}

function isSnapshotShape(v: unknown): v is HistorySnapshot {
  if (typeof v !== 'object' || v === null) return false;
  const s = v as Record<string, unknown>;
  if (s.size !== GRID_SIZE) return false;
  if (!STATUSES.includes(s.status as GameStatus)) return false;
  if (!isInt(s.score) || (s.score as number) < 0) return false;
  if (!isInt(s.moveCount) || (s.moveCount as number) < 0) return false;
  if (!isInt(s.nextTileId) || (s.nextTileId as number) < 1) return false;
  if (typeof s.hasWon !== 'boolean' || typeof s.continueAfterWin !== 'boolean') return false;
  if (!Array.isArray(s.tiles) || s.tiles.length > GRID_SIZE * GRID_SIZE * 2) return false;
  if (!s.tiles.every(isTile)) return false;
  return areTilesConsistent(s.tiles as Tile[], s.nextTileId as number);
}

/** Guards a saved session (including its undo history) before it is trusted as GameState. */
export function is2048State(v: unknown): v is GameState {
  if (!isSnapshotShape(v)) return false;
  const s = v as unknown as Record<string, unknown>;
  if ((s.tiles as Tile[]).every((t) => t.isDying)) return false;
  if (!Array.isArray(s.history) || s.history.length > UNDO_LIMIT) return false;
  return s.history.every(
    (h) =>
      isSnapshotShape(h) &&
      !('history' in (h as object)) &&
      (h as HistorySnapshot).moveCount < (s.moveCount as number),
  );
}
