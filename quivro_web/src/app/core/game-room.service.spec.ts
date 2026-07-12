import { TestBed } from '@angular/core/testing';
import { get, remove, ref, update } from 'firebase/database';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Question } from '../../data/questions/types';
import { FirebaseService } from './firebase.service';
import { GameRoomService } from './game-room.service';
import { QuestionBankService } from './question-bank.service';
import { RoundGeneratorService } from './round-generator.service';
import { ServerTimeService } from './server-time.service';
import type { RoomState } from './room.models';

const LAST_HOSTED_CODE_KEY = 'quivro.lastHostedCode';

const localStorageMock = (() => {
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
})();

vi.stubGlobal('localStorage', localStorageMock);

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
  return {
    code: 'ROOM01',
    phase: 'question',
    config: {
      categories: ['biology'],
      questionTypes: ['mcq'],
      roundLength: 1,
      language: 'en',
      scoringMode: 'standard',
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
      endsAt: 2_000_000,
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
        p1: { choice: 2, answeredAt: 1_500_000 },
      },
    },
    questionIds: [sampleQuestion.id],
    lastWinners: [],
    rematchReady: {},
    ...overrides,
  };
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
  });

  it('leaveHostedRoom deletes when only lastHostedCode is available', async () => {
    localStorage.setItem(LAST_HOSTED_CODE_KEY, 'ROOM01');

    await service.leaveHostedRoom('ROOM01');

    expect(ref).toHaveBeenCalledWith(mockDb, 'rooms/ROOM01');
    expect(remove).toHaveBeenCalled();
    expect(service.room()).toBeNull();
    expect(localStorage.getItem(LAST_HOSTED_CODE_KEY)).toBeNull();
  });

  it('leaveHostedRoom does not delete unrelated rooms', async () => {
    localStorage.setItem(LAST_HOSTED_CODE_KEY, 'ROOM01');

    await service.leaveHostedRoom('OTHER2');

    expect(remove).not.toHaveBeenCalled();
  });

  it('reveal is idempotent for the same question index', async () => {
    const room = questionRoom();
    vi.mocked(get).mockResolvedValue({
      exists: () => true,
      val: () => ({
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
      }),
    } as never);

    await service.reveal('ROOM01');
    await service.reveal('ROOM01');

    expect(update).toHaveBeenCalledTimes(1);
  });

  it('startGame skips rewriting an already-live question', async () => {
    const room = questionRoom();
    vi.mocked(get).mockResolvedValue({
      exists: () => true,
      val: () => ({
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
      }),
    } as never);

    await service.startGame('ROOM01');

    expect(update).not.toHaveBeenCalled();
  });
});
