import { TestBed } from '@angular/core/testing';
import { remove, ref } from 'firebase/database';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FirebaseService } from './firebase.service';
import { GameRoomService } from './game-room.service';
import { QuestionBankService } from './question-bank.service';
import { RoundGeneratorService } from './round-generator.service';
import { ServerTimeService } from './server-time.service';

const LAST_HOSTED_CODE_KEY = 'quivro.lastHostedCode';

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
          useValue: { getAll: () => [] },
        },
        {
          provide: RoundGeneratorService,
          useValue: { generate: () => [] },
        },
        {
          provide: ServerTimeService,
          useValue: { nowMs: () => Date.now() },
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
});
