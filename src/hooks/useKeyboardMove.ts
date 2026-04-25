import { useEffect, useRef } from 'react';
import type { Direction, GameAction, GameStatus } from '../logic/types';

const DIRECTION_BY_KEY: Record<string, Direction> = {
  ArrowUp: 'UP',
  ArrowDown: 'DOWN',
  ArrowLeft: 'LEFT',
  ArrowRight: 'RIGHT',
  w: 'UP',
  W: 'UP',
  s: 'DOWN',
  S: 'DOWN',
  a: 'LEFT',
  A: 'LEFT',
  d: 'RIGHT',
  D: 'RIGHT',
};

const ARROW_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

export function useKeyboardMove(
  status: GameStatus,
  dispatch: (action: GameAction) => void,
) {
  const statusRef = useRef(status);
  statusRef.current = status;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.repeat) return;
      const direction = DIRECTION_BY_KEY[event.key];
      if (direction) {
        if (ARROW_KEYS.has(event.key)) event.preventDefault();
        dispatch({ type: 'move', direction });
        return;
      }
      switch (event.key) {
        case ' ':
        case 'p':
        case 'P': {
          event.preventDefault();
          if (statusRef.current === 'running') dispatch({ type: 'pause' });
          else if (statusRef.current === 'paused') dispatch({ type: 'resume' });
          break;
        }
        case 'c':
        case 'C': {
          dispatch({ type: 'continueAfterWin' });
          break;
        }
        case 'r':
        case 'R': {
          dispatch({ type: 'restart' });
          break;
        }
        default:
          break;
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [dispatch]);
}
