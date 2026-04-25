import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { GameBoard } from './components/GameBoard';
import { GameControls } from './components/GameControls';
import { Overlay } from './components/Overlay';
import { ScoreBoard } from './components/ScoreBoard';
import { useElapsedSeconds } from './hooks/useElapsedSeconds';
import { useHighScore } from './hooks/useHighScore';
import { useKeyboardMove } from './hooks/useKeyboardMove';
import { ANIMATION_MS } from './logic/constants';
import { advanceGame, createInitialState } from './logic/game';
import type { GameAction, GameState } from './logic/types';

const defaultRng: () => number = Math.random;

function init(best: number): GameState {
  return createInitialState(defaultRng, { best });
}

function reducer(state: GameState, action: GameAction): GameState {
  return advanceGame(state, action, defaultRng);
}

export default function App() {
  const { best, recordScore } = useHighScore();
  const [state, dispatch] = useReducer(reducer, best, init);
  const [sessionId, setSessionId] = useState(0);

  useEffect(() => {
    recordScore(state.score);
  }, [state.score, recordScore]);

  const hasDying = useMemo(() => state.tiles.some((t) => t.isDying || t.isNew || t.mergedFrom), [state.tiles]);

  useEffect(() => {
    if (!hasDying) return;
    const id = window.setTimeout(() => {
      dispatch({ type: 'commitAnimation' });
    }, ANIMATION_MS + 40);
    return () => window.clearTimeout(id);
  }, [hasDying, state.moveCount]);

  useKeyboardMove(state.status, dispatch);

  const onRestart = useCallback(() => {
    dispatch({ type: 'restart' });
    setSessionId((s) => s + 1);
  }, []);
  const onContinue = useCallback(() => dispatch({ type: 'continueAfterWin' }), []);
  const onResume = useCallback(() => dispatch({ type: 'resume' }), []);
  const onPauseToggle = useCallback(() => {
    dispatch(state.status === 'paused' ? { type: 'resume' } : { type: 'pause' });
  }, [state.status]);

  const elapsed = useElapsedSeconds(state.status === 'running', sessionId);

  const displayedBest = Math.max(best, state.best);

  return (
    <main className="app">
      <header className="app__header">
        <h1 className="app__title">2048</h1>
        <p className="app__subtitle">Use arrows or WASD. Space pauses, R restarts, C continues after a win.</p>
      </header>

      <ScoreBoard
        score={state.score}
        best={displayedBest}
        moves={state.moveCount}
        elapsedSeconds={elapsed}
        status={state.status}
      />

      <div className="app__board-wrap">
        <GameBoard tiles={state.tiles} />
        <Overlay
          status={state.status}
          score={state.score}
          onContinue={onContinue}
          onRestart={onRestart}
          onResume={onResume}
        />
      </div>

      <GameControls
        status={state.status}
        onRestart={onRestart}
        onPauseToggle={onPauseToggle}
        onContinue={onContinue}
      />
    </main>
  );
}
