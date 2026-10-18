import { describe, expect, it } from 'vitest';
import { getQuestionsFor } from './index';
import { DIFFICULTIES } from './types';

describe('Movies & TV and Cartoons split', () => {
  it('keeps every question in one difficulty band with sequential IDs', () => {
    const expected = {
      easy: { movies: 41, cartoons: 66 },
      medium: { movies: 70, cartoons: 35 },
      hard: { movies: 74, cartoons: 36 },
    } as const;
    const ids: string[] = [];

    for (const difficulty of DIFFICULTIES) {
      for (const category of ['movies', 'cartoons'] as const) {
        const questions = getQuestionsFor(category, difficulty);
        const prefix = `${category === 'movies' ? 'movie' : 'cartoon'}-${difficulty === 'medium' ? 'med' : difficulty}-`;
        expect(questions).toHaveLength(expected[difficulty][category]);
        expect(questions.map((q) => q.id)).toEqual(
          questions.map((_, index) => `${prefix}${String(index + 1).padStart(3, '0')}`),
        );
        expect(questions.every((q) => q.category === category && q.difficulty === difficulty)).toBe(true);
        ids.push(...questions.map((q) => q.id));
      }
    }

    expect(ids).toHaveLength(322);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
