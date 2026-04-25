import type { GameStatus } from '../logic/types';

type ScoreBoardProps = {
  score: number;
  best: number;
  moves: number;
  elapsedSeconds: number;
  status: GameStatus;
};

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const STATUS_LABEL: Record<GameStatus, string> = {
  idle: 'Ready',
  running: 'Playing',
  paused: 'Paused',
  won: 'You win!',
  gameOver: 'Game over',
};

export function ScoreBoard({ score, best, moves, elapsedSeconds, status }: ScoreBoardProps) {
  return (
    <section className="scoreboard" aria-label="Scoreboard">
      <div className="scoreboard__cell">
        <span className="scoreboard__label">Score</span>
        <span className="scoreboard__value">{score}</span>
      </div>
      <div className="scoreboard__cell">
        <span className="scoreboard__label">Best</span>
        <span className="scoreboard__value">{best}</span>
      </div>
      <div className="scoreboard__cell">
        <span className="scoreboard__label">Moves</span>
        <span className="scoreboard__value">{moves}</span>
      </div>
      <div className="scoreboard__cell">
        <span className="scoreboard__label">Time</span>
        <span className="scoreboard__value">{formatTime(elapsedSeconds)}</span>
      </div>
      <div className="scoreboard__cell scoreboard__cell--status" data-status={status}>
        <span className="scoreboard__label">Status</span>
        <span className="scoreboard__value">{STATUS_LABEL[status]}</span>
      </div>
    </section>
  );
}
