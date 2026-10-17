import { describe, expect, it } from 'vitest';
import { fitFont } from './answer-grid';

describe('fitFont', () => {
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
