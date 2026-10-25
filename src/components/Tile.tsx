import { memo, type CSSProperties } from 'react';
import { ANIMATION_MS, GRID_SIZE, colorForValue } from '../logic/constants';
import type { Tile as TileType } from '../logic/types';
import styles from './GameBoard.module.css';

type TileProps = {
  tile: TileType;
};

const GAPS_BETWEEN = GRID_SIZE - 1;

function TileImpl({ tile }: TileProps) {
  const { bg, fg } = colorForValue(tile.value);

  const classes = [styles.tile];
  if (tile.isNew) classes.push(styles.spawn);
  if (tile.mergedFrom) classes.push(styles.merge);
  if (tile.isDying) classes.push(styles.dying);

  const valueLength = String(tile.value).length;
  if (valueLength >= 5) classes.push(styles.xxs);
  else if (valueLength === 4) classes.push(styles.xs);
  else if (valueLength === 3) classes.push(styles.sm);

  // Exact cell size in the parent (.tiles) reference frame.
  const size = `calc((100% - ${GAPS_BETWEEN} * var(--gap)) / ${GRID_SIZE})`;
  // One step = one tile width (100% in transform's tile-relative frame) + one gap.
  const stepX = `calc(${tile.col} * (100% + var(--gap)))`;
  const stepY = `calc(${tile.row} * (100% + var(--gap)))`;

  const style = {
    transform: `translate(${stepX}, ${stepY})`,
    color: fg,
    width: size,
    height: size,
    transitionDuration: `${ANIMATION_MS}ms`,
    zIndex: tile.isDying ? 1 : tile.mergedFrom ? 3 : 2,
    '--tile-bg': bg,
  } as CSSProperties;

  return (
    <div className={classes.join(' ')} style={style}>
      <span>{tile.value}</span>
    </div>
  );
}

export const Tile = memo(TileImpl);
