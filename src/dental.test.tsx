import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyDental, saveSession } from './arcade';
import { Game2048 } from './Game2048';
import type { GameState, Tile } from './logic/types';

beforeEach(() => {
  localStorage.clear();
  applyDental(false, { silent: true });
  localStorage.clear();
  vi.useFakeTimers();
  vi.spyOn(Math, 'random').mockReturnValue(0.3);
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const key = (k: string) => fireEvent.keyDown(window, { key: k });
const stat = (label: string) => screen.getByText(label).parentElement?.querySelector('dd')?.textContent;
const board = () => screen.getByRole('group', { name: '2048 board' });
const tileValues = () =>
  Array.from(board().querySelectorAll('.tile'))
    .map((t) => t.textContent)
    .sort();

function savedRun(): GameState {
  const rows = [
    [2, 4, 8, 64],
    [128, 1024, 2048, 4096],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
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
    score: 5120,
    hasWon: true,
    continueAfterWin: true,
    moveCount: 77,
    nextTileId: id,
    history: [],
  };
}

describe('2048 dental mode', () => {
  it('draws tooth art by tile value and keeps every number', () => {
    applyDental(true);
    saveSession('2048', { schema: 1, data: savedRun(), seconds: 60, score: 5120 });
    render(<Game2048 />);
    expect(board().getAttribute('data-dental')).toBe('true');
    const art = (value: string) =>
      Array.from(board().querySelectorAll('.tile'))
        .find((t) => t.textContent === value)!
        .querySelector('[data-testid^="game2048-tile-"]')!
        .getAttribute('data-testid');
    expect(art('2')).toBe('game2048-tile-milk');
    expect(art('4')).toBe('game2048-tile-milk');
    expect(art('8')).toBe('game2048-tile-molar');
    expect(art('64')).toBe('game2048-tile-molar');
    expect(art('128')).toBe('game2048-tile-smile');
    expect(art('1024')).toBe('game2048-tile-smile');
    expect(art('2048')).toBe('game2048-tile-crown');
    expect(art('4096')).toBe('game2048-tile-crown');
    expect(tileValues()).toEqual(['1024', '128', '2', '2048', '4', '4096', '64', '8']);
  });

  it('keeps the classic number tiles with dental mode off', () => {
    render(<Game2048 />);
    expect(board().getAttribute('data-dental')).toBe('false');
    expect(board().querySelectorAll('.tile').length).toBeGreaterThan(0);
    expect(board().querySelector('svg')).toBeNull();
  });

  it('toggling dental mode mid-run keeps the score, the tiles and the run', () => {
    render(<Game2048 />);
    act(() => key('ArrowLeft'));
    act(() => vi.advanceTimersByTime(500));
    expect(stat('Score')).toBe('4');
    expect(stat('Moves')).toBe('1');
    const before = tileValues();

    act(() => applyDental(true));
    expect(board().getAttribute('data-dental')).toBe('true');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(stat('Score')).toBe('4');
    expect(stat('Moves')).toBe('1');
    expect(tileValues()).toEqual(before);

    act(() => applyDental(false));
    expect(stat('Score')).toBe('4');
    expect(tileValues()).toEqual(before);
    act(() => key('ArrowRight'));
    expect(stat('Moves')).toBe('2');
  });

  it('offers the dental toggle in the game settings', () => {
    render(<Game2048 />);
    const box = screen.getByRole('checkbox', { name: /Dental mode/ });
    expect((box as HTMLInputElement).checked).toBe(false);
    act(() => fireEvent.click(box));
    expect(localStorage.getItem('arcade.dental')).toBe('1');
    expect(board().getAttribute('data-dental')).toBe('true');
  });
});
