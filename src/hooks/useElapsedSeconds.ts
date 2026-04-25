import { useEffect, useRef, useState } from 'react';

/**
 * Real-time elapsed-seconds counter that ticks while `running` is true and
 * preserves accumulated time across pause/resume cycles. Increments to
 * `resetKey` zero the counter (use it to mark a fresh game).
 */
export function useElapsedSeconds(running: boolean, resetKey: number): number {
  const [seconds, setSeconds] = useState(0);
  const accumulatedRef = useRef(0);

  useEffect(() => {
    accumulatedRef.current = 0;
    setSeconds(0);
  }, [resetKey]);

  useEffect(() => {
    if (!running) return;
    const startedAt = Date.now();
    const baseline = accumulatedRef.current;
    const tick = () => {
      const total = baseline + Math.floor((Date.now() - startedAt) / 1000);
      accumulatedRef.current = total;
      setSeconds(total);
    };
    const id = window.setInterval(tick, 250);
    return () => {
      tick();
      window.clearInterval(id);
    };
  }, [running]);

  return seconds;
}
