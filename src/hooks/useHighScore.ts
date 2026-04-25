import { useCallback, useEffect, useState } from 'react';
import { HIGH_SCORE_KEY } from '../logic/constants';

function readStoredBest(): number {
  if (typeof window === 'undefined') return 0;
  const raw = window.localStorage.getItem(HIGH_SCORE_KEY);
  if (raw === null) return 0;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export function useHighScore() {
  const [best, setBest] = useState<number>(() => readStoredBest());

  useEffect(() => {
    setBest(readStoredBest());
  }, []);

  const recordScore = useCallback((score: number) => {
    setBest((current) => {
      if (score <= current) return current;
      try {
        window.localStorage.setItem(HIGH_SCORE_KEY, String(score));
      } catch {
        // ignore quota / privacy-mode failures
      }
      return score;
    });
  }, []);

  return { best, recordScore } as const;
}
