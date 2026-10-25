import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadSession, readStats, saveSession } from './arcade';
import { Game2048Demo } from './demo/Game2048Demo';
import { Game2048 } from './Game2048';
import type { GameState, Tile } from './logic/types';

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
  // Constant RNG: the fresh board is two 2s side by side on row 1, so LEFT merges them.
  vi.spyOn(Math, 'random').mockReturnValue(0.3);
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const key = (k: string) => fireEvent.keyDown(window, { key: k });
const stat = (label: string) => screen.getByText(label).parentElement?.querySelector('dd')?.textContent;

function fromRows(rows: number[][], over: Partial<GameState> = {}): GameState {
  const tiles: Tile[] = [];
  let id = 1;
  rows.forEach((row, r) =>
    row.forEach((value, c) => {
      if (value) tiles.push({ id: id++, value, row: r, col: c });
    }),
  );
  return {
    tiles,
    size: 4,
    status: 'running',
    score: 0,
    hasWon: false,
    continueAfterWin: false,
    moveCount: 5,
    nextTileId: id,
    history: [],
    ...over,
  };
}

/** One LEFT slide merges the two 2s; the spawn then fills the last cell with no moves left. */
const doomedRows = (corner: number) => [
  [2, 2, 8, 16],
  [32, 64, 128, 256],
  [4, 8, 16, 32],
  [64, 128, 256, corner],
];

describe('<Game2048 />', () => {
  it('is playable at once, pauses with P / Esc and reports status to the host', () => {
    const onStatusChange = vi.fn();
    render(<Game2048 onStatusChange={onStatusChange} />);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(onStatusChange).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'running' }));

    act(() => key('ArrowLeft'));
    expect(stat('Moves')).toBe('1');
    expect(stat('Score')).toBe('4');

    act(() => key('p'));
    expect(screen.getByRole('dialog', { name: 'Paused' })).toBeTruthy();
    expect(onStatusChange).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'paused' }));
    act(() => key('ArrowRight'));
    expect(stat('Moves')).toBe('1');
    act(() => key('Escape'));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('undoes the last move', () => {
    render(<Game2048 />);
    const undo = screen.getByRole('button', { name: 'Undo' }) as HTMLButtonElement;
    expect(undo.disabled).toBe(true);
    act(() => key('ArrowLeft'));
    expect(undo.disabled).toBe(false);
    act(() => undo.click());
    expect(stat('Moves')).toBe('0');
    expect(stat('Score')).toBe('0');
  });

  it('autosaves a run in progress (with undo history) and restores it paused', () => {
    const { unmount } = render(<Game2048 />);
    act(() => key('ArrowLeft'));
    act(() => vi.advanceTimersByTime(1200));
    unmount();
    const saved = loadSession<GameState>('2048', 1);
    expect(saved?.data).toMatchObject({ status: 'running', moveCount: 1, score: 4 });
    expect(saved?.data.history).toHaveLength(1);

    render(<Game2048 embedded />);
    expect(screen.getByRole('dialog', { name: 'Welcome back' })).toBeTruthy();
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull();
    expect(stat('Score')).toBe('4');
    act(() => key('p'));
    expect(screen.queryByRole('dialog')).toBeNull();
    act(() => key('u'));
    expect(stat('Moves')).toBe('0');
  });

  it('records the finished run once and clears the save', () => {
    const onGameOver = vi.fn();
    const onRunEnd = vi.fn();
    saveSession('2048', { schema: 1, data: fromRows(doomedRows(512), { score: 100 }), seconds: 30, score: 100 });
    render(<Game2048 onGameOver={onGameOver} onRunEnd={onRunEnd} />);
    act(() => key('p'));
    act(() => key('ArrowLeft'));
    expect(screen.getByRole('dialog', { name: 'Game over' })).toBeTruthy();
    act(() => vi.advanceTimersByTime(2000));
    expect(onGameOver).toHaveBeenCalledTimes(1);
    expect(onGameOver).toHaveBeenCalledWith(104);
    expect(onRunEnd).toHaveBeenCalledWith(expect.objectContaining({ outcome: 'over', score: 104 }));
    expect(readStats('2048')).toMatchObject({ best: 104, plays: 1 });
    expect(loadSession('2048', 1)).toBeNull();
  });

  it('offers the win choice at 2048 and scores a won run as a win', () => {
    saveSession('2048', {
      schema: 1,
      data: fromRows([[1024, 1024, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]),
      seconds: 5,
      score: 0,
    });
    render(<Game2048 />);
    act(() => key('p'));
    act(() => key('ArrowLeft'));
    expect(screen.getByRole('dialog', { name: 'You win!' })).toBeTruthy();
    expect(stat('Max tile')).toBe('2048');
    act(() => key('c'));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('ends a run past 2048 with outcome win', () => {
    const onRunEnd = vi.fn();
    saveSession('2048', {
      schema: 1,
      data: fromRows(doomedRows(2048), { score: 30000, hasWon: true, continueAfterWin: true }),
      seconds: 600,
      score: 30000,
    });
    render(<Game2048 onRunEnd={onRunEnd} />);
    act(() => key('p'));
    act(() => key('ArrowLeft'));
    expect(onRunEnd).toHaveBeenCalledTimes(1);
    expect(onRunEnd).toHaveBeenCalledWith(expect.objectContaining({ outcome: 'win', score: 30004 }));
    expect(readStats('2048')).toMatchObject({ wins: 1 });
  });

  it('ignores hotkeys while typing in a field', () => {
    render(
      <>
        <input aria-label="nick" />
        <Game2048 />
      </>,
    );
    const input = screen.getByLabelText('nick');
    act(() => {
      fireEvent.keyDown(input, { key: 'ArrowLeft' });
      fireEvent.keyDown(input, { key: 'p' });
    });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(stat('Moves')).toBe('0');
  });
});

describe('<Game2048Demo />', () => {
  it('plays by itself without touching stats or saves', () => {
    vi.restoreAllMocks();
    const { container } = render(<Game2048Demo />);
    const before = container.innerHTML;
    act(() => vi.advanceTimersByTime(3000));
    expect(container.querySelector('.arc-demo')).toBeTruthy();
    expect(container.innerHTML).not.toBe(before);
    expect(container.querySelector('button, [tabindex]')).toBeNull();
    expect(readStats('2048').plays).toBe(0);
    expect(localStorage.length).toBe(0);
  });

  it('freezes when inactive', () => {
    const { container } = render(<Game2048Demo active={false} />);
    const before = container.innerHTML;
    act(() => vi.advanceTimersByTime(3000));
    expect(container.innerHTML).toBe(before);
  });
});
