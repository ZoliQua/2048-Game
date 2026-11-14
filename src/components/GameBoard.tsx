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
  /** Dental mode tile art. Presentation only. */
  dental?: boolean;
  /** Extra class names for the board element (e.g. the kit's `arc-board-touch`). */
  className?: string;
};

const CELLS = Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => i);

export const GameBoard = forwardRef<HTMLDivElement, GameBoardProps>(function GameBoard(
  { tiles, variant = 'full', label = '2048 board', dental = false, className = '' },
  ref,
) {
  const mini = variant === 'mini';
  return (
    <div
      ref={ref}
      className={`${styles.board} ${mini ? styles.mini : ''} ${className}`.trim()}
      role={mini ? undefined : 'group'}
      aria-label={mini ? undefined : label}
      aria-hidden={mini ? true : undefined}
      data-dental={dental}
    >
      <div className={styles.grid}>
        {CELLS.map((i) => (
          <div key={i} className={styles.cell} />
        ))}
      </div>
      <div className={styles.tiles}>
        {tiles.map((tile) => (
          <Tile key={tile.id} tile={tile} dental={dental} />
        ))}
      </div>
    </div>
  );
});
