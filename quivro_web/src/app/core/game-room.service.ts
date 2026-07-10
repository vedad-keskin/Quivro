import { Injectable, inject, signal } from '@angular/core';
import {
  get,
  onValue,
  ref,
  remove,
  set,
  update,
  type Unsubscribe,
} from 'firebase/database';
import type { Question } from '../../data/questions/types';
import {
  DIFFICULTY_POINTS,
  PREPARE_MS,
  QUESTION_TIMER_MS,
} from '../../data/questions/types';
import { FirebaseService } from './firebase.service';
import { QuestionBankService } from './question-bank.service';
import { RoundGeneratorService } from './round-generator.service';
import {
  stripUndefined,
  type PlayerAnswer,
  type PublicQuestion,
  type RoomConfig,
  type RoomPlayer,
  type RoomState,
} from './room.models';

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

@Injectable({ providedIn: 'root' })
export class GameRoomService {
  private readonly firebase = inject(FirebaseService);
  private readonly generator = inject(RoundGeneratorService);
  private readonly bank = inject(QuestionBankService);

  readonly room = signal<RoomState | null>(null);

  private unsubscribe: Unsubscribe | null = null;
  private roundQuestions = new Map<string, Question[]>();

  get isLive(): boolean {
    return this.firebase.configured;
  }

  private requireDb() {
    if (!this.firebase.configured || !this.firebase.db) {
      throw new Error('FIREBASE_REQUIRED');
    }
    return this.firebase.db;
  }

  async createRoom(config: RoomConfig): Promise<string> {
    const db = this.requireDb();
    const questions = this.generator.generate(
      config.categories,
      config.roundLength,
      config.questionTypes,
    );
    if (questions.length === 0) {
      throw new Error('NO_QUESTIONS');
    }
    const code = await this.allocateCode();
    const state: RoomState = {
      code,
      phase: 'lobby',
      config,
      createdAt: Date.now(),
      currentIndex: -1,
      totalQuestions: questions.length,
      currentQuestion: null,
      correctIndex: null,
      prepareEndsAt: null,
      players: {},
      answers: {},
      questionIds: questions.map((q) => q.id),
    };

    this.roundQuestions.set(code, questions);
    await set(ref(db, `rooms/${code}`), stripUndefined(this.toFirebase(state)));
    await this.watchRoom(code);
    return code;
  }

  async watchRoom(code: string): Promise<void> {
    this.stopWatching();
    const db = this.requireDb();
    const roomRef = ref(db, `rooms/${code}`);
    this.unsubscribe = onValue(roomRef, (snap) => {
      const raw = snap.val();
      if (!raw) {
        this.room.set(null);
        return;
      }
      this.room.set(this.fromFirebase(code, raw));
    });
  }

  stopWatching(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
  }

  async startGame(code: string): Promise<void> {
    const room = await this.fetchFreshRoom(code);
    if (Object.keys(room.players).length === 0) {
      throw new Error('NO_PLAYERS');
    }
    await this.beginPrepare(code, 0);
  }

  async beginPrepare(code: string, index: number): Promise<void> {
    const room = await this.requireRoom(code);
    if (index >= room.totalQuestions) {
      await this.patch(code, {
        phase: 'finished',
        currentQuestion: null,
        correctIndex: null,
        prepareEndsAt: null,
      });
      return;
    }

    await this.patch(code, {
      phase: 'prepare',
      currentIndex: index,
      prepareEndsAt: Date.now() + PREPARE_MS,
      currentQuestion: null,
      correctIndex: null,
      lastScoreDeltas: null,
    });
  }

  async startPreparedQuestion(code: string): Promise<void> {
    const room = await this.requireRoom(code);
    if (room.phase !== 'prepare') return;
    const index = room.currentIndex < 0 ? 0 : room.currentIndex;
    await this.showQuestion(code, index);
  }

  async nextAfterReveal(code: string): Promise<void> {
    const room = await this.requireRoom(code);
    const next = room.currentIndex + 1;
    if (next >= room.totalQuestions) {
      await this.patch(code, {
        phase: 'finished',
        currentQuestion: null,
        correctIndex: null,
        prepareEndsAt: null,
      });
      return;
    }
    await this.beginPrepare(code, next);
  }

  async reveal(code: string): Promise<void> {
    const room = await this.requireRoom(code);
    if (room.phase !== 'question') return;

    const questions = await this.getRoundQuestions(code, room);
    const question = questions[room.currentIndex];
    if (!question) return;

    const qKey = String(room.currentIndex);
    const answers = room.answers[qKey] ?? {};
    const duration = QUESTION_TIMER_MS[question.type];
    const endsAt = room.currentQuestion?.endsAt ?? Date.now();
    const base = DIFFICULTY_POINTS[question.difficulty];
    const deltas: Record<string, number> = {};
    const playerUpdates: Record<string, number> = {};

    for (const [playerId, player] of Object.entries(room.players)) {
      const ans = answers[playerId];
      let delta = 0;
      if (ans && ans.choice === question.correctIndex) {
        const answeredAt = Math.min(ans.answeredAt, endsAt);
        const timeLeft = Math.max(0, endsAt - answeredAt);
        const speed = timeLeft / duration;
        delta = Math.round(base * (0.4 + 0.6 * speed));
      }
      deltas[playerId] = delta;
      playerUpdates[`players/${playerId}/score`] = player.score + delta;
    }

    await this.patch(code, {
      phase: 'reveal',
      correctIndex: question.correctIndex,
      prepareEndsAt: null,
      lastScoreDeltas: deltas,
      ...playerUpdates,
    });
  }

  async endGame(code: string): Promise<void> {
    await this.patch(code, {
      phase: 'finished',
      currentQuestion: null,
      correctIndex: null,
      prepareEndsAt: null,
    });
  }

  async deleteRoom(code: string): Promise<void> {
    this.stopWatching();
    this.roundQuestions.delete(code);
    const db = this.requireDb();
    await remove(ref(db, `rooms/${code}`));
    this.room.set(null);
  }

  private async showQuestion(code: string, index: number): Promise<void> {
    const room = await this.requireRoom(code);
    const questions = await this.getRoundQuestions(code, room);
    const question = questions[index];
    if (!question) {
      throw new Error('NO_QUESTIONS');
    }

    const lang = room.config.language;
    const durationMs = QUESTION_TIMER_MS[question.type];
    const publicQ: PublicQuestion = {
      id: question.id,
      type: question.type,
      category: question.category,
      difficulty: question.difficulty,
      prompt: question.prompt[lang],
      options: [
        question.options[0][lang],
        question.options[1][lang],
        question.options[2][lang],
        question.options[3][lang],
      ],
      endsAt: Date.now() + durationMs,
      durationMs,
      index,
      total: questions.length,
    };

    if (question.image) {
      publicQ.imageUrl = question.image.startsWith('http')
        ? question.image
        : `/${question.image}`;
    }

    await this.patch(code, {
      phase: 'question',
      currentIndex: index,
      currentQuestion: publicQ,
      correctIndex: null,
      prepareEndsAt: null,
      lastScoreDeltas: null,
    });
  }

  private async getRoundQuestions(code: string, room: RoomState): Promise<Question[]> {
    const cached = this.roundQuestions.get(code);
    if (cached) return cached;

    const all = this.bank.getAll();
    const rebuilt = room.questionIds
      .map((id) => all.find((q) => q.id === id))
      .filter((q): q is Question => !!q);
    this.roundQuestions.set(code, rebuilt);
    return rebuilt;
  }

  private async fetchFreshRoom(code: string): Promise<RoomState> {
    const db = this.requireDb();
    const snap = await get(ref(db, `rooms/${code}`));
    if (!snap.exists()) throw new Error('NOT_FOUND');
    const state = this.fromFirebase(code, snap.val());
    this.room.set(state);
    return state;
  }

  private async requireRoom(code: string): Promise<RoomState> {
    const current = this.room()?.code === code ? this.room() : null;
    if (current) return current;
    return this.fetchFreshRoom(code);
  }

  private async patch(code: string, data: Record<string, unknown>): Promise<void> {
    const db = this.requireDb();
    await update(ref(db, `rooms/${code}`), stripUndefined(data));
  }

  private async allocateCode(): Promise<string> {
    const db = this.requireDb();
    for (let attempt = 0; attempt < 12; attempt++) {
      const code = this.randomCode();
      const snap = await get(ref(db, `rooms/${code}`));
      if (!snap.exists()) return code;
    }
    return this.randomCode() + this.randomCode().slice(0, 2);
  }

  private randomCode(): string {
    let out = '';
    for (let i = 0; i < 6; i++) {
      out += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    }
    return out;
  }

  private toFirebase(state: RoomState): Record<string, unknown> {
    return {
      phase: state.phase,
      config: state.config,
      createdAt: state.createdAt,
      currentIndex: state.currentIndex,
      totalQuestions: state.totalQuestions,
      currentQuestion: state.currentQuestion,
      correctIndex: state.correctIndex,
      prepareEndsAt: state.prepareEndsAt,
      players: state.players,
      answers: state.answers,
      questionIds: state.questionIds,
      lastScoreDeltas: state.lastScoreDeltas ?? null,
    };
  }

  private normalizePlayer(id: string, raw: Record<string, unknown>): RoomPlayer {
    const avatarRaw = Number(raw['avatar'] ?? 0);
    return {
      id: String(raw['id'] ?? id),
      name: String(raw['name'] ?? 'Player'),
      score: Number(raw['score'] ?? 0),
      avatar: Number.isFinite(avatarRaw) ? ((avatarRaw % 8) + 8) % 8 : 0,
      joinedAt: Number(raw['joinedAt'] ?? Date.now()),
    };
  }

  private fromFirebase(code: string, raw: Record<string, unknown>): RoomState {
    const playersRaw = (raw['players'] as Record<string, Record<string, unknown>>) ?? {};
    const players: Record<string, RoomPlayer> = {};
    for (const [id, p] of Object.entries(playersRaw)) {
      players[id] = this.normalizePlayer(id, p ?? {});
    }

    const configRaw = (raw['config'] as Record<string, unknown>) ?? {};
    const questionTypes = Array.isArray(configRaw['questionTypes'])
      ? (configRaw['questionTypes'] as RoomConfig['questionTypes'])
      : (['mcq', 'image_mcq'] as RoomConfig['questionTypes']);

    return {
      code,
      phase: (raw['phase'] as RoomState['phase']) ?? 'lobby',
      config: {
        categories: (configRaw['categories'] as RoomConfig['categories']) ?? [],
        questionTypes,
        roundLength: Number(configRaw['roundLength'] ?? 12),
        language: (configRaw['language'] as RoomConfig['language']) ?? 'en',
      },
      createdAt: Number(raw['createdAt'] ?? Date.now()),
      currentIndex: Number(raw['currentIndex'] ?? -1),
      totalQuestions: Number(raw['totalQuestions'] ?? 0),
      currentQuestion: (raw['currentQuestion'] as PublicQuestion) ?? null,
      correctIndex:
        raw['correctIndex'] === undefined || raw['correctIndex'] === null
          ? null
          : Number(raw['correctIndex']),
      prepareEndsAt:
        raw['prepareEndsAt'] === undefined || raw['prepareEndsAt'] === null
          ? null
          : Number(raw['prepareEndsAt']),
      players,
      answers: (raw['answers'] as Record<string, Record<string, PlayerAnswer>>) ?? {},
      questionIds: (raw['questionIds'] as string[]) ?? [],
      lastScoreDeltas: (raw['lastScoreDeltas'] as Record<string, number>) ?? undefined,
    };
  }
}
