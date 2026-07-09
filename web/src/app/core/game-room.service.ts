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
  QUESTION_TIMER_MS,
} from '../../data/questions/types';
import type { Lang } from '../../i18n/types';
import { FirebaseService } from './firebase.service';
import { QuestionBankService } from './question-bank.service';
import { RoundGeneratorService } from './round-generator.service';
import {
  PLAYER_COLORS,
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
  readonly usingLocalFallback = signal(false);

  private unsubscribe: Unsubscribe | null = null;
  private localRooms = new Map<string, RoomState>();
  private roundQuestions = new Map<string, Question[]>();

  get isLive(): boolean {
    return this.firebase.configured;
  }

  async createRoom(config: RoomConfig): Promise<string> {
    const questions = this.generator.generate(config.categories, config.roundLength);
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
      players: {},
      answers: {},
      questionIds: questions.map((q) => q.id),
    };

    this.roundQuestions.set(code, questions);

    if (this.firebase.configured && this.firebase.db) {
      this.usingLocalFallback.set(false);
      await set(ref(this.firebase.db, `rooms/${code}`), this.toFirebase(state));
    } else {
      this.usingLocalFallback.set(true);
      this.localRooms.set(code, state);
    }

    await this.watchRoom(code);
    return code;
  }

  async watchRoom(code: string): Promise<void> {
    this.stopWatching();

    if (this.firebase.configured && this.firebase.db) {
      const roomRef = ref(this.firebase.db, `rooms/${code}`);
      this.unsubscribe = onValue(roomRef, (snap) => {
        const raw = snap.val();
        if (!raw) {
          this.room.set(null);
          return;
        }
        this.room.set(this.fromFirebase(code, raw));
      });
      return;
    }

    const local = this.localRooms.get(code) ?? null;
    this.room.set(local ? structuredClone(local) : null);
  }

  stopWatching(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
  }

  async addPlayer(code: string, name: string, isBot = false): Promise<RoomPlayer> {
    const room = await this.requireRoom(code);
    const uniqueName = this.uniqueName(room, name.trim() || 'Player');
    const id = `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const color = PLAYER_COLORS[Object.keys(room.players).length % PLAYER_COLORS.length];
    const player: RoomPlayer = {
      id,
      name: uniqueName,
      score: 0,
      color,
      isBot,
      joinedAt: Date.now(),
    };

    await this.patch(code, { [`players/${id}`]: player });
    return player;
  }

  async addTestPlayers(code: string): Promise<void> {
    const names = ['Ana', 'Marko', 'Sara', 'Luka'];
    for (const name of names) {
      await this.addPlayer(code, name, true);
    }
  }

  async submitAnswer(
    code: string,
    playerId: string,
    choice: number,
  ): Promise<void> {
    const room = await this.requireRoom(code);
    if (room.phase !== 'question' || room.currentIndex < 0) return;

    const qKey = String(room.currentIndex);
    const existing = room.answers[qKey]?.[playerId];
    if (existing) return;

    const answer: PlayerAnswer = { choice, answeredAt: Date.now() };
    await this.patch(code, { [`answers/${qKey}/${playerId}`]: answer });
  }

  async startGame(code: string): Promise<void> {
    const room = await this.requireRoom(code);
    if (Object.keys(room.players).length === 0) {
      throw new Error('NO_PLAYERS');
    }
    await this.showQuestion(code, 0);
  }

  async nextQuestion(code: string): Promise<void> {
    const room = await this.requireRoom(code);
    const next = room.currentIndex + 1;
    if (next >= room.totalQuestions) {
      await this.patch(code, {
        phase: 'finished',
        currentQuestion: null,
        correctIndex: null,
      });
      return;
    }
    await this.showQuestion(code, next);
  }

  async reveal(code: string): Promise<void> {
    const room = await this.requireRoom(code);
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
        const start = endsAt - duration;
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
      lastScoreDeltas: deltas,
      ...playerUpdates,
    });
  }

  async endGame(code: string): Promise<void> {
    await this.patch(code, {
      phase: 'finished',
      currentQuestion: null,
      correctIndex: null,
    });
  }

  async deleteRoom(code: string): Promise<void> {
    this.stopWatching();
    this.roundQuestions.delete(code);
    if (this.firebase.configured && this.firebase.db) {
      await remove(ref(this.firebase.db, `rooms/${code}`));
    } else {
      this.localRooms.delete(code);
    }
    this.room.set(null);
  }

  /** Auto-answer bots with slight delay during question phase */
  async runBots(code: string): Promise<void> {
    const room = await this.requireRoom(code);
    if (room.phase !== 'question' || !room.currentQuestion) return;

    const questions = await this.getRoundQuestions(code, room);
    const question = questions[room.currentIndex];
    if (!question) return;

    const bots = Object.values(room.players).filter((p) => p.isBot);
    for (const bot of bots) {
      const delay = 800 + Math.random() * 4000;
      window.setTimeout(() => {
        const smart = Math.random() > 0.35;
        const choice = smart
          ? question.correctIndex
          : Math.floor(Math.random() * 4);
        void this.submitAnswer(code, bot.id, choice);
      }, delay);
    }
  }

  private async showQuestion(code: string, index: number): Promise<void> {
    const room = await this.requireRoom(code);
    const questions = await this.getRoundQuestions(code, room);
    const question = questions[index];
    if (!question) return;

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
      imageUrl: question.image
        ? question.image.startsWith('http')
          ? question.image
          : `/${question.image}`
        : undefined,
      endsAt: Date.now() + durationMs,
      durationMs,
      index,
      total: questions.length,
    };

    await this.patch(code, {
      phase: 'question',
      currentIndex: index,
      currentQuestion: publicQ,
      correctIndex: null,
      lastScoreDeltas: null,
    });
  }

  private async getRoundQuestions(code: string, room: RoomState): Promise<Question[]> {
    const cached = this.roundQuestions.get(code);
    if (cached) return cached;

    // Rebuild from ids if host refreshed (local bank only).
    const all = this.bank.getAll();
    const rebuilt = room.questionIds
      .map((id) => all.find((q) => q.id === id))
      .filter((q): q is Question => !!q);
    this.roundQuestions.set(code, rebuilt);
    return rebuilt;
  }

  private async requireRoom(code: string): Promise<RoomState> {
    const current = this.room()?.code === code ? this.room() : null;
    if (current) return current;

    if (this.firebase.configured && this.firebase.db) {
      const snap = await get(ref(this.firebase.db, `rooms/${code}`));
      if (!snap.exists()) throw new Error('NOT_FOUND');
      const state = this.fromFirebase(code, snap.val());
      this.room.set(state);
      return state;
    }

    const local = this.localRooms.get(code);
    if (!local) throw new Error('NOT_FOUND');
    this.room.set(structuredClone(local));
    return local;
  }

  private async patch(code: string, data: Record<string, unknown>): Promise<void> {
    if (this.firebase.configured && this.firebase.db) {
      await update(ref(this.firebase.db, `rooms/${code}`), data);
      return;
    }

    const room = this.localRooms.get(code);
    if (!room) throw new Error('NOT_FOUND');

    for (const [path, value] of Object.entries(data)) {
      this.setPath(room as unknown as Record<string, unknown>, path, value);
    }
    this.localRooms.set(code, room);
    this.room.set(structuredClone(room));
  }

  private setPath(obj: Record<string, unknown>, path: string, value: unknown): void {
    const parts = path.split('/');
    let cursor: Record<string, unknown> = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      const key = parts[i];
      if (cursor[key] == null || typeof cursor[key] !== 'object') {
        cursor[key] = {};
      }
      cursor = cursor[key] as Record<string, unknown>;
    }
    const last = parts[parts.length - 1];
    if (value === null) {
      delete cursor[last];
    } else {
      cursor[last] = value;
    }
  }

  private uniqueName(room: RoomState, name: string): string {
    const names = new Set(Object.values(room.players).map((p) => p.name.toLowerCase()));
    if (!names.has(name.toLowerCase())) return name;
    let i = 2;
    while (names.has(`${name}${i}`.toLowerCase())) i++;
    return `${name}${i}`;
  }

  private async allocateCode(): Promise<string> {
    for (let attempt = 0; attempt < 12; attempt++) {
      const code = this.randomCode();
      if (this.firebase.configured && this.firebase.db) {
        const snap = await get(ref(this.firebase.db, `rooms/${code}`));
        if (!snap.exists()) return code;
      } else if (!this.localRooms.has(code)) {
        return code;
      }
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
      players: state.players,
      answers: state.answers,
      questionIds: state.questionIds,
      lastScoreDeltas: state.lastScoreDeltas ?? null,
    };
  }

  private fromFirebase(code: string, raw: Record<string, unknown>): RoomState {
    return {
      code,
      phase: (raw['phase'] as RoomState['phase']) ?? 'lobby',
      config: raw['config'] as RoomConfig,
      createdAt: Number(raw['createdAt'] ?? Date.now()),
      currentIndex: Number(raw['currentIndex'] ?? -1),
      totalQuestions: Number(raw['totalQuestions'] ?? 0),
      currentQuestion: (raw['currentQuestion'] as PublicQuestion) ?? null,
      correctIndex:
        raw['correctIndex'] === undefined || raw['correctIndex'] === null
          ? null
          : Number(raw['correctIndex']),
      players: (raw['players'] as Record<string, RoomPlayer>) ?? {},
      answers: (raw['answers'] as Record<string, Record<string, PlayerAnswer>>) ?? {},
      questionIds: (raw['questionIds'] as string[]) ?? [],
      lastScoreDeltas: (raw['lastScoreDeltas'] as Record<string, number>) ?? undefined,
    };
  }
}
