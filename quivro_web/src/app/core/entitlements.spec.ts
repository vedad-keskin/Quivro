import { describe, expect, it } from 'vitest';
import {
  FREE_MAX_ROUND_LENGTH,
  PRO_CATEGORIES,
  clampToFree,
  isCategoryFree,
  rotatingFreeCategory,
} from './entitlements';
import type { RoomConfig } from './room.models';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
/** Monday 2026-01-05 00:00 UTC — the rotation is documented to flip on Mondays. */
const MONDAY = Date.UTC(2026, 0, 5);

function config(overrides: Partial<RoomConfig> = {}): RoomConfig {
  return {
    categories: ['geography'],
    questionTypes: ['mcq'],
    roundLength: 10,
    language: 'en',
    scoringMode: 'standard',
    questionSeconds: 15,
    ...overrides,
  };
}

describe('rotatingFreeCategory', () => {
  it('only ever picks a Pro category', () => {
    for (let i = 0; i < 20; i++) {
      expect(PRO_CATEGORIES).toContain(rotatingFreeCategory(Date.now() + i * WEEK_MS));
    }
  });

  it('holds steady from Monday to Sunday, then flips at the next Monday', () => {
    expect(rotatingFreeCategory(MONDAY + WEEK_MS - 1)).toBe(rotatingFreeCategory(MONDAY));
    expect(rotatingFreeCategory(MONDAY + WEEK_MS)).not.toBe(rotatingFreeCategory(MONDAY));
  });

  it('flips on a Monday rather than mid-week', () => {
    // Sunday of the same week is unchanged; the Monday after is not.
    expect(rotatingFreeCategory(MONDAY + 6 * DAY_MS)).toBe(rotatingFreeCategory(MONDAY));
    expect(rotatingFreeCategory(MONDAY + 7 * DAY_MS)).not.toBe(rotatingFreeCategory(MONDAY));
  });

  it('cycles through every Pro category', () => {
    const seen = new Set(
      PRO_CATEGORIES.map((_, i) => rotatingFreeCategory(MONDAY + i * WEEK_MS)),
    );
    expect(seen.size).toBe(PRO_CATEGORIES.length);
  });

  it('handles dates before the epoch without a negative index', () => {
    expect(PRO_CATEGORIES).toContain(rotatingFreeCategory(0));
  });
});

describe('isCategoryFree', () => {
  const now = MONDAY;

  it('allows the always-free categories', () => {
    expect(isCategoryFree('geography', now)).toBe(true);
    expect(isCategoryFree('sports', now)).toBe(true);
  });

  it('allows this week rotating category but not the other Pro ones', () => {
    const free = rotatingFreeCategory(now);
    expect(isCategoryFree(free, now)).toBe(true);
    for (const category of PRO_CATEGORIES.filter((c) => c !== free)) {
      expect(isCategoryFree(category, now)).toBe(false);
    }
  });
});

describe('clampToFree', () => {
  const now = MONDAY;
  const lockedCategory = PRO_CATEGORIES.find((c) => c !== rotatingFreeCategory(now))!;

  it('drops locked categories but keeps the rotating one', () => {
    const free = rotatingFreeCategory(now);
    const result = clampToFree(
      config({ categories: ['geography', free, lockedCategory] }),
      now,
    );
    expect(result.categories).toEqual(['geography', free]);
  });

  it('never leaves the round with zero categories', () => {
    const result = clampToFree(config({ categories: [lockedCategory] }), now);
    expect(result.categories.length).toBeGreaterThan(0);
  });

  it('strips image questions and falls back to mcq', () => {
    expect(clampToFree(config({ questionTypes: ['image_mcq'] }), now).questionTypes).toEqual([
      'mcq',
    ]);
    expect(
      clampToFree(config({ questionTypes: ['mcq', 'image_mcq'] }), now).questionTypes,
    ).toEqual(['mcq']);
  });

  it('caps round length and forces standard scoring', () => {
    const result = clampToFree(config({ roundLength: 100, scoringMode: 'timed' }), now);
    expect(result.roundLength).toBe(FREE_MAX_ROUND_LENGTH);
    expect(result.scoringMode).toBe('standard');
  });

  it('leaves an already-free config untouched', () => {
    const input = config({ roundLength: 20 });
    expect(clampToFree(input, now)).toEqual(input);
  });
});
