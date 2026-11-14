import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyDental, applyLang } from './arcade';
import { Game2048 } from './Game2048';
import { mockPointer, swipe } from './test/helpers';

beforeEach(() => {
  localStorage.clear();
  applyDental(false, { silent: true });
  applyLang('en', { silent: true });
  mockPointer(true);
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
  vi.useFakeTimers();
  // Constant RNG: two 2s side by side on row 1.
  vi.spyOn(Math, 'random').mockReturnValue(0.3);
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  delete document.documentElement.dataset.arcadeImmersive;
});

const stat = (label: string) => screen.getByText(label).parentElement?.querySelector('dd')?.textContent;
const board = () => screen.getByRole('group', { name: '2048 board' });

describe('touch controls', () => {
  it('marks the board as a gesture board (no page scroll, no pull-to-refresh)', () => {
    render(<Game2048 />);
    expect(board().classList.contains('arc-board-touch')).toBe(true);
  });

  it('shows the touch help instead of the key list', () => {
    render(<Game2048 />);
    expect(screen.getByRole('list', { name: 'Touch controls' })).toBeTruthy();
    expect(screen.queryByRole('list', { name: 'Controls' })).toBeNull();
  });

  it.each([
    ['left', -80, 0],
    ['right', 80, 0],
    ['up', 0, -80],
    ['down', 0, 80],
  ])('swiping %s slides the tiles', (_name, dx, dy) => {
    render(<Game2048 />);
    act(() => swipe(board(), dx, dy));
    expect(stat('Moves')).toBe('1');
  });

  it('a horizontal swipe merges the two 2s', () => {
    render(<Game2048 />);
    act(() => swipe(board(), -80, 0));
    expect(stat('Score')).toBe('4');
  });

  it('ignores a tiny drag and a swipe while paused', () => {
    render(<Game2048 />);
    act(() => swipe(board(), 5, 3));
    expect(stat('Moves')).toBe('0');
    act(() => void fireEvent.click(screen.getByRole('button', { name: 'Pause' })));
    act(() => swipe(board(), -80, 0));
    expect(stat('Moves')).toBe('0');
  });

  it('the Full screen button toggles the immersive mode', () => {
    render(<Game2048 />);
    act(() => void fireEvent.click(screen.getByRole('button', { name: /Full screen/ })));
    expect(document.documentElement.dataset.arcadeImmersive).toBe('1');
    act(() => void fireEvent.click(screen.getByRole('button', { name: /Exit full screen/ })));
    expect(document.documentElement.dataset.arcadeImmersive).toBeUndefined();
  });
});
