import { describe, expect, it } from 'vitest';
import { chooseMove } from './autopilot';
import { advanceGame, canUndo, createInitialState, reachedTarget, settledTiles } from './game';
import { tilesToBoard } from './grid';
import { slideAndMergeLine } from './merge';
import { applyMove } from './move';
import { is2048State } from './persist';
import { spawnTile } from './spawn';
import type { Direction, GameState, Rng, Tile } from './types';
import { hasLost, maxTile } from './win';

/** Deterministic Park–Miller RNG for reproducible spawns. */
function seeded(seed: number): Rng {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

const zeroRng: Rng = () => 0;

/** Build a running state from a 4×4 value matrix (0 = empty). */
function fromRows(rows: number[][], over: Partial<GameState> = {}): GameState {
  const tiles: Tile[] = [];
  let id = 1;
  rows.forEach((row, r) =>
    row.forEach((value, c) => {
      if (value) tiles.push({ id: id++, value, row: r, col: c });
    }),
  );
  return {
    tiles,
    size: 4,
    status: 'running',
    score: 0,
    hasWon: false,
    continueAfterWin: false,
    moveCount: 0,
    nextTileId: id,
    history: [],
    ...over,
  };
}

/** Value matrix of the live tiles. */
function rowsOf(state: Pick<GameState, 'tiles'>): number[][] {
  return tilesToBoard(state.tiles).map((row) => row.map((t) => t?.value ?? 0));
}

const line = (values: number[]) =>
  values.map((v, i) => (v ? ({ id: i + 1, value: v, row: 0, col: i } as Tile) : null));
const lineValues = (out: ReturnType<typeof slideAndMergeLine>, src: number[]) =>
  out.output.map((t, i) => (out.merges[i] ? mergedValue(out, i, src) : (t?.value ?? 0)));
function mergedValue(out: ReturnType<typeof slideAndMergeLine>, i: number, src: number[]): number {
  const [a] = out.merges[i]!;
  return src[a - 1]! * 2;
}

describe('slideAndMergeLine', () => {
  it('merges pairs from the leading edge: [2,2,2,2] → [4,4,0,0]', () => {
    const src = [2, 2, 2, 2];
    const res = slideAndMergeLine(line(src));
    expect(lineValues(res, src)).toEqual([4, 4, 0, 0]);
    expect(res.scoreDelta).toBe(8);
  });

  it('never merges a tile twice in one move: [2,2,4,0] → [4,4,0,0]', () => {
    const src = [2, 2, 4, 0];
    const res = slideAndMergeLine(line(src));
    expect(lineValues(res, src)).toEqual([4, 4, 0, 0]);
    expect(res.scoreDelta).toBe(4);
  });

  it('merges the two tiles nearest the wall first: [2,2,2,0] → [4,2,0,0]', () => {
    const src = [2, 2, 2, 0];
    expect(lineValues(slideAndMergeLine(line(src)), src)).toEqual([4, 2, 0, 0]);
  });

  it('slides across gaps and reports unchanged lines', () => {
    const src = [0, 2, 0, 2];
    expect(lineValues(slideAndMergeLine(line(src)), src)).toEqual([4, 0, 0, 0]);
    expect(slideAndMergeLine(line([2, 4, 8, 16])).changed).toBe(false);
    expect(slideAndMergeLine(line([2, 4, 0, 0])).changed).toBe(false);
  });
});

describe('applyMove', () => {
  const quad = (d: Direction) =>
    rowsOf({ tiles: applyMove(fromRows([[2, 2, 2, 2], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]), d).tiles.filter((t) => !t.isDying) });

  it('applies the same merge order in every direction', () => {
    expect(quad('LEFT')[0]).toEqual([4, 4, 0, 0]);
    expect(quad('RIGHT')[0]).toEqual([0, 0, 4, 4]);
    const col = fromRows([[2, 0, 0, 0], [2, 0, 0, 0], [2, 0, 0, 0], [2, 0, 0, 0]]);
    const up = rowsOf({ tiles: applyMove(col, 'UP').tiles.filter((t) => !t.isDying) });
    const down = rowsOf({ tiles: applyMove(col, 'DOWN').tiles.filter((t) => !t.isDying) });
    expect(up.map((r) => r[0])).toEqual([4, 4, 0, 0]);
    expect(down.map((r) => r[0])).toEqual([0, 0, 4, 4]);
  });

  it('keeps ids of sliding tiles and mints a fresh id for merges', () => {
    const s = fromRows([[0, 2, 0, 8], [0, 0, 0, 0], [4, 4, 0, 0], [0, 0, 0, 0]]);
    const res = applyMove(s, 'LEFT');
    const live = res.tiles.filter((t) => !t.isDying);
    const two = live.find((t) => t.value === 2)!;
    expect(two.id).toBe(1);
    const merged = live.find((t) => t.value === 8 && t.row === 2)!;
    expect(merged.id).toBe(s.nextTileId);
    expect(merged.mergedFrom).toEqual([3, 4]);
    expect(res.tiles.filter((t) => t.isDying)).toHaveLength(2);
  });
});

describe('advanceGame: moves and spawns', () => {
  it('a no-op move changes nothing (no spawn, no move count)', () => {
    const s = fromRows([[2, 4, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]);
    expect(advanceGame(s, { type: 'move', direction: 'LEFT' }, zeroRng)).toBe(s);
  });

  it('scores merges and spawns exactly one tile on an empty cell', () => {
    const s = fromRows([[2, 2, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]);
    const next = advanceGame(s, { type: 'move', direction: 'LEFT' }, zeroRng);
    expect(next.score).toBe(4);
    expect(next.moveCount).toBe(1);
    const live = next.tiles.filter((t) => !t.isDying);
    expect(live).toHaveLength(2);
    const spawned = live.find((t) => t.isNew)!;
    expect(spawned).toBeTruthy();
    expect(spawned.row * 4 + spawned.col).not.toBe(0);
  });

  it('spawnTile only fills an empty cell and returns null on a full board', () => {
    const rows = [
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 0],
    ];
    for (const r of [0, 0.5, 0.999]) {
      const { tile } = spawnTile(fromRows(rows), () => r);
      expect(tile).toMatchObject({ row: 3, col: 3 });
    }
    rows[3]![3] = 2;
    expect(spawnTile(fromRows(rows), zeroRng).tile).toBeNull();
  });

  it('spawns a 4 about 10% of the time', () => {
    const rng = seeded(7);
    let fours = 0;
    const n = 5000;
    for (let i = 0; i < n; i++) if (spawnTile(fromRows([[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]), rng).tile!.value === 4) fours += 1;
    expect(fours / n).toBeGreaterThan(0.08);
    expect(fours / n).toBeLessThan(0.12);
  });

  it('creates a fresh running board with two tiles on distinct cells', () => {
    const s = createInitialState(seeded(3));
    expect(s.status).toBe('running');
    expect(s.tiles).toHaveLength(2);
    expect(new Set(s.tiles.map((t) => t.row * 4 + t.col)).size).toBe(2);
  });

  it('blocks moves while paused and resumes', () => {
    const s = fromRows([[2, 2, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]);
    const paused = advanceGame(s, { type: 'pause' }, zeroRng);
    expect(paused.status).toBe('paused');
    expect(advanceGame(paused, { type: 'move', direction: 'LEFT' }, zeroRng)).toBe(paused);
    expect(advanceGame(paused, { type: 'resume' }, zeroRng).status).toBe('running');
  });
});

describe('game over', () => {
  it('detects a full board with no adjacent equals, in both axes', () => {
    const locked = fromRows([[2, 4, 2, 4], [4, 2, 4, 2], [2, 4, 2, 4], [4, 2, 4, 2]]);
    expect(hasLost(locked)).toBe(true);
    expect(hasLost(fromRows([[2, 2, 8, 16], [4, 8, 16, 32], [8, 16, 32, 64], [16, 32, 64, 128]]))).toBe(false);
    expect(hasLost(fromRows([[2, 4, 2, 4], [2, 8, 4, 2], [8, 4, 2, 4], [4, 2, 4, 2]]))).toBe(false);
    expect(hasLost(fromRows([[0, 4, 2, 4], [4, 2, 4, 2], [2, 4, 2, 4], [4, 2, 4, 2]]))).toBe(false);
  });

  it('ends the run when the spawn after a move leaves no moves', () => {
    const s = fromRows([
      [2, 2, 8, 16],
      [32, 64, 128, 256],
      [4, 8, 16, 32],
      [64, 128, 256, 512],
    ]);
    const next = advanceGame(s, { type: 'move', direction: 'LEFT' }, zeroRng);
    expect(next.status).toBe('gameOver');
    expect(next.score).toBe(4);
    expect(advanceGame(next, { type: 'undo' }, zeroRng)).toBe(next);
  });
});

describe('win / continue', () => {
  const nearWin = () => fromRows([[1024, 1024, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]);

  it('reaching 2048 shows the win choice and blocks input until continue', () => {
    const won = advanceGame(nearWin(), { type: 'move', direction: 'LEFT' }, zeroRng);
    expect(won.status).toBe('won');
    expect(won.hasWon).toBe(true);
    expect(maxTile(won)).toBe(2048);
    expect(reachedTarget(won)).toBe(true);
    expect(advanceGame(won, { type: 'move', direction: 'DOWN' }, zeroRng)).toBe(won);

    const cont = advanceGame(won, { type: 'continueAfterWin' }, zeroRng);
    expect(cont).toMatchObject({ status: 'running', continueAfterWin: true, hasWon: true, score: won.score });
    const after = advanceGame(cont, { type: 'move', direction: 'DOWN' }, zeroRng);
    expect(after.status).toBe('running');
    expect(after.hasWon).toBe(true);
  });

  it('continuing on a board that is already locked ends the run', () => {
    const locked = fromRows([[2048, 4, 2, 4], [4, 2, 4, 2], [2, 4, 2, 4], [4, 2, 4, 2]], { status: 'won', hasWon: true });
    expect(advanceGame(locked, { type: 'continueAfterWin' }, zeroRng).status).toBe('gameOver');
  });

  it('restart resets every field', () => {
    const won = advanceGame(nearWin(), { type: 'move', direction: 'LEFT' }, zeroRng);
    const fresh = advanceGame(won, { type: 'restart' }, seeded(1));
    expect(fresh).toMatchObject({ status: 'running', score: 0, hasWon: false, continueAfterWin: false, moveCount: 0, history: [] });
    expect(fresh.tiles).toHaveLength(2);
  });
});

describe('undo', () => {
  it('rolls back up to the last two moves exactly', () => {
    const rng = seeded(11);
    const s0 = fromRows([[2, 2, 4, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 2]]);
    const s1 = advanceGame(s0, { type: 'move', direction: 'LEFT' }, rng);
    const s2 = advanceGame(s1, { type: 'move', direction: 'DOWN' }, rng);
    const s3 = advanceGame(s2, { type: 'move', direction: 'RIGHT' }, rng);
    expect(s3.history).toHaveLength(2);

    const u1 = advanceGame(s3, { type: 'undo' }, rng);
    expect(rowsOf(u1)).toEqual(rowsOf(s2));
    expect(u1).toMatchObject({ score: s2.score, moveCount: s2.moveCount });
    const u2 = advanceGame(u1, { type: 'undo' }, rng);
    expect(rowsOf(u2)).toEqual(rowsOf(s1));
    expect(u2.history).toHaveLength(0);
    expect(canUndo(u2)).toBe(false);
    expect(advanceGame(u2, { type: 'undo' }, rng)).toBe(u2);
    expect(u2.tiles.every((t) => !t.isNew && !t.mergedFrom && !t.isDying)).toBe(true);
  });

  it('is unavailable while paused', () => {
    const s1 = advanceGame(fromRows([[2, 2, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]), { type: 'move', direction: 'LEFT' }, zeroRng);
    const paused = advanceGame(s1, { type: 'pause' }, zeroRng);
    expect(canUndo(paused)).toBe(false);
    expect(advanceGame(paused, { type: 'undo' }, zeroRng)).toBe(paused);
  });
});

describe('is2048State', () => {
  it('accepts real states, including animation flags and undo history', () => {
    const rng = seeded(5);
    let s = createInitialState(rng);
    expect(is2048State(s)).toBe(true);
    for (const d of ['LEFT', 'UP', 'RIGHT', 'DOWN'] as Direction[]) s = advanceGame(s, { type: 'move', direction: d }, rng);
    expect(is2048State(s)).toBe(true);
    expect(is2048State(JSON.parse(JSON.stringify(s)))).toBe(true);
    expect(is2048State({ ...s, tiles: settledTiles(s.tiles) })).toBe(true);
  });

  it('rejects garbage', () => {
    const s = createInitialState(seeded(5));
    const [a, b] = s.tiles as [Tile, Tile];
    expect(is2048State(null)).toBe(false);
    expect(is2048State({ ...s, status: 'idle' })).toBe(false);
    expect(is2048State({ ...s, size: 5 })).toBe(false);
    expect(is2048State({ ...s, score: -1 })).toBe(false);
    expect(is2048State({ ...s, tiles: [] })).toBe(false);
    expect(is2048State({ ...s, tiles: [a, { ...b, value: 3 }] })).toBe(false);
    expect(is2048State({ ...s, tiles: [a, { ...b, row: a.row, col: a.col }] })).toBe(false);
    expect(is2048State({ ...s, tiles: [a, { ...b, row: 4 }] })).toBe(false);
    expect(is2048State({ ...s, tiles: [a, { ...b, id: a.id }] })).toBe(false);
    expect(is2048State({ ...s, nextTileId: 1 })).toBe(false);
    expect(is2048State({ ...s, history: 'x' })).toBe(false);
    const snap: Partial<GameState> = { ...s, moveCount: 0 };
    delete snap.history;
    expect(is2048State({ ...s, moveCount: 1, history: [snap] })).toBe(true);
    expect(is2048State({ ...s, moveCount: 3, history: [snap, snap, snap] })).toBe(false);
    expect(is2048State({ ...s, moveCount: 0, history: [snap] })).toBe(false);
    expect(is2048State({ ...s, moveCount: 1, history: [{ ...s, moveCount: 0 }] })).toBe(false);
  });
});

describe('autopilot', () => {
  it('returns null when no move is possible', () => {
    expect(chooseMove(fromRows([[2, 4, 2, 4], [4, 2, 4, 2], [2, 4, 2, 4], [4, 2, 4, 2]]))).toBeNull();
  });

  it('plays a seeded game to at least a 128 tile', () => {
    const rng = seeded(42);
    let s = createInitialState(rng);
    for (let i = 0; i < 2000 && s.status !== 'gameOver' && maxTile(s) < 128; i++) {
      if (s.status === 'won') {
        s = advanceGame(s, { type: 'continueAfterWin' }, rng);
        continue;
      }
      const d = chooseMove(s);
      if (!d) break;
      s = advanceGame(advanceGame(s, { type: 'commitAnimation' }, rng), { type: 'move', direction: d }, rng);
    }
    expect(maxTile(s)).toBeGreaterThanOrEqual(128);
  });
});
