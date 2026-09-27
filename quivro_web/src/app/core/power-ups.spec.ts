import { describe, expect, it } from 'vitest';
import {
  cyclePowerUpSlot,
  EMPTY_POWER_UP_SLOTS,
  normalizePowerUpSlots,
  pickFiftyFiftyEliminations,
  resolveFiftyFiftyRequest,
  type PowerUpSlots,
} from './room.models';

const slots: PowerUpSlots = ['fifty_fifty', null, 'fifty_fifty'];

function request(overrides: Partial<{ slot: number; type: string; questionIndex: number }> = {}) {
  return {
    phase: 'question',
    questionIndex: 0,
    answerOpensAt: 1_000,
    endsAt: 5_000,
    now: 2_000,
    slots,
    request: { slot: 0, type: 'fifty_fifty', questionIndex: 0, ...overrides },
    usedSlot: false,
    usedOnQuestion: false,
    correctIndex: 1,
    alreadyEliminated: [] as number[],
    existingChoice: null as number | null,
  };
}

describe('cyclePowerUpSlot', () => {
  it('wraps empty and 50/50 in either direction', () => {
    expect(cyclePowerUpSlot(null, 1)).toBe('fifty_fifty');
    expect(cyclePowerUpSlot('fifty_fifty', 1)).toBe(null);
    expect(cyclePowerUpSlot(null, -1)).toBe('fifty_fifty');
    expect(cyclePowerUpSlot('fifty_fifty', -1)).toBe(null);
  });
});

describe('normalizePowerUpSlots', () => {
  it('fills missing and unknown slots with empty', () => {
    expect(normalizePowerUpSlots(undefined)).toEqual(EMPTY_POWER_UP_SLOTS);
    expect(normalizePowerUpSlots(['nope', 'fifty_fifty'])).toEqual([
      null,
      'fifty_fifty',
      null,
    ]);
    expect(normalizePowerUpSlots({ '2': 'fifty_fifty' })).toEqual([
      null,
      null,
      'fifty_fifty',
    ]);
  });
});

describe('pickFiftyFiftyEliminations', () => {
  it('never removes the correct option and returns two distinct wrong ones', () => {
    for (let correct = 0; correct < 4; correct++) {
      for (let n = 0; n < 20; n++) {
        const picked = pickFiftyFiftyEliminations(correct);
        expect(picked).toHaveLength(2);
        expect(new Set(picked).size).toBe(2);
        expect(picked).not.toContain(correct);
        for (const i of picked) expect(i).toBeGreaterThanOrEqual(0);
        for (const i of picked) expect(i).toBeLessThanOrEqual(3);
      }
    }
  });
});

describe('resolveFiftyFiftyRequest', () => {
  it('rejects wrong phase, empty slots, and a slot already used', () => {
    expect(resolveFiftyFiftyRequest(request())?.eliminated).not.toContain(1);
    expect(resolveFiftyFiftyRequest({ ...request(), phase: 'reveal' })).toBeNull();
    expect(resolveFiftyFiftyRequest({ ...request(), usedSlot: true })).toBeNull();
    expect(resolveFiftyFiftyRequest({ ...request(), usedOnQuestion: true })).toBeNull();
    expect(
      resolveFiftyFiftyRequest({
        ...request(),
        request: { slot: 1, type: 'fifty_fifty', questionIndex: 0 },
      }),
    ).toBeNull();
    expect(resolveFiftyFiftyRequest({ ...request(), now: 500 })).toBeNull();
  });

  it('hides a previously chosen eliminated answer', () => {
    const decision = resolveFiftyFiftyRequest({
      ...request(),
      correctIndex: 0,
      alreadyEliminated: [1, 2],
      existingChoice: 3,
    });
    expect(decision?.eliminated).toEqual([1, 2, 3]);
    expect(decision?.clearAnswer).toBe(true);
  });
});
