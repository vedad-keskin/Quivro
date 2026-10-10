import { describe, expect, it } from 'vitest';
import { canUseDoubleIt, nextQuestionMultiplier, parseQuestionBoosts, pointMultiplier,
  parsePowerUpRequests, type RoomState, type PowerUpRequest } from './room.models';
import { clampToFree } from './entitlements';

const request: PowerUpRequest = { type: 'double_it', roundId: 'round-a', slot: 0, questionIndex: 2, at: 1500 };
function room(): RoomState {
  return {
    code: 'TEST', roundId: 'round-a', phase: 'question', currentIndex: 2, totalQuestions: 5,
    config: { powerUpSlots: ['double_it', 'double_it', 'fifty_fifty'], scoringMode: 'standard' },
    currentQuestion: { index: 2, answerOpensAt: 1000, endsAt: 2000 },
    players: { p1: { id: 'p1' }, p2: { id: 'p2' } }, powerUps: {},
  } as unknown as RoomState;
}
const contribution = { roundId: 'round-a', sourceIndex: 2, slot: 0, name: 'Ana', at: 1500 };

describe('Double it contract', () => {
  it('accepts before or after answering without requiring an answer', () => {
    const r = room();
    expect(canUseDoubleIt(r, 'p1', request, 1500)).toBe(true);
    r.answers = { '2': { p1: { choice: 0, answeredAt: 1400 } } };
    expect(canUseDoubleIt(r, 'p1', request, 1500)).toBe(true);
  });
  it('rejects preview, deadline, stale round/index, absent player and invalid slot', () => {
    for (const now of [999, 2000, 2001]) expect(canUseDoubleIt(room(), 'p1', request, now)).toBe(false);
    for (const change of [{ roundId: 'old' }, { questionIndex: 1 }, { slot: 2 }, { slot: .5 }, { slot: 3 }]) {
      expect(canUseDoubleIt(room(), 'p1', { ...request, ...change }, 1500)).toBe(false);
    }
    expect(canUseDoubleIt(room(), 'missing', request, 1500)).toBe(false);
    for (const phase of ['lobby', 'reveal', 'finished'] as const) {
      expect(canUseDoubleIt({ ...room(), phase }, 'p1', request, 1500)).toBe(false);
    }
  });
  it('allows the penultimate question but never the final question', () => {
    expect(canUseDoubleIt({ ...room(), totalQuestions: 4 }, 'p1', request, 1500)).toBe(true);
    expect(canUseDoubleIt({ ...room(), totalQuestions: 3 }, 'p1', request, 1500)).toBe(false);
  });
  it('blocks spent/locked/current-question usage but allows an unused slot next question', () => {
    const r = room();
    r.powerUps = { p1: { used: { '0': 2 }, eliminated: {}, probes: {}, locked: {} } };
    expect(canUseDoubleIt(r, 'p1', { ...request, slot: 1 }, 1500)).toBe(false);
    r.currentIndex = 3;
    r.currentQuestion!.index = 3;
    expect(canUseDoubleIt(r, 'p1', { ...request, slot: 1, questionIndex: 3 }, 1500)).toBe(true);
    expect(canUseDoubleIt(r, 'p1', { ...request, slot: 0, questionIndex: 3 }, 1500)).toBe(false);
    r.powerUps['p1'].locked['3'] = { blank: true };
    expect(canUseDoubleIt(r, 'p1', { ...request, slot: 1, questionIndex: 3 }, 1500)).toBe(false);
  });
  it('adds contributions without a cap, preserves departed casters, and separates targets', () => {
    const r = room();
    r.questionBoosts = parseQuestionBoosts({ '3': Object.fromEntries(
      Array.from({ length: 12 }, (_, i) => [`p${i}`, contribution])), '4': { p1: { ...contribution, sourceIndex: 3 } } }, r.roundId);
    expect(nextQuestionMultiplier(r)).toBe(13);
    expect(canUseDoubleIt(r, 'p1', request, 1500)).toBe(false);
    delete r.players['p1'];
    expect(nextQuestionMultiplier(r)).toBe(13);
    expect(nextQuestionMultiplier({ ...r, currentIndex: 3 })).toBe(2);
  });
  it('ignores old-round/malformed effects and defaults legacy multipliers safely', () => {
    expect(parseQuestionBoosts({ '3': { p1: contribution } }, 'other')).toEqual({});
    expect(parseQuestionBoosts({ '3': { p1: { ...contribution, slot: 1.5 } } }, 'round-a')).toEqual({});
    for (const value of [undefined, null, NaN, Infinity, -1, 0, 1.5, '3']) expect(pointMultiplier(value)).toBe(1);
    expect(pointMultiplier(30)).toBe(30);
    expect(parsePowerUpRequests({ p1: request })['p1']).toEqual(request);
    expect(clampToFree({ ...room().config, categories: ['geography'], questionTypes: ['mcq'], roundLength: 10 }).powerUpSlots).toEqual([null, null, null]);
  });
});
