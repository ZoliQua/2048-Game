import { memo, type CSSProperties, type ReactNode } from 'react';
import { GoldCrown, Molar, SmileTooth, Tooth } from '../arcade';
import { ANIMATION_MS, GRID_SIZE, colorForValue } from '../logic/constants';
import type { Tile as TileType } from '../logic/types';
import styles from './GameBoard.module.css';

type TileProps = {
  tile: TileType;
  /** Dental mode: tooth art above the number, growing with the value. Presentation only. */
  dental?: boolean;
};

/** Dental tile art tiers; each tier has its own silhouette, so value never hangs on colour. */
type DentalArt = 'milk' | 'molar' | 'smile' | 'crown';

function dentalArtFor(value: number): DentalArt {
  if (value >= 2048) return 'crown';
  if (value >= 128) return 'smile';
  if (value >= 8) return 'molar';
  return 'milk';
}

const ART_ICON: Record<DentalArt, (className: string) => ReactNode> = {
  milk: (className) => <Tooth size="100%" className={className} />,
  molar: (className) => <Molar size="100%" className={className} />,
  smile: (className) => <SmileTooth size="100%" className={className} />,
  crown: (className) => <GoldCrown size="100%" className={className} />,
};

const GAPS_BETWEEN = GRID_SIZE - 1;

function TileImpl({ tile, dental = false }: TileProps) {
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

  if (dental) {
    const art = dentalArtFor(tile.value);
    classes.push(styles.dentalTile);
    return (
      <div className={classes.join(' ')} style={style}>
        <span>
          <i className={`${styles.art} ${styles[art]}`} data-testid={`game2048-tile-${art}`}>
            {ART_ICON[art](styles.artIcon)}
          </i>
          <b className={styles.dentalValue}>{tile.value}</b>
        </span>
      </div>
    );
  }

  return (
    <div className={classes.join(' ')} style={style}>
      <span>{tile.value}</span>
    </div>
  );
}

export const Tile = memo(TileImpl);
