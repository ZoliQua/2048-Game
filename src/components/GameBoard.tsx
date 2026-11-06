import { forwardRef } from 'react';
import { GRID_SIZE } from '../logic/constants';
import type { Tile as TileType } from '../logic/types';
import { Tile } from './Tile';
import styles from './GameBoard.module.css';

type GameBoardProps = {
  tiles: TileType[];
  /** `mini` renders the compact landing-page variant, hidden from assistive tech. */
  variant?: 'full' | 'mini';
  /** Accessible name of the full board. */
  label?: string;
};

const CELLS = Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => i);

export const GameBoard = forwardRef<HTMLDivElement, GameBoardProps>(function GameBoard(
  { tiles, variant = 'full', label = '2048 board' },
  ref,
) {
  const mini = variant === 'mini';
  return (
    <div
      ref={ref}
      className={`${styles.board} ${mini ? styles.mini : ''}`}
      role={mini ? undefined : 'group'}
      aria-label={mini ? undefined : label}
      aria-hidden={mini ? true : undefined}
    >
      <div className={styles.grid}>
        {CELLS.map((i) => (
          <div key={i} className={styles.cell} />
        ))}
      </div>
      <div className={styles.tiles}>
        {tiles.map((tile) => (
          <Tile key={tile.id} tile={tile} />
        ))}
      </div>
    </div>
  );
});
