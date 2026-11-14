import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyDental, applyLang } from './arcade';
import { Game2048 } from './Game2048';
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
const finishBtn = () => screen.queryByRole('button', { name: 'Befejezés' });

describe('finish early', () => {
  it('is hidden before the first move and visible after it', () => {
    render(<Game2048 />);
    expect(finishBtn()).toBeNull();
    act(() => key('ArrowLeft'));
    expect(finishBtn()).not.toBeNull();
  });

  it('confirms with the Score-panel value, then ranks it once and ends the run', () => {
    const onGameOver = vi.fn();
    render(<Game2048 onGameOver={onGameOver} />);
    act(() => key('ArrowLeft'));
    act(() => vi.advanceTimersByTime(2000));
    expect(localStorage.getItem('arcade.session.2048')).not.toBeNull();

    act(() => void fireEvent.click(finishBtn()!));
    const confirm = screen.getByRole('alertdialog');
    expect(confirm.textContent).toContain('4 pont kerül a ranglistára');
    expect(screen.getByRole('status').textContent).toMatch(/Szünet/);

    act(() => void fireEvent.click(within(confirm).getByRole('button', { name: 'Befejezem' })));
    expect(onGameOver).toHaveBeenCalledTimes(1);
    expect(onGameOver).toHaveBeenCalledWith(4, { finished: true });
    expect(screen.getByText('Idő előtt befejezve')).toBeTruthy();
    expect(finishBtn()).toBeNull();
    act(() => vi.advanceTimersByTime(3000));
    expect(localStorage.getItem('arcade.session.2048')).toBeNull();
    expect(onGameOver).toHaveBeenCalledTimes(1);
  });

  it('Cancel changes nothing', () => {
    const onGameOver = vi.fn();
    render(<Game2048 onGameOver={onGameOver} />);
    act(() => key('ArrowLeft'));
    act(() => void fireEvent.click(finishBtn()!));
    act(() => void fireEvent.click(screen.getByRole('button', { name: 'Mégse' })));
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(onGameOver).not.toHaveBeenCalled();
    expect(screen.queryByText('Idő előtt befejezve')).toBeNull();
    expect(screen.getByText('Pont').parentElement?.querySelector('dd')?.textContent).toBe('4');
  });
});
