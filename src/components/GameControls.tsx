import type { GameStatus } from '../logic/types';

type GameControlsProps = {
  status: GameStatus;
  onRestart: () => void;
  onPauseToggle: () => void;
  onContinue: () => void;
};

export function GameControls({ status, onRestart, onPauseToggle, onContinue }: GameControlsProps) {
  const showContinue = status === 'won';
  const showPauseToggle = status === 'running' || status === 'paused';
  const pauseLabel = status === 'paused' ? 'Resume' : 'Pause';

  return (
    <div className="controls">
      <button type="button" className="controls__button" onClick={onRestart}>
        New game
      </button>
      {showPauseToggle && (
        <button type="button" className="controls__button" onClick={onPauseToggle}>
          {pauseLabel}
        </button>
      )}
      {showContinue && (
        <button type="button" className="controls__button controls__button--primary" onClick={onContinue}>
          Continue
        </button>
      )}
    </div>
  );
}
