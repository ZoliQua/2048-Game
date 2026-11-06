import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyLang, LANGS } from './arcade';
import { Game2048 } from './Game2048';
import { MESSAGES } from './i18n';

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
  // Constant RNG: the fresh board is two 2s side by side on row 1, so LEFT merges them.
  vi.spyOn(Math, 'random').mockReturnValue(0.3);
});
afterEach(() => {
  act(() => applyLang('en'));
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const key = (k: string) => fireEvent.keyDown(window, { key: k });
const stat = (label: string) => screen.getByText(label).parentElement?.querySelector('dd')?.textContent;

describe('2048 translations', () => {
  it('has every key in every language with a non-empty value', () => {
    const keys = Object.keys(MESSAGES.en);
    expect(keys.length).toBeGreaterThan(0);
    for (const lang of LANGS) {
      expect(Object.keys(MESSAGES[lang]).sort()).toEqual([...keys].sort());
      for (const k of keys) expect(MESSAGES[lang][k as keyof typeof MESSAGES.en].trim()).not.toBe('');
    }
  });

  it('shows the German controls and overlay (2048 has no start overlay: it is playable at once)', () => {
    applyLang('de');
    render(<Game2048 />);
    expect(screen.getByRole('heading', { name: 'So wird gespielt' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Neues Spiel' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Rückgängig' })).toBeTruthy();
    expect(stat('Höchste Kachel')).toBe('2');
    act(() => key('p'));
    const dialog = screen.getByRole('dialog', { name: 'Pausiert' });
    expect(dialog.textContent).toContain('Dein Spiel wird automatisch gespeichert');
    expect(within(dialog).getByRole('button', { name: /Weiter/ })).toBeTruthy();
  });

  it('switching language mid-run keeps the score and the board', () => {
    const { container } = render(<Game2048 />);
    act(() => key('ArrowLeft'));
    expect(stat('Moves')).toBe('1');
    expect(stat('Score')).toBe('4');
    const board = () => container.querySelector('[role="group"]')!;
    const before = board().innerHTML;

    act(() => applyLang('hu'));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(stat('Lépések')).toBe('1');
    expect(stat('Pont')).toBe('4');
    expect(board().innerHTML).toBe(before);
    expect(board().getAttribute('aria-label')).toBe('2048-as tábla');
  });
});
