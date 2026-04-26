import { useEffect, useRef } from 'react';
import type { Direction, GameAction } from '../logic/types';

const SWIPE_THRESHOLD_PX = 30;

/**
 * Attach swipe-to-move listeners to a board element. Native (non-passive)
 * touch listeners are required so `preventDefault` actually suppresses the
 * page scroll mid-swipe — React's synthetic onTouchMove is passive by default.
 */
export function useSwipeInput(
  enabled: boolean,
  dispatch: (action: GameAction) => void,
) {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const dispatchRef = useRef(dispatch);
  dispatchRef.current = dispatch;

  useEffect(() => {
    const node = boardRef.current;
    if (!node || !enabled) return;

    let originX = 0;
    let originY = 0;
    let active = false;
    let preventing = false;

    const onStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      originX = touch.clientX;
      originY = touch.clientY;
      active = true;
      preventing = false;
    };

    const onMove = (event: TouchEvent) => {
      if (!active) return;
      const touch = event.touches[0];
      if (!touch) return;
      const dx = touch.clientX - originX;
      const dy = touch.clientY - originY;
      if (!preventing && (Math.abs(dx) > SWIPE_THRESHOLD_PX / 2 || Math.abs(dy) > SWIPE_THRESHOLD_PX / 2)) {
        preventing = true;
      }
      if (preventing) event.preventDefault();
    };

    const onEnd = (event: TouchEvent) => {
      if (!active) return;
      active = false;
      const touch = event.changedTouches[0];
      if (!touch) return;
      const dx = touch.clientX - originX;
      const dy = touch.clientY - originY;
      const ax = Math.abs(dx);
      const ay = Math.abs(dy);
      if (ax < SWIPE_THRESHOLD_PX && ay < SWIPE_THRESHOLD_PX) return;
      let direction: Direction;
      if (ax > ay) direction = dx > 0 ? 'RIGHT' : 'LEFT';
      else direction = dy > 0 ? 'DOWN' : 'UP';
      dispatchRef.current({ type: 'move', direction });
    };

    node.addEventListener('touchstart', onStart, { passive: true });
    node.addEventListener('touchmove', onMove, { passive: false });
    node.addEventListener('touchend', onEnd);
    node.addEventListener('touchcancel', onEnd);

    return () => {
      node.removeEventListener('touchstart', onStart);
      node.removeEventListener('touchmove', onMove);
      node.removeEventListener('touchend', onEnd);
      node.removeEventListener('touchcancel', onEnd);
    };
  }, [enabled]);

  return boardRef;
}
