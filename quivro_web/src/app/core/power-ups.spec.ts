import { describe, expect, it } from 'vitest';
import {
  answersFromUnconfirmedProbes,
  cyclePowerUpSlot,
  EMPTY_POWER_UP_SLOTS,
  normalizePowerUpSlots,
  parsePowerUps,
  pickFiftyFiftyEliminations,
  randomPowerUpSlots,
  resolveFiftyFiftyRequest,
  resolveSecondChanceRequest,
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
  it('wraps empty, 50/50, and second chance', () => {
    expect(cyclePowerUpSlot(null, 1)).toBe('fifty_fifty');
    expect(cyclePowerUpSlot('fifty_fifty', 1)).toBe('second_chance');
    expect(cyclePowerUpSlot('second_chance', 1)).toBe(null);
    expect(cyclePowerUpSlot(null, -1)).toBe('second_chance');
    expect(cyclePowerUpSlot('second_chance', -1)).toBe('fifty_fifty');
    expect(cyclePowerUpSlot('fifty_fifty', -1)).toBe(null);
  });
});

describe('randomPowerUpSlots', () => {
  it('returns three valid slots across the whole rand range', () => {
    expect(randomPowerUpSlots(() => 0)).toEqual([null, null, null]);
    expect(randomPowerUpSlots(() => 0.999)).toEqual([
      'second_chance',
      'second_chance',
      'second_chance',
    ]);
    expect(randomPowerUpSlots()).toHaveLength(3);
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
    expect(normalizePowerUpSlots(['second_chance', 'nope'])).toEqual([
      'second_chance',
      null,
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

const secondSlots: PowerUpSlots = ['second_chance', 'fifty_fifty', null];

function secondRequest(
  overrides: Partial<{ slot: number; type: string; questionIndex: number; choice?: number }> = {},
) {
  return {
    phase: 'question',
    questionIndex: 0,
    answerOpensAt: 1_000,
    endsAt: 5_000,
    now: 2_000,
    slots: secondSlots,
    request: { slot: 0, type: 'second_chance', questionIndex: 0, choice: 2, ...overrides },
    usedSlot: false,
    usedOnQuestion: false,
    correctIndex: 2,
    alreadyEliminated: [] as number[],
  };
}

describe('resolveSecondChanceRequest', () => {
  it('marks a right and a wrong guess', () => {
    expect(resolveSecondChanceRequest(secondRequest())).toEqual({ choice: 2, correct: true });
    expect(resolveSecondChanceRequest(secondRequest({ choice: 0 }))).toEqual({
      choice: 0,
      correct: false,
    });
  });

  it('rejects a spent slot, a second power-up, a bad phase, and a removed option', () => {
    expect(resolveSecondChanceRequest({ ...secondRequest(), phase: 'reveal' })).toBeNull();
    expect(resolveSecondChanceRequest({ ...secondRequest(), usedSlot: true })).toBeNull();
    expect(resolveSecondChanceRequest({ ...secondRequest(), usedOnQuestion: true })).toBeNull();
    expect(resolveSecondChanceRequest({ ...secondRequest(), now: 500 })).toBeNull();
    expect(
      resolveSecondChanceRequest({
        ...secondRequest(),
        request: { slot: 1, type: 'second_chance', questionIndex: 0, choice: 2 },
      }),
    ).toBeNull();
    expect(
      resolveSecondChanceRequest({ ...secondRequest(), alreadyEliminated: [2] }),
    ).toBeNull();
  });
});

describe('parsePowerUps', () => {
  it('reads a second chance probe', () => {
    const parsed = parsePowerUps({
      p1: { used: { '0': 1 }, probes: { '1': { choice: 2, correct: false } } },
    });
    expect(parsed['p1'].probes['1']).toEqual({ choice: 2, correct: false });
  });
});

describe('answersFromUnconfirmedProbes', () => {
  it('fills only a probe that was never locked, at the buzzer', () => {
    expect(
      answersFromUnconfirmedProbes({
        playerIds: ['p1', 'p2', 'p3'],
        answers: { p2: { choice: 1 } },
        probes: {
          p1: { choice: 2, correct: true },
          p2: { choice: 0, correct: false },
          p3: { choice: 9, correct: false },
        },
        endsAt: 5_000,
      }),
    ).toEqual({ p1: { choice: 2, answeredAt: 5_000 } });
  });
});
