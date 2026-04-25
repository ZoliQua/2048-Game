import type { GameStatus } from '../logic/types';

type OverlayProps = {
  status: GameStatus;
  score: number;
  onContinue: () => void;
  onRestart: () => void;
  onResume: () => void;
};

export function Overlay({ status, score, onContinue, onRestart, onResume }: OverlayProps) {
  if (status === 'idle' || status === 'running') return null;

  return (
    <div className="overlay" role="dialog" aria-live="polite" data-status={status}>
      <div className="overlay__panel">
        {status === 'paused' && (
          <>
            <h2 className="overlay__title">Paused</h2>
            <p className="overlay__body">Press Space or P to resume.</p>
            <button type="button" className="overlay__button" onClick={onResume}>
              Resume
            </button>
          </>
        )}
        {status === 'won' && (
          <>
            <h2 className="overlay__title">You win!</h2>
            <p className="overlay__body">Score: {score}. Keep going for higher tiles?</p>
            <div className="overlay__actions">
              <button type="button" className="overlay__button overlay__button--primary" onClick={onContinue}>
                Continue
              </button>
              <button type="button" className="overlay__button" onClick={onRestart}>
                New game
              </button>
            </div>
          </>
        )}
        {status === 'gameOver' && (
          <>
            <h2 className="overlay__title">Game over</h2>
            <p className="overlay__body">Final score: {score}.</p>
            <button type="button" className="overlay__button overlay__button--primary" onClick={onRestart}>
              Try again
            </button>
          </>
        )}
      </div>
    </div>
  );
}
