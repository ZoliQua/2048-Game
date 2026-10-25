import { useEffect, useRef } from 'react';
import { ARCADE_KEYS, isKey, shouldIgnoreKey } from '../arcade';
import type { Direction } from '../logic/types';

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

export type KeyboardMoveHandlers = {
  onMove: (direction: Direction) => void;
  /** Space / Enter: pause/resume, continue after a win, new game when over. */
  onPrimary: () => void;
  /** P / Esc. */
  onTogglePause: () => void;
  /** R. */
  onRestart: () => void;
  /** C — keep playing after reaching 2048. */
  onContinue: () => void;
  /** U — undo the last move. */
  onUndo: () => void;
};

/**
 * One window listener for the lifetime of the component; handlers are read
 * from a ref so re-renders never re-subscribe. Typing in form fields and
 * modifier shortcuts (Cmd+R, Ctrl+W, …) are left to the browser.
 */
export function useKeyboardMove(handlers: KeyboardMoveHandlers): void {
  const ref = useRef(handlers);
  ref.current = handlers;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (shouldIgnoreKey(event)) return;
      const h = ref.current;

      const direction = DIRECTION_BY_KEY[event.key];
      if (direction) {
        if (ARROW_KEYS.has(event.key)) event.preventDefault();
        if (!event.repeat) h.onMove(direction);
        return;
      }
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        if (!event.repeat) h.onPrimary();
        return;
      }
      if (isKey(event, ARCADE_KEYS.pause)) {
        event.preventDefault();
        h.onTogglePause();
        return;
      }
      if (isKey(event, ARCADE_KEYS.restart)) {
        h.onRestart();
        return;
      }
      if (event.key === 'c' || event.key === 'C') {
        h.onContinue();
        return;
      }
      if (event.key === 'u' || event.key === 'U') {
        h.onUndo();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
