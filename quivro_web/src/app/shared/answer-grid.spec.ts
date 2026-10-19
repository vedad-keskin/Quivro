import { describe, expect, it, vi } from 'vitest';
import { fitFont } from './answer-grid';

describe('fitFont', () => {
  it('keeps the preferred size when a small shift clears the answer badge', () => {
    const style = document.createElement('style');
    style.textContent = '.fit-test { font-size: 48px; }';
    document.head.append(style);

    const box = document.createElement('div');
    box.className = 'fit-test';
    const inner = document.createElement('span');
    inner.className = 'fit';
    const badge = document.createElement('span');
    box.append(inner, badge);
    document.body.append(box);

    const rect = (left: number, top: number, width: number, height: number) =>
      ({ left, top, right: left + width, bottom: top + height, width, height }) as DOMRect;
    const shift = () => parseFloat(inner.style.transform.match(/translateY\((\d+)px\)/)?.[1] ?? '0');
    box.getBoundingClientRect = () => rect(0, 0, 200, 240);
    inner.getBoundingClientRect = () => rect(0, 40 + shift(), 200, 130);
    badge.getBoundingClientRect = () => rect(0, 0, 70, 80);

    const createRange = document.createRange.bind(document);
    const rangeSpy = vi.spyOn(document, 'createRange').mockImplementation(() => {
      const range = createRange();
      range.getClientRects = () => [rect(30, 40 + shift(), 150, 40)] as unknown as DOMRectList;
      return range;
    });
    try {
      fitFont(box, 12, box, badge);
      expect(box.style.fontSize).toBe('');
      expect(inner.style.transform).toBe('translateY(48px)');
      expect(inner.classList.contains('badge-cutout')).toBe(false);
    } finally {
      rangeSpy.mockRestore();
      box.remove();
      style.remove();
    }
  });

  it('keeps the preferred size when width differs only by subpixel rounding', () => {
    const style = document.createElement('style');
    style.textContent = '.fit-test { font-size: 48px; }';
    document.head.append(style);

    const box = document.createElement('div');
    box.className = 'fit-test';
    const inner = document.createElement('span');
    inner.className = 'fit';
    box.append(inner);
    document.body.append(box);

    const bounds = (width: number, height: number) => ({ width, height }) as DOMRect;
    box.getBoundingClientRect = () => bounds(200, 80);
    inner.getBoundingClientRect = () => bounds(200.003, 60);

    fitFont(box, 12);

    expect(box.style.fontSize).toBe('');
    box.remove();
    style.remove();
  });

  it('shrinks a word that overflows its row without increasing the line height', () => {
    const style = document.createElement('style');
    style.textContent = '.fit-test { font-size: 48px; }';
    document.head.append(style);

    const box = document.createElement('div');
    box.className = 'fit-test';
    const inner = document.createElement('span');
    inner.className = 'fit';
    box.append(inner);
    document.body.append(box);

    const bounds = (width: number, height: number) => ({ width, height }) as DOMRect;
    box.getBoundingClientRect = () => bounds(160, 80);
    inner.getBoundingClientRect = () => bounds(160, 60);
    Object.defineProperty(inner, 'scrollWidth', {
      get: () => 300 * parseFloat(getComputedStyle(box).fontSize) / 48,
    });

    fitFont(box, 12);

    expect(parseFloat(box.style.fontSize)).toBeLessThan(48);
    expect(inner.scrollWidth).toBeLessThanOrEqual(160);
    box.remove();
    style.remove();
  });

  it('shrinks text that overhangs by less than one pixel', () => {
    const style = document.createElement('style');
    style.textContent = '.fit-test { font-size: 24px; }';
    document.head.append(style);

    const box = document.createElement('div');
    box.className = 'fit-test';
    const inner = document.createElement('span');
    inner.className = 'fit';
    box.append(inner);
    document.body.append(box);

    const bounds = (width: number, height: number) => ({ width, height }) as DOMRect;
    box.getBoundingClientRect = () => bounds(200, 50);
    inner.getBoundingClientRect = () =>
      bounds(100, 50.5 * parseFloat(getComputedStyle(box).fontSize) / 24);
    Object.defineProperties(box, {
      clientWidth: { value: 200 },
      clientHeight: { value: 50 },
    });
    Object.defineProperties(inner, {
      offsetWidth: { value: 100 },
      offsetHeight: { value: 51 },
    });

    fitFont(box, 12);

    expect(parseFloat(box.style.fontSize)).toBeLessThan(24);
    expect(inner.getBoundingClientRect().height).toBeLessThanOrEqual(50);
    box.remove();
    style.remove();
  });
});
