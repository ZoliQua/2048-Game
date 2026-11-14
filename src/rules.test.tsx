import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyDental, applyLang, formatNumber } from './arcade';
import { Game2048 } from './Game2048';
import { SCORING_EXAMPLES, TARGET_VALUE } from './logic/constants';
import { mockPointer } from './test/helpers';

beforeEach(() => {
  localStorage.clear();
  applyDental(false, { silent: true });
  applyLang('hu', { silent: true });
  mockPointer(false);
  vi.useFakeTimers();
  vi.spyOn(Math, 'random').mockReturnValue(0.3);
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  applyLang('en', { silent: true });
});

const key = (k: string) => fireEvent.keyDown(window, { key: k });
const stat = (label: string) => screen.getByText(label).parentElement?.querySelector('dd')?.textContent;
const openRules = () => act(() => void fireEvent.click(screen.getByRole('button', { name: 'Szabályok' })));
const headings = (dialog: HTMLElement) => within(dialog).getAllByRole('heading', { level: 3 }).map((h) => h.textContent);

describe('rules dialog', () => {
  it('has a visible Rules button', () => {
    render(<Game2048 />);
    expect(screen.getByRole('button', { name: 'Szabályok' })).toBeTruthy();
  });

  it('pauses a running game while open and leaves it paused when closed', () => {
    render(<Game2048 />);
    act(() => key('ArrowLeft'));
    expect(screen.getByRole('status').textContent).toBe('Játékban');
    openRules();
    expect(screen.getByRole('status').textContent).toBe('Szünet');
    act(() => void fireEvent.click(screen.getByRole('button', { name: 'Bezárás' })));
    expect(screen.queryByRole('dialog', { name: /szabályok/ })).toBeNull();
    expect(screen.getByRole('status').textContent).toBe('Szünet');
  });

  it('lists goal, play, rules, scoring and dental in order (no mobile on a mouse device)', () => {
    render(<Game2048 />);
    openRules();
    const dialog = screen.getByRole('dialog', { name: /szabályok/ });
    expect(headings(dialog)).toEqual(['Cél', 'Így játssz', 'Szabályok', 'Pontozás', 'Fogas mód']);
    expect(within(dialog).getByRole('img', { name: /8.*16|16.*8/ })).toBeTruthy();
  });

  it('adds the mobile section with the touch rows on a coarse pointer', () => {
    mockPointer(true);
    render(<Game2048 />);
    openRules();
    const dialog = screen.getByRole('dialog', { name: /szabályok/ });
    expect(headings(dialog)).toEqual(['Cél', 'Így játssz', 'Szabályok', 'Pontozás', 'Fogas mód', 'Mobilon']);
    const mobile = dialog.querySelector('.arc-rules__section--mobile') as HTMLElement;
    expect(mobile.textContent).toMatch(/Húzd az ujjad/);
    expect(mobile.textContent).toMatch(/Teljes képernyő/);
  });

  it('shows every number of the scoring constants', () => {
    render(<Game2048 />);
    openRules();
    const scoring = screen.getByRole('dialog', { name: /szabályok/ }).querySelector('.arc-rules__section--scoring')!;
    for (const value of SCORING_EXAMPLES) {
      expect(scoring.textContent).toContain(formatNumber(value, 'hu'));
      expect(scoring.textContent).toContain(formatNumber(value * 2, 'hu'));
    }
    const goal = screen.getByRole('dialog', { name: /szabályok/ }).querySelector('.arc-rules__section--goal')!;
    expect(goal.textContent).toContain(formatNumber(TARGET_VALUE, 'hu'));
  });

  it('draws the diagram with tooth art in dental mode', () => {
    applyDental(true, { silent: true });
    render(<Game2048 />);
    openRules();
    expect(screen.getByRole('img', { name: /8.*16|16.*8/ }).querySelector('[data-dental="true"]')).toBeTruthy();
  });

  it('keeps the run when the language is switched inside the rules', () => {
    render(<Game2048 />);
    act(() => key('ArrowLeft'));
    openRules();
    act(() => applyLang('de'));
    const dialog = screen.getByRole('dialog', { name: /Regeln/ });
    expect(within(dialog).getByRole('heading', { level: 2 }).textContent).toMatch(/Regeln/);
    expect(headings(dialog)[0]).toBe('Ziel');
    act(() => void fireEvent.click(within(dialog).getByRole('button', { name: 'Schließen' })));
    expect(stat('Punkte')).toBe('4');
    expect(stat('Züge')).toBe('1');
  });

  it('does not open on R: R still starts a new game', () => {
    render(<Game2048 />);
    act(() => key('ArrowLeft'));
    act(() => key('r'));
    expect(screen.queryByRole('dialog', { name: /szabályok/ })).toBeNull();
    expect(stat('Lépések')).toBe('0');
  });
});
