export const GRID_SIZE = 4 as const;
export const TARGET_VALUE = 2048 as const;

/** Merge examples shown in the rules: a pair of N tiles scores 2N (the merged tile's value). */
export const SCORING_EXAMPLES = [2, 8, 1024] as const;

export const SPAWN_FOUR_PROBABILITY = 0.1 as const;

export const ANIMATION_MS = 120 as const;

export type TileColor = { bg: string; fg: string };

export const TILE_COLORS: Record<number, TileColor> = {
  2: { bg: '#eee4da', fg: '#776e65' },
  4: { bg: '#ede0c8', fg: '#776e65' },
  8: { bg: '#f2b179', fg: '#f9f6f2' },
  16: { bg: '#f59563', fg: '#f9f6f2' },
  32: { bg: '#f67c5f', fg: '#f9f6f2' },
  64: { bg: '#f65e3b', fg: '#f9f6f2' },
  128: { bg: '#edcf72', fg: '#f9f6f2' },
  256: { bg: '#edcc61', fg: '#f9f6f2' },
  512: { bg: '#edc850', fg: '#f9f6f2' },
  1024: { bg: '#edc53f', fg: '#f9f6f2' },
  2048: { bg: '#edc22e', fg: '#f9f6f2' },
};

export const HIGH_TILE_COLOR: TileColor = { bg: '#3c3a32', fg: '#f9f6f2' };

export function colorForValue(value: number): TileColor {
  return TILE_COLORS[value] ?? HIGH_TILE_COLOR;
}
