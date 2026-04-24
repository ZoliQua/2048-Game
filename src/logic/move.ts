import { GRID_SIZE } from './constants';
import { emptyBoard, reverseRows, tilesToBoard, transpose } from './grid';
import { slideAndMergeLine } from './merge';
import type { Board, Cell, Direction, GameState, Tile } from './types';

export type MoveResult = {
  tiles: Tile[];
  scoreDelta: number;
  changed: boolean;
  nextTileId: number;
  reachedTarget: boolean;
};

function boardToLeftOrientation(board: Board, direction: Direction): Board {
  switch (direction) {
    case 'LEFT':
      return board;
    case 'RIGHT':
      return reverseRows(board);
    case 'UP':
      return transpose(board);
    case 'DOWN':
      return reverseRows(transpose(board));
  }
}

function boardFromLeftOrientation(board: Board, direction: Direction): Board {
  switch (direction) {
    case 'LEFT':
      return board;
    case 'RIGHT':
      return reverseRows(board);
    case 'UP':
      return transpose(board);
    case 'DOWN':
      return transpose(reverseRows(board));
  }
}

function fromLeftCoord(r: number, c: number, direction: Direction): { row: number; col: number } {
  switch (direction) {
    case 'LEFT':
      return { row: r, col: c };
    case 'RIGHT':
      return { row: r, col: GRID_SIZE - 1 - c };
    case 'UP':
      return { row: c, col: r };
    case 'DOWN':
      return { row: GRID_SIZE - 1 - c, col: r };
  }
}

/**
 * Apply a slide+merge in `direction` to the canonical state. Pure: returns the
 * new tile list (with surviving ids preserved, merged tiles minted fresh, and
 * source tiles marked `isDying` for one render so the UI can animate the
 * collapse). Spawn is the caller's job — this only resolves the move itself.
 */
export function applyMove(state: GameState, direction: Direction): MoveResult {
  const liveTiles = state.tiles.filter((t) => !t.isDying);
  const board = tilesToBoard(liveTiles);
  const oriented = boardToLeftOrientation(board, direction);

  const resolved: Board = emptyBoard();
  let scoreDelta = 0;
  let changed = false;
  let nextTileId = state.nextTileId;
  let reachedTarget = false;
  const dyingExtras: Tile[] = [];

  const sourcesById = new Map<number, Tile>();
  for (const tile of liveTiles) sourcesById.set(tile.id, tile);

  for (let r = 0; r < GRID_SIZE; r++) {
    const line: Array<Cell> = [];
    for (let c = 0; c < GRID_SIZE; c++) line.push(oriented[r]![c]!);
    const result = slideAndMergeLine(line);
    if (result.changed) changed = true;
    scoreDelta += result.scoreDelta;
    for (let c = 0; c < GRID_SIZE; c++) {
      const out = result.output[c];
      const merge = result.merges[c];
      if (merge) {
        const [aId, bId] = merge;
        const aSource = sourcesById.get(aId)!;
        const bSource = sourcesById.get(bId)!;
        const mergedValue = aSource.value * 2;
        const mergedId = nextTileId++;
        const mergedTile: Tile = {
          id: mergedId,
          value: mergedValue,
          row: r,
          col: c,
          mergedFrom: [aId, bId],
        };
        resolved[r]![c] = mergedTile;
        if (mergedValue >= 2048) reachedTarget = true;
        const finalCoord = fromLeftCoord(r, c, direction);
        dyingExtras.push(
          { ...aSource, row: finalCoord.row, col: finalCoord.col, isDying: true },
          { ...bSource, row: finalCoord.row, col: finalCoord.col, isDying: true },
        );
      } else if (out) {
        resolved[r]![c] = { ...out, row: r, col: c };
      }
    }
  }

  const finalBoard = boardFromLeftOrientation(resolved, direction);

  const mergedThisMove = new Set<number>();
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const t = resolved[r]![c];
      if (t && t.mergedFrom) mergedThisMove.add(t.id);
    }
  }

  const survivors: Tile[] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const t = finalBoard[r]![c];
      if (!t) continue;
      const wasMergedThisMove = mergedThisMove.has(t.id);
      survivors.push({
        id: t.id,
        value: t.value,
        row: r,
        col: c,
        ...(wasMergedThisMove ? { mergedFrom: t.mergedFrom! } : {}),
      });
    }
  }

  const tiles = changed ? [...survivors, ...dyingExtras] : state.tiles;

  return {
    tiles,
    scoreDelta: changed ? scoreDelta : 0,
    changed,
    nextTileId: changed ? nextTileId : state.nextTileId,
    reachedTarget: changed && reachedTarget,
  };
}
