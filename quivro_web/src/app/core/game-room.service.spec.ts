import { TestBed } from '@angular/core/testing';
import { get, onValue, remove, ref, set, update } from 'firebase/database';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DIFFICULTY_POINTS, IMAGE_MCQ_POINTS } from '../../data/questions/types';
import type { Question } from '../../data/questions/types';
import { FirebaseService } from './firebase.service';
import { GameRoomService } from './game-room.service';
import { QuestionBankService } from './question-bank.service';
import { RoundGeneratorService } from './round-generator.service';
import { ServerTimeService } from './server-time.service';
import { shuffledOptionsForQuestion, type RoomState } from './room.models';

const LAST_HOSTED_CODE_KEY = 'quivro.lastHostedCode';
const HOST_SESSION_KEY = 'quivro.hostSessionId';

const storageMock = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
};

const localStorageMock = storageMock();
const sessionStorageMock = storageMock();

vi.stubGlobal('localStorage', localStorageMock);
vi.stubGlobal('sessionStorage', sessionStorageMock);

function claimHost(service: GameRoomService, code = 'ROOM01'): void {
  const internal = service as unknown as {
    hostedCode: string | null;
    hosting: { set: (v: boolean) => void };
  };
  internal.hostedCode = code;
  internal.hosting.set(true);
}

const sampleQuestion: Question = {
  id: 'bio-hard-1',
  type: 'mcq',
  category: 'biology',
  difficulty: 'hard',
  prompt: { en: 'Prompt?', bs: 'Pitanje?' },
  options: [
    { en: 'A', bs: 'A' },
    { en: 'B', bs: 'B' },
    { en: 'C', bs: 'C' },
    { en: 'D', bs: 'D' },
  ],
  correctIndex: 2,
};

const easyQuestion: Question = {
  ...sampleQuestion,
  id: 'sports-easy-2',
  category: 'sports',
  difficulty: 'easy',
};
const mediumQuestion: Question = {
  ...sampleQuestion,
  id: 'geo-medium-1',
  category: 'geography',
  difficulty: 'medium',
};
const imageQuestion: Question = {
  ...sampleQuestion,
  id: 'image-3',
  type: 'image_mcq',
  category: 'images',
};
const upcomingQuestions: Question[] = [sampleQuestion, easyQuestion, imageQuestion];
const scoringQuestions: Question[] = [sampleQuestion, easyQuestion, mediumQuestion, imageQuestion];

function questionRoom(overrides: Partial<RoomState> = {}): RoomState {
  const endsAt = 1_015_000;
  const { displayCorrect } = shuffledOptionsForQuestion(
    ['A', 'B', 'C', 'D'],
    sampleQuestion.correctIndex,
    'ROOM01',
    sampleQuestion.id,
    0,
  );

  return {
    code: 'ROOM01',
    phase: 'question',
    config: {
      categories: ['biology'],
      questionTypes: ['mcq'],
      roundLength: 1,
      language: 'en',
      scoringMode: 'timed',
      questionSeconds: 15,
      powerUpSlots: [null, null, null],
    },
    createdAt: 1_000_000,
    currentIndex: 0,
    totalQuestions: 1,
    currentQuestion: {
      id: sampleQuestion.id,
      type: 'mcq',
      category: 'biology',
      difficulty: 'hard',
      prompt: 'Prompt?',
      options: ['A', 'B', 'C', 'D'],
      answerOpensAt: endsAt - 15_000,
      endsAt,
      durationMs: 15_000,
      index: 0,
      total: 1,
    },
    correctIndex: null,
    players: {
      p1: {
        id: 'p1',
        name: 'Ana',
        score: 0,
        avatar: 0,
        joinedAt: 1,
        wins: 0,
      },
    },
    answers: {
      '0': {
        p1: { choice: displayCorrect, answeredAt: 1_014_000 },
      },
    },
    questionIds: [sampleQuestion.id],
    lastWinners: [],
    rematchReady: {},
    ...overrides,
  } as RoomState;
}

function roomSnapshot(room: RoomState): Record<string, unknown> {
  return {
    phase: room.phase,
    roundId: room.roundId,
    powerUps: room.powerUps,
    powerUpRequests: room.powerUpRequests,
    questionBoosts: room.questionBoosts,
    hostCommit: room.hostRevision ? { id: room.hostRevision } : undefined,
    config: room.config,
    createdAt: room.createdAt,
    expiresAt: Date.now() + 60_000,
    currentIndex: room.currentIndex,
    totalQuestions: room.totalQuestions,
    currentQuestion: room.currentQuestion,
    correctIndex: room.correctIndex,
    players: room.players,
    answers: room.answers,
    questionIds: room.questionIds,
    lastWinners: room.lastWinners,
    rematchReady: room.rematchReady,
  };
}

function timedDelta(answeredAt: number, endsAt: number, durationMs: number): number {
  const base = DIFFICULTY_POINTS.hard;
  const clamped = Math.min(answeredAt, endsAt);
  const timeLeft = Math.max(0, endsAt - clamped);
  const speed = timeLeft / durationMs;
  return Math.round(base * (0.4 + 0.6 * speed));
}

vi.mock('firebase/database', () => ({
  get: vi.fn(),
  onDisconnect: vi.fn(() => ({ remove: vi.fn(), cancel: vi.fn() })),
  onValue: vi.fn(),
  ref: vi.fn((_db: unknown, path: string) => ({ path })),
  remove: vi.fn(),
  set: vi.fn(),
  update: vi.fn(),
}));

describe('GameRoomService', () => {
  let service: GameRoomService;
  const mockDb = { kind: 'mock-db' };

  beforeEach(async () => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
    vi.mocked(update).mockReset();
    vi.mocked(get).mockReset();

    await TestBed.configureTestingModule({
      providers: [
        GameRoomService,
        {
          provide: FirebaseService,
          useValue: { configured: true, db: mockDb, app: {} },
        },
        {
          provide: QuestionBankService,
          useValue: {
            getAll: () => scoringQuestions,
            getMetadata: (id: string) => {
              const q = upcomingQuestions.find((q) => q.id === id);
              return q ? { type: q.type, category: q.category, difficulty: q.difficulty } : null;
            },
          },
        },
        {
          provide: RoundGeneratorService,
          useValue: { generate: () => [sampleQuestion] },
        },
        {
          provide: ServerTimeService,
          useValue: { nowMs: () => 1_000_000 },
        },
      ],
    }).compileComponents();

    service = TestBed.inject(GameRoomService);
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('previews the actual next ID after refresh, reveal, advancement and rematch without Firebase calls', () => {
    const first = questionRoom({
      totalQuestions: 3,
      questionIds: upcomingQuestions.map((q) => q.id),
    });
    // No host cache is populated: this is also the refresh/spectator path.
    service.room.set(first);
    expect(service.nextQuestion()).toEqual({ type: 'mcq', category: 'sports', difficulty: 'easy' });
    service.room.set({ ...first, phase: 'reveal' });
    expect(service.nextQuestion()?.category).toBe('sports');

    service.room.set({
      ...first,
      currentIndex: 1,
      currentQuestion: { ...first.currentQuestion!, index: 1 },
    });
    expect(service.nextQuestion()).toEqual({ type: 'image_mcq', category: 'images', difficulty: 'hard' });

    service.room.set({ ...first, questionIds: [sampleQuestion.id, 'image-3', 'sports-easy-2'] });
    expect(service.nextQuestion()?.type).toBe('image_mcq');
    expect(get).not.toHaveBeenCalled();
    expect(set).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
    expect(onValue).not.toHaveBeenCalled();
  });

  it('does not guess previews for missing IDs, final questions, inactive rooms or mismatched indexes', () => {
    const room = questionRoom({ totalQuestions: 2, questionIds: [sampleQuestion.id, 'missing'] });
    service.room.set(room);
    expect(service.nextQuestion()).toBeNull();
    service.room.set({ ...room, questionIds: [sampleQuestion.id] });
    expect(service.nextQuestion()).toBeNull();
    service.room.set({ ...room, totalQuestions: 1, questionIds: [sampleQuestion.id, 'image-3'] });
    expect(service.nextQuestion()).toBeNull();
    for (const phase of ['lobby', 'finished', 'leaderboard'] as const) {
      service.room.set({ ...room, phase, questionIds: [sampleQuestion.id, 'image-3'] });
      expect(service.nextQuestion()).toBeNull();
    }
    service.room.set({ ...room, currentIndex: 1, totalQuestions: 3 });
    expect(service.nextQuestion()).toBeNull();
    service.room.set(null);
    expect(service.nextQuestion()).toBeNull();
  });

  it('leaveHostedRoom does not delete when only lastHostedCode is set (other tab)', async () => {
    localStorage.setItem(LAST_HOSTED_CODE_KEY, 'ROOM01');
    sessionStorage.setItem(HOST_SESSION_KEY, 'other-tab');

    await service.leaveHostedRoom('ROOM01');

    expect(remove).not.toHaveBeenCalled();
  });

  it('leaveHostedRoom deletes when this tab is hosting', async () => {
    localStorage.setItem(LAST_HOSTED_CODE_KEY, 'ROOM01');
    claimHost(service, 'ROOM01');

    await service.leaveHostedRoom('ROOM01');

    expect(ref).toHaveBeenCalledWith(mockDb, 'rooms/ROOM01');
    expect(remove).toHaveBeenCalled();
    expect(service.room()).toBeNull();
    expect(localStorage.getItem(LAST_HOSTED_CODE_KEY)).toBeNull();
  });

  it('leaveHostedRoom does not delete unrelated rooms', async () => {
    localStorage.setItem(LAST_HOSTED_CODE_KEY, 'ROOM01');
    claimHost(service, 'ROOM01');

    await service.leaveHostedRoom('OTHER2');

    expect(remove).not.toHaveBeenCalled();
  });

  it.each(['standard', 'timed'] as const)('multiplies the ordinary %s score after rounding and preserves zeroes', async (mode) => {
    const room = questionRoom();
    room.config.scoringMode = mode;
    room.currentQuestion!.multiplier = 3;
    room.answers['0']['p1'].answeredAt = 1_013_333;
    room.players['p2'] = { ...room.players['p1'], id: 'p2' };
    room.answers['0']['p2'] = { choice: (room.answers['0']['p1'].choice + 1) % 4, answeredAt: 1_001_000 };
    claimHost(service);
    vi.mocked(get).mockResolvedValue({ exists: () => true, val: () => roomSnapshot(room) } as never);
    await service.reveal('ROOM01');
    const patch = vi.mocked(update).mock.calls.at(-1)![1] as Record<string, unknown>;
    expect(patch['lastScoreDeltas']).toEqual({ p1: (mode === 'standard' ? 1 : timedDelta(1_013_333, 1_015_000, 15_000)) * 3, p2: 0 });
    expect(patch['powerUpRequests']).toBeNull();
    expect(patch['hostCommit']).toBeDefined();
  });

  it('multiplies every base after rounding and keeps misses at zero', async () => {
    const endsAt = 1_015_000;
    const easyAt = endsAt - 7_350;
    const boundaryAt = endsAt - 7_375;

    async function delta(room: RoomState): Promise<number> {
      const internal = service as unknown as {
        revealedIndex: number;
        roundQuestions: Map<string, unknown>;
      };
      internal.revealedIndex = -1;
      internal.roundQuestions.clear();
      vi.mocked(update).mockClear();
      claimHost(service);
      vi.mocked(get).mockResolvedValue({ exists: () => true, val: () => roomSnapshot(room) } as never);
      await service.reveal('ROOM01');
      const patch = vi.mocked(update).mock.calls.at(-1)![1] as Record<string, unknown>;
      return (patch['lastScoreDeltas'] as Record<string, number>)['p1'];
    }

    function scored(
      q: Question,
      multiplier: number,
      answeredAt: number,
      extra: Partial<RoomState> = {},
    ): RoomState {
      const choice = shuffledOptionsForQuestion(
        ['A', 'B', 'C', 'D'],
        q.correctIndex,
        'ROOM01',
        q.id,
        0,
      ).displayCorrect;
      const base = questionRoom();
      return questionRoom({
        questionIds: [q.id],
        currentQuestion: {
          ...base.currentQuestion!,
          id: q.id,
          type: q.type,
          category: q.category,
          difficulty: q.difficulty,
          multiplier,
        },
        answers: { '0': { p1: { choice, answeredAt } } },
        ...extra,
      });
    }

    function ordinary(base: number, answeredAt: number): number {
      const timeLeft = Math.max(0, endsAt - Math.min(answeredAt, endsAt));
      return Math.round(base * (0.4 + 0.6 * (timeLeft / 15_000)));
    }

    expect(ordinary(DIFFICULTY_POINTS.easy, easyAt)).toBe(347);
    expect(await delta(scored(easyQuestion, 2, easyAt))).toBe(694);
    expect(await delta(scored(easyQuestion, 3, easyAt))).toBe(1_041);
    expect(ordinary(DIFFICULTY_POINTS.easy, boundaryAt)).toBe(348);
    expect(await delta(scored(easyQuestion, 2, boundaryAt))).toBe(696);
    expect(await delta(scored(mediumQuestion, 3, 1_014_000))).toBe(
      ordinary(DIFFICULTY_POINTS.medium, 1_014_000) * 3,
    );
    expect(await delta(scored(sampleQuestion, 2, 1_014_000))).toBe(
      ordinary(DIFFICULTY_POINTS.hard, 1_014_000) * 2,
    );
    expect(await delta(scored(imageQuestion, 3, endsAt))).toBe(ordinary(IMAGE_MCQ_POINTS, endsAt) * 3);

    const wrong = scored(easyQuestion, 4, easyAt);
    wrong.answers['0']['p1'].choice = (wrong.answers['0']['p1'].choice + 1) % 4;
    expect(await delta(wrong)).toBe(0);
    expect(await delta(scored(easyQuestion, 3, easyAt, {
      powerUps: { p1: { used: {}, eliminated: {}, probes: {}, locked: { '0': { blank: true } } } },
    }))).toBe(0);

    const correct = shuffledOptionsForQuestion(
      ['A', 'B', 'C', 'D'],
      sampleQuestion.correctIndex,
      'ROOM01',
      sampleQuestion.id,
      0,
    ).displayCorrect;
    expect(await delta(scored(sampleQuestion, 2, endsAt, {
      answers: {},
      powerUps: {
        p1: {
          used: {},
          eliminated: {},
          probes: { '0': { choice: correct, correct: true } },
          locked: {},
        },
      },
    }))).toBe(ordinary(DIFFICULTY_POINTS.hard, endsAt) * 2);
    expect(await delta(scored(sampleQuestion, 4, endsAt, {
      answers: {},
      powerUps: {
        p1: {
          used: {},
          eliminated: {},
          probes: { '0': { choice: (correct + 1) % 4, correct: false } },
          locked: {},
        },
      },
    }))).toBe(0);
  });

  it('does not permanently suppress reveal after an atomic write fails', async () => {
    const room = questionRoom();
    claimHost(service);
    vi.mocked(get).mockResolvedValue({ exists: () => true, val: () => roomSnapshot(room) } as never);
    vi.mocked(update).mockRejectedValueOnce(new Error('permission_denied')).mockResolvedValue(undefined);
    await expect(service.reveal('ROOM01')).rejects.toThrow('permission_denied');
    await service.reveal('ROOM01');
    expect(update).toHaveBeenCalledTimes(2);
  });

  it('blocks Double it games for older phones before starting', async () => {
    const room = questionRoom();
    room.config.powerUpSlots = ['double_it', null, null];
    claimHost(service);
    vi.mocked(get).mockResolvedValue({ exists: () => true, val: () => roomSnapshot(room) } as never);
    await expect(service.startGame('ROOM01')).rejects.toThrow('DOUBLE_IT_UPDATE_REQUIRED');
    expect(update).not.toHaveBeenCalled();
  });

  it('commits a boost and slot together, then ignores a repeated delivery', async () => {
    const room = questionRoom({ roundId: 'round-a', totalQuestions: 3 });
    room.config.powerUpSlots = ['double_it', null, null];
    room.powerUpRequests = { p1: { slot: 0, type: 'double_it', questionIndex: 0, at: 1_000_000, roundId: 'round-a' } };
    const raw = roomSnapshot(room);
    claimHost(service);
    vi.mocked(get).mockImplementation(async () => ({ exists: () => true, val: () => raw }) as never);
    vi.mocked(update).mockImplementation(async (_ref, changes) => {
      for (const [path, value] of Object.entries(changes)) {
        const parts = path.split('/');
        let cursor = raw as Record<string, any>;
        for (const key of parts.slice(0, -1)) cursor = cursor[key] ??= {};
        if (value === null) delete cursor[parts.at(-1)!];
        else cursor[parts.at(-1)!] = value;
      }
    });
    const internal = service as unknown as { resolvePowerUps(code: string, room: RoomState): Promise<void> };
    const original = structuredClone(room);
    await internal.resolvePowerUps('ROOM01', original);
    await internal.resolvePowerUps('ROOM01', original);
    expect(update).toHaveBeenCalledTimes(1);
    const patch = vi.mocked(update).mock.calls[0][1] as Record<string, unknown>;
    expect(patch['powerUps/p1/used/0']).toBe(0);
    expect(patch['questionBoosts/1/p1']).toMatchObject({ roundId: 'round-a', sourceIndex: 0, slot: 0 });
  });

  it('reveal is idempotent for the same question index', async () => {
    const room = questionRoom();
    claimHost(service, 'ROOM01');
    vi.mocked(get).mockResolvedValue({
      exists: () => true,
      val: () => roomSnapshot(room),
    } as never);

    await service.reveal('ROOM01');
    await service.reveal('ROOM01');

    expect(update).toHaveBeenCalledTimes(1);
  });

  it('timed reveal awards lower speed bonus for a late final answer', async () => {
    const room = questionRoom();
    claimHost(service, 'ROOM01');
    vi.mocked(get).mockResolvedValue({
      exists: () => true,
      val: () => roomSnapshot(room),
    } as never);

    await service.reveal('ROOM01');

    const patch = vi.mocked(update).mock.calls.at(-1)?.[1] as Record<string, unknown>;
    const delta = (patch['lastScoreDeltas'] as Record<string, number>)['p1'];
    expect(delta).toBe(timedDelta(1_014_000, 1_015_000, 15_000));
  });

  it('timed reveal awards higher speed bonus for an early kept answer', async () => {
    const room = questionRoom({
      answers: {
        '0': {
          p1: {
            choice: questionRoom().answers['0']['p1'].choice,
            answeredAt: 1_001_000,
          },
        },
      },
    });
    claimHost(service, 'ROOM01');
    vi.mocked(get).mockResolvedValue({
      exists: () => true,
      val: () => roomSnapshot(room),
    } as never);

    await service.reveal('ROOM01');

    const patch = vi.mocked(update).mock.calls.at(-1)?.[1] as Record<string, unknown>;
    const delta = (patch['lastScoreDeltas'] as Record<string, number>)['p1'];
    const lateDelta = timedDelta(1_014_000, 1_015_000, 15_000);
    expect(delta).toBe(timedDelta(1_001_000, 1_015_000, 15_000));
    expect(delta).toBeGreaterThan(lateDelta);
  });

  it('startGame skips rewriting an already-live question', async () => {
    const room = questionRoom();
    claimHost(service, 'ROOM01');
    vi.mocked(get).mockResolvedValue({
      exists: () => true,
      val: () => roomSnapshot(room),
    } as never);

    await service.startGame('ROOM01');

    expect(update).not.toHaveBeenCalled();
  });

  it('startGame stamps the lobby language before publishing the first question', async () => {
    const room = questionRoom({
      phase: 'lobby',
      currentIndex: -1,
      currentQuestion: null,
    });
    claimHost(service, 'ROOM01');
    let reads = 0;
    vi.mocked(get).mockImplementation(async () => {
      reads += 1;
      const snap =
        reads === 1
          ? roomSnapshot(room)
          : roomSnapshot({
              ...room,
              config: { ...room.config, language: 'bs' },
            });
      return { exists: () => true, val: () => snap } as never;
    });

    await service.startGame('ROOM01', 'bs');

    const patches = vi.mocked(update).mock.calls.map((c) => c[1] as Record<string, unknown>);
    expect(patches[0]).toEqual({ 'config/language': 'bs' });
    expect((patches[1]['currentQuestion'] as { prompt: string }).prompt).toBe('Pitanje?');
  });
});
