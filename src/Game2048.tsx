import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import {
  clearSession,
  formatClock,
  GameOverlay,
  KeyHelp,
  SaveBadge,
  StatPanel,
  useArcadeRun,
  useRestoredSession,
  useRunTimer,
  useSessionAutosave,
  type ArcadeGameProps,
  type ArcadeStatus,
  type OverlayAction,
} from './arcade';
import { GameBoard } from './components/GameBoard';
import { useKeyboardMove } from './hooks/useKeyboardMove';
import { useSwipeInput } from './hooks/useSwipeInput';
import { ANIMATION_MS } from './logic/constants';
import { advanceGame, canUndo, createInitialState, reachedTarget, settledTiles } from './logic/game';
import { is2048State } from './logic/persist';
import type { Direction, GameAction, GameState, GameStatus } from './logic/types';
import { maxTile } from './logic/win';
import styles from './App.module.css';

/** Bump when GameState changes shape; older saves are then discarded. */
const SESSION_SCHEMA = 1;

const rng = () => Math.random();

const KEYS: [string, string][] = [
  ['← ↑ → ↓', 'Slide (or WASD, or swipe)'],
  ['U', 'Undo (last 2 moves)'],
  ['Space', 'Pause / resume'],
  ['P Esc', 'Pause / resume'],
  ['C', 'Keep going after 2048'],
  ['R', 'New game'],
];

const ARCADE_STATUS: Record<GameStatus, ArcadeStatus> = {
  running: 'running',
  paused: 'paused',
  // The win/continue choice blocks input and stops the clock like a pause.
  won: 'paused',
  gameOver: 'gameOver',
};

/** Only unfinished runs may be resumed. */
function isResumable(v: unknown): v is GameState {
  return is2048State(v) && v.status !== 'gameOver';
}

/** A restored run always comes back paused; a pending win choice counts as "continue". */
function restoreState(data: GameState): GameState {
  return {
    ...data,
    tiles: settledTiles(data.tiles),
    status: 'paused',
    continueAfterWin: data.continueAfterWin || data.status === 'won',
  };
}

export function Game2048(props: ArcadeGameProps = {}) {
  const { embedded = false } = props;
  const restored = useRestoredSession<GameState>('2048', SESSION_SCHEMA, isResumable);
  const [state, setState] = useState<GameState>(() =>
    restored ? restoreState(restored.data) : createInitialState(rng),
  );
  const [runId, setRunId] = useState(0);
  const [welcomeBack, setWelcomeBack] = useState(restored !== null);

  const dispatch = useCallback((action: GameAction) => {
    setState((prev) => advanceGame(prev, action, rng));
  }, []);

  // The clock starts with the first move of a run (a fresh board is already "running").
  const seconds = useRunTimer(
    state.status === 'running' && state.moveCount > 0,
    runId,
    runId === 0 ? (restored?.seconds ?? 0) : 0,
  );

  const status = ARCADE_STATUS[state.status];
  const stats = useArcadeRun({
    gameId: '2048',
    status,
    score: state.score,
    seconds,
    runKey: runId,
    outcome: () => (reachedTarget(state) ? 'win' : 'over'),
    props,
  });

  const inProgress = state.status !== 'gameOver' && state.moveCount > 0;
  const saveData = useMemo(() => ({ ...state, tiles: settledTiles(state.tiles) }), [state]);
  const savedAt = useSessionAutosave({
    gameId: '2048',
    schema: SESSION_SCHEMA,
    enabled: inProgress,
    discard: state.status === 'gameOver' || state.moveCount === 0,
    data: saveData,
    seconds,
    score: state.score,
  });

  // Drop dying tiles and one-shot animation flags once the CSS transition is done.
  const animating = useMemo(
    () => state.tiles.some((t) => t.isDying || t.isNew || t.mergedFrom),
    [state.tiles],
  );
  useEffect(() => {
    if (!animating) return;
    const id = window.setTimeout(() => dispatch({ type: 'commitAnimation' }), ANIMATION_MS + 40);
    return () => window.clearTimeout(id);
  }, [animating, state.moveCount, dispatch]);

  const move = useCallback((direction: Direction) => dispatch({ type: 'move', direction }), [dispatch]);

  const startNewRun = useCallback(() => {
    setWelcomeBack(false);
    setRunId((id) => id + 1);
    dispatch({ type: 'restart' });
  }, [dispatch]);

  const togglePause = useCallback(() => {
    setWelcomeBack(false);
    setState((prev) => {
      if (prev.status === 'running') return { ...prev, status: 'paused' };
      if (prev.status === 'paused') return { ...prev, status: 'running' };
      return prev;
    });
  }, []);

  const continueAfterWin = useCallback(() => dispatch({ type: 'continueAfterWin' }), [dispatch]);
  const undo = useCallback(() => dispatch({ type: 'undo' }), [dispatch]);

  const primary = useCallback(() => {
    if (state.status === 'gameOver') startNewRun();
    else if (state.status === 'won') continueAfterWin();
    else togglePause();
  }, [state.status, startNewRun, continueAfterWin, togglePause]);

  const discardSave = useCallback(() => {
    clearSession('2048');
    setWelcomeBack(false);
    setRunId((id) => id + 1);
    setState(createInitialState(rng));
  }, []);

  useKeyboardMove({
    onMove: move,
    onPrimary: primary,
    onTogglePause: togglePause,
    onRestart: startNewRun,
    onContinue: continueAfterWin,
    onUndo: undo,
  });
  const boardRef = useSwipeInput(state.status === 'running', move);

  const max = maxTile(state);
  const best = Math.max(stats.best, state.score);
  const newBest = state.score > 0 && state.score > stats.bestBeforeRun;
  const undoable = canUndo(state);

  let overlay: { title: string; message: string; actions: OverlayAction[] } | null = null;
  if (state.status === 'paused') {
    overlay = welcomeBack
      ? {
          title: 'Welcome back',
          message: `Your saved run was restored — score ${state.score}, max tile ${max}, ${formatClock(seconds)} played.`,
          actions: [
            { label: 'Continue', onClick: togglePause, primary: true, kbd: 'P' },
            { label: 'New game', onClick: startNewRun, kbd: 'R' },
          ],
        }
      : {
          title: 'Paused',
          message: 'Your run is autosaved — you can close the tab and continue later.',
          actions: [
            { label: 'Resume', onClick: togglePause, primary: true, kbd: 'P' },
            { label: 'New game', onClick: startNewRun, kbd: 'R' },
          ],
        };
  } else if (state.status === 'won') {
    overlay = {
      title: 'You win!',
      message: `You made 2048 with ${state.score} points. Keep going for a higher tile?`,
      actions: [
        { label: 'Keep going', onClick: continueAfterWin, primary: true, kbd: 'C' },
        { label: 'New game', onClick: startNewRun, kbd: 'R' },
      ],
    };
  } else if (state.status === 'gameOver') {
    overlay = {
      title: reachedTarget(state) ? 'No moves left — 2048 reached!' : 'Game over',
      message: `Score ${state.score} · Best ${best}${newBest ? ' — new best!' : ''} · Max tile ${max}`,
      actions: [{ label: 'Play again', onClick: startNewRun, primary: true, kbd: 'R' }],
    };
  }

  return (
    <div className={`arc-game ${styles.game}`} style={{ '--game-color': 'var(--game-2048)' } as CSSProperties}>
      {!embedded && (
        <header className="arc-game__head">
          <div>
            <h1 className="arc-game__title">2048</h1>
            <p className="arc-game__sub">Slide tiles, merge equal numbers, reach 2048 — and beyond.</p>
          </div>
        </header>
      )}

      <StatPanel
        status={status}
        statusLabel={state.status === 'won' ? 'You win!' : undefined}
        items={[
          { label: 'Score', value: state.score },
          { label: 'Best', value: best, highlight: newBest },
          { label: 'Max tile', value: max },
          { label: 'Moves', value: state.moveCount },
          { label: 'Time', value: formatClock(seconds) },
        ]}
      />

      <div className={styles.layout}>
        <div className={`arc-game__board ${styles.boardWrap}`}>
          <GameBoard ref={boardRef} tiles={state.tiles} />
          {overlay && <GameOverlay {...overlay} />}
        </div>

        <aside className={styles.side}>
          <section className="arc-panel">
            <h2 className="arc-panel__title">Game</h2>
            <div className={styles.buttons}>
              <button type="button" className="arc-btn arc-btn--primary" onClick={startNewRun}>
                New game
              </button>
              <button type="button" className="arc-btn" onClick={undo} disabled={!undoable}>
                Undo
              </button>
              <button
                type="button"
                className="arc-btn arc-btn--ghost"
                onClick={togglePause}
                disabled={state.status !== 'running' && state.status !== 'paused'}
              >
                {state.status === 'paused' ? 'Resume' : 'Pause'}
              </button>
            </div>
            <div className={styles.save}>
              <SaveBadge savedAt={inProgress ? savedAt : null} onDiscard={discardSave} />
            </div>
          </section>

          <section className="arc-panel">
            <h2 className="arc-panel__title">How to play</h2>
            <p className={styles.help}>
              Every slide moves all tiles as far as they go; two equal tiles merge into their sum, which is added to
              your score. A new 2 (or 4) appears after each move. Reach the 2048 tile to win — then keep going until
              no moves are left.
            </p>
          </section>

          <section className="arc-panel">
            <h2 className="arc-panel__title">Keys</h2>
            <KeyHelp rows={KEYS} />
          </section>
        </aside>
      </div>
    </div>
  );
}

export default Game2048;
