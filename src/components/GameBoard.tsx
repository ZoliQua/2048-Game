import { forwardRef } from 'react';
import { GRID_SIZE } from '../logic/constants';
import type { Tile as TileType } from '../logic/types';
import { Tile } from './Tile';

type GameBoardProps = {
  tiles: TileType[];
};

export const GameBoard = forwardRef<HTMLDivElement, GameBoardProps>(function GameBoard(
  { tiles },
  ref,
) {
  const cells: React.ReactNode[] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      cells.push(<div key={`${r}-${c}`} className="board__cell" />);
    }
  }

  return (
    <div
      ref={ref}
      className="board"
      style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`, gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)` }}
    >
      <div className="board__grid">{cells}</div>
      <div className="board__tiles">
        {tiles.map((tile) => (
          <Tile key={tile.id} tile={tile} />
        ))}
      </div>
    </div>
  );
});
