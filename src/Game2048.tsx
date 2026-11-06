import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import {
  clearSession,
  formatClock,
  formatNumber,
  gameName,
  GameOverlay,
  KeyHelp,
  SaveBadge,
  StatPanel,
  useArcadeRun,
  useKitMessages,
  useLang,
  useMessages,
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
import { MESSAGES } from './i18n';
import { ANIMATION_MS } from './logic/constants';
import { advanceGame, canUndo, createInitialState, reachedTarget, settledTiles } from './logic/game';
import { is2048State } from './logic/persist';
import type { Direction, GameAction, GameState, GameStatus } from './logic/types';
import { maxTile } from './logic/win';
import styles from './App.module.css';

/** Bump when GameState changes shape; older saves are then discarded. */
const SESSION_SCHEMA = 1;

const rng = () => Math.random();


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
  const t = useMessages(MESSAGES);
  const k = useKitMessages();
  const [lang] = useLang();
  const num = (n: number) => formatNumber(n, lang);
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
          title: k('welcomeBack'),
          message: t('welcomeMessage', { score: num(state.score), max, time: formatClock(seconds) }),
          actions: [
            { label: t('continue'), onClick: togglePause, primary: true, kbd: 'P' },
            { label: k('newGame'), onClick: startNewRun, kbd: 'R' },
          ],
        }
      : {
          title: k('paused'),
          message: t('pausedMessage'),
          actions: [
            { label: k('resume'), onClick: togglePause, primary: true, kbd: 'P' },
            { label: k('newGame'), onClick: startNewRun, kbd: 'R' },
          ],
        };
  } else if (state.status === 'won') {
    overlay = {
      title: t('youWin'),
      message: t('winMessage', { score: num(state.score) }),
      actions: [
        { label: t('keepGoing'), onClick: continueAfterWin, primary: true, kbd: 'C' },
        { label: k('newGame'), onClick: startNewRun, kbd: 'R' },
      ],
    };
  } else if (state.status === 'gameOver') {
    overlay = {
      title: reachedTarget(state) ? t('noMovesWon') : k('gameOver'),
      message: t('gameOverMessage', {
        score: num(state.score),
        best: num(best),
        newBest: newBest ? t('newBestSuffix') : '',
        max,
      }),
      actions: [{ label: t('playAgain'), onClick: startNewRun, primary: true, kbd: 'R' }],
    };
  }

  return (
    <div className={`arc-game ${styles.game}`} style={{ '--game-color': 'var(--game-2048)' } as CSSProperties}>
      {!embedded && (
        <header className="arc-game__head">
          <div>
            <h1 className="arc-game__title">{gameName('2048', lang)}</h1>
            <p className="arc-game__sub">{t('subtitle')}</p>
          </div>
        </header>
      )}

      <StatPanel
        status={status}
        statusLabel={state.status === 'won' ? t('youWin') : undefined}
        items={[
          { label: k('score'), value: num(state.score) },
          { label: k('best'), value: num(best), highlight: newBest },
          { label: t('maxTile'), value: max },
          { label: k('moves'), value: num(state.moveCount) },
          { label: k('time'), value: formatClock(seconds) },
        ]}
      />

      <div className={styles.layout}>
        <div className={`arc-game__board ${styles.boardWrap}`}>
          <GameBoard ref={boardRef} tiles={state.tiles} label={t('board')} />
          {overlay && <GameOverlay {...overlay} />}
        </div>

        <aside className={styles.side}>
          <section className="arc-panel">
            <h2 className="arc-panel__title">{t('panelGame')}</h2>
            <div className={styles.buttons}>
              <button type="button" className="arc-btn arc-btn--primary" onClick={startNewRun}>
                {k('newGame')}
              </button>
              <button type="button" className="arc-btn" onClick={undo} disabled={!undoable}>
                {t('undo')}
              </button>
              <button
                type="button"
                className="arc-btn arc-btn--ghost"
                onClick={togglePause}
                disabled={state.status !== 'running' && state.status !== 'paused'}
              >
                {state.status === 'paused' ? k('resume') : k('pause')}
              </button>
            </div>
            <div className={styles.save}>
              <SaveBadge savedAt={inProgress ? savedAt : null} onDiscard={discardSave} />
            </div>
          </section>

          <section className="arc-panel">
            <h2 className="arc-panel__title">{t('panelHowTo')}</h2>
            <p className={styles.help}>{t('howToPlay')}</p>
          </section>

          <section className="arc-panel">
            <h2 className="arc-panel__title">{t('panelKeys')}</h2>
            <KeyHelp
              rows={[
                ['← ↑ → ↓', t('keySlide')],
                ['U', t('keyUndo')],
                [t('keySpace'), t('keyPauseResume')],
                ['P Esc', t('keyPauseResume')],
                ['C', t('keyKeepGoing')],
                ['R', k('newGame')],
              ]}
            />
          </section>
        </aside>
      </div>
    </div>
  );
}

export default Game2048;
