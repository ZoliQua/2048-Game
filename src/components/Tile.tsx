import { memo } from 'react';
import { ANIMATION_MS, GRID_SIZE, colorForValue } from '../logic/constants';
import type { Tile as TileType } from '../logic/types';

type TileProps = {
  tile: TileType;
};

function TileImpl({ tile }: TileProps) {
  const { bg, fg } = colorForValue(tile.value);
  const cellPercent = 100 / GRID_SIZE;

  const classes = ['tile'];
  if (tile.isNew) classes.push('tile--spawn');
  if (tile.mergedFrom) classes.push('tile--merge');
  if (tile.isDying) classes.push('tile--dying');

  const valueLength = String(tile.value).length;
  if (valueLength >= 4) classes.push('tile--xs');
  else if (valueLength === 3) classes.push('tile--sm');

  const style: React.CSSProperties & { ['--tile-bg']?: string } = {
    transform: `translate(${tile.col * cellPercent}%, ${tile.row * cellPercent}%)`,
    color: fg,
    width: `${cellPercent}%`,
    height: `${cellPercent}%`,
    transitionDuration: `${ANIMATION_MS}ms`,
    zIndex: tile.isDying ? 1 : tile.mergedFrom ? 3 : 2,
    ['--tile-bg']: bg,
  };

  return (
    <div className={classes.join(' ')} style={style}>
      <span>{tile.value}</span>
    </div>
  );
}

export const Tile = memo(TileImpl);
