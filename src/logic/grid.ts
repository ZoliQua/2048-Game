import { GRID_SIZE } from './constants';
import type { Board, Cell, Tile } from './types';

export function emptyBoard(): Board {
  const board: Board = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    const row: Cell[] = [];
    for (let c = 0; c < GRID_SIZE; c++) row.push(null);
    board.push(row);
  }
  return board;
}

export function tilesToBoard(tiles: readonly Tile[]): Board {
  const board = emptyBoard();
  for (const tile of tiles) {
    if (tile.isDying) continue;
    board[tile.row]![tile.col] = tile;
  }
  return board;
}

export function transpose(board: Board): Board {
  const out = emptyBoard();
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      out[c]![r] = board[r]![c]!;
    }
  }
  return out;
}

export function reverseRows(board: Board): Board {
  return board.map((row) => [...row].reverse());
}

export function emptyCells(board: Board): Array<{ row: number; col: number }> {
  const cells: Array<{ row: number; col: number }> = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (board[r]![c] === null) cells.push({ row: r, col: c });
    }
  }
  return cells;
}
