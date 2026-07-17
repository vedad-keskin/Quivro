import { TestBed } from '@angular/core/testing';
import { get, remove, ref, update } from 'firebase/database';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DIFFICULTY_POINTS } from '../../data/questions/types';
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
  };
}

function roomSnapshot(room: RoomState): Record<string, unknown> {
  return {
    phase: room.phase,
    config: room.config,
    createdAt: room.createdAt,
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

    await TestBed.configureTestingModule({
      providers: [
        GameRoomService,
        {
          provide: FirebaseService,
          useValue: { configured: true, db: mockDb, app: {} },
        },
        {
          provide: QuestionBankService,
          useValue: { getAll: () => [sampleQuestion] },
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
});
