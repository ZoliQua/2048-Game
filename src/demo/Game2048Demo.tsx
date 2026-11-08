import { useEffect, useState } from 'react';
import { useDental, type ArcadeDemoProps } from '../arcade';
import { GameBoard } from '../components/GameBoard';
import { chooseMove } from '../logic/autopilot';
import { advanceGame, createInitialState } from '../logic/game';
import type { GameState } from '../logic/types';

const DEMO_MOVE_MS = 320;
const DEMO_RESTART_MS = 1500;

const rng = () => Math.random();
const freshDemo = (): GameState => createInitialState(rng);

/** One autopilot step on the real engine: settle last move's animation, then slide. */
function step(prev: GameState): GameState {
  const settled = advanceGame(prev, { type: 'commitAnimation' }, rng);
  if (settled.status !== 'running') return settled;
  const direction = chooseMove(settled);
  if (!direction) return { ...settled, status: 'gameOver' };
  return advanceGame(settled, { type: 'move', direction }, rng);
}

/**
 * Attract mode for the portal landing page: the real 2048 engine played by an
 * expectimax-lite autopilot. Restarts after game over (or after showing a
 * 2048 tile). No keyboard, no stats, no saves.
 */
export function Game2048Demo({ active = true }: ArcadeDemoProps) {
  const [state, setState] = useState(freshDemo);
  const [dental] = useDental();
  const finished = state.status !== 'running';

  useEffect(() => {
    if (!active) return;
    const id = finished
      ? window.setTimeout(() => setState(freshDemo()), DEMO_RESTART_MS)
      : window.setTimeout(() => setState(step), DEMO_MOVE_MS);
    return () => window.clearTimeout(id);
  }, [active, finished, state]);

  return (
    <div className="arc-demo">
      <GameBoard tiles={state.tiles} variant="mini" dental={dental} />
    </div>
  );
}

export default Game2048Demo;
