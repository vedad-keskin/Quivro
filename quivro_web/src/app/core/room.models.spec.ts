import { describe, expect, it } from 'vitest';
import {
  hashSeed,
  questionShuffleSeed,
  shuffledOptionsForQuestion,
  shuffleWithSeed,
} from './room.models';

describe('room.models shuffle helpers', () => {
  it('hashSeed is stable for the same input', () => {
    expect(hashSeed('ROOM01:q1:0')).toBe(hashSeed('ROOM01:q1:0'));
    expect(hashSeed('ROOM01:q1:0')).not.toBe(hashSeed('ROOM01:q1:1'));
  });

  it('questionShuffleSeed normalizes room code casing', () => {
    expect(questionShuffleSeed('abc123', 'q1', 0)).toBe(
      questionShuffleSeed('ABC123', 'q1', 0),
    );
  });

  it('shuffleWithSeed is deterministic for a fixed seed', () => {
    const items = ['A', 'B', 'C', 'D'];
    const first = shuffleWithSeed(items, 42);
    const second = shuffleWithSeed(items, 42);
    expect(first).toEqual(second);
    expect(first).not.toEqual(items);
  });

  it('shuffledOptionsForQuestion keeps the correct answer in the shuffled set', () => {
    const base: [string, string, string, string] = ['A', 'B', 'C', 'D'];
    const first = shuffledOptionsForQuestion(base, 2, 'ROOM01', 'bio-hard-1', 3);
    const second = shuffledOptionsForQuestion(base, 2, 'ROOM01', 'bio-hard-1', 3);

    expect(first.options).toEqual(second.options);
    expect(first.options[first.displayCorrect]).toBe('C');
    expect(new Set(first.options)).toEqual(new Set(base));
  });
});
