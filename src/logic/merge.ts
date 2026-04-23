import { GRID_SIZE } from './constants';
import type { Tile } from './types';

export type LineMergeResult = {
  output: Array<Tile | null>;
  scoreDelta: number;
  changed: boolean;
  /**
   * For each output index that was produced by a merge, the two source tile ids
   * that combined into it. Indexed by destination column (0..GRID_SIZE-1).
   */
  merges: Array<[number, number] | null>;
};

/**
 * Slide a 1-D line of length GRID_SIZE to the LEFT, merging adjacent equal
 * tiles once each. Returns the new line plus per-cell merge metadata.
 *
 * The input is the source-of-truth: each non-null cell carries its tile id and
 * value. The output preserves ids for tiles that slid without merging; merged
 * cells emit `null` here and `merges[i]` carries the two source ids — the
 * caller mints a fresh id and value for the merged tile.
 */
export function slideAndMergeLine(line: ReadonlyArray<Tile | null>): LineMergeResult {
  if (line.length !== GRID_SIZE) {
    throw new Error(`slideAndMergeLine expects length ${GRID_SIZE}`);
  }
  const compact: Tile[] = line.filter((c): c is Tile => c !== null);

  const output: Array<Tile | null> = new Array(GRID_SIZE).fill(null);
  const merges: Array<[number, number] | null> = new Array(GRID_SIZE).fill(null);
  let scoreDelta = 0;
  let dst = 0;
  let i = 0;
  while (i < compact.length) {
    const a = compact[i]!;
    const b = compact[i + 1];
    if (b && b.value === a.value) {
      const mergedValue = a.value * 2;
      output[dst] = null;
      merges[dst] = [a.id, b.id];
      scoreDelta += mergedValue;
      i += 2;
    } else {
      output[dst] = a;
      i += 1;
    }
    dst += 1;
  }

  let changed = false;
  for (let k = 0; k < GRID_SIZE; k++) {
    const before = line[k];
    const after = output[k];
    const mergedHere = merges[k] !== null;
    if (mergedHere) {
      changed = true;
      break;
    }
    if ((before?.id ?? null) !== (after?.id ?? null)) {
      changed = true;
      break;
    }
  }

  return { output, scoreDelta, changed, merges };
}
