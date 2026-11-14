import { fireEvent } from '@testing-library/react';
import { vi } from 'vitest';

/** Makes `(pointer: coarse)` match (a phone) or not (a desktop). */
export function mockPointer(coarse: boolean): void {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: coarse && query.includes('coarse'),
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

/** jsdom has no PointerEvent: a MouseEvent of the pointer type, carrying the pointer fields. */
function pointer(target: Element | Window, type: string, x: number, y: number): void {
  const e = new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0 });
  Object.defineProperties(e, {
    pointerId: { value: 7 },
    pointerType: { value: 'touch' },
    isPrimary: { value: true },
  });
  fireEvent(target, e);
}

/** One finger from (100,100) to (100+dx,100+dy) on `el`, as Pointer Events with pointerType touch. */
export function swipe(el: Element, dx: number, dy: number): void {
  pointer(el, 'pointerdown', 100, 100);
  pointer(window, 'pointermove', 100 + dx / 2, 100 + dy / 2);
  pointer(window, 'pointerup', 100 + dx, 100 + dy);
}
