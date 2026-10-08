import { describe, expect, it } from 'vitest';
import { unread } from './news';

describe('unread', () => {
  const drops = [{ id: 'a' }, { id: 'b' }];

  it('keeps drops this browser has not seen', () => {
    expect(unread(drops, ['a']).map((drop) => drop.id)).toEqual(['b']);
  });

  it('returns none when every drop is seen', () => {
    expect(unread(drops, ['a', 'b'])).toEqual([]);
  });
});
