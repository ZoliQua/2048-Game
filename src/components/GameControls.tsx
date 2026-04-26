import type { GameStatus } from '../logic/types';

type GameControlsProps = {
  status: GameStatus;
  canUndo: boolean;
  onRestart: () => void;
  onPauseToggle: () => void;
  onContinue: () => void;
  onUndo: () => void;
};

export function GameControls({
  status,
  canUndo,
  onRestart,
  onPauseToggle,
  onContinue,
  onUndo,
}: GameControlsProps) {
  const showContinue = status === 'won';
  const showPauseToggle = status === 'running' || status === 'paused';
  const pauseLabel = status === 'paused' ? 'Resume' : 'Pause';

  return (
    <div className="controls">
      <button type="button" className="controls__button" onClick={onRestart}>
        New game
      </button>
      <button
        type="button"
        className="controls__button"
        onClick={onUndo}
        disabled={!canUndo}
        title={canUndo ? 'Undo last move' : 'Nothing to undo'}
      >
        Undo
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
