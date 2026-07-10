import { Injectable, inject, signal } from '@angular/core';
import {
  get,
  onDisconnect,
  onValue,
  ref,
  remove,
  set,
  update,
  type OnDisconnect,
  type Unsubscribe,
} from 'firebase/database';
import type { Question } from '../../data/questions/types';
import { DIFFICULTY_POINTS } from '../../data/questions/types';
import { FirebaseService } from './firebase.service';
import { QuestionBankService } from './question-bank.service';
import { RoundGeneratorService } from './round-generator.service';
import {
  shuffleInPlace,
  stripUndefined,
  AVATAR_COUNT,
  clampQuestionSeconds,
  type LastWinner,
  type PlayerAnswer,
  type PublicQuestion,
  type RoomConfig,
  type RoomPlayer,
  type RoomState,
  type ScoringMode,
} from './room.models';

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const LAST_HOSTED_CODE_KEY = 'quivro.lastHostedCode';

@Injectable({ providedIn: 'root' })
export class GameRoomService {
  private readonly firebase = inject(FirebaseService);
  private readonly generator = inject(RoundGeneratorService);
  private readonly bank = inject(QuestionBankService);

  readonly room = signal<RoomState | null>(null);

  private unsubscribe: Unsubscribe | null = null;
  private roundQuestions = new Map<string, Question[]>();
  /** Shuffled correct index per question for each room */
  private displayCorrect = new Map<string, number[]>();
  /** Room code this browser is hosting (for leave / onDisconnect cleanup). */
  private hostedCode: string | null = null;
  private disconnectOp: OnDisconnect | null = null;

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
    await this.deletePreviousHostedRoom();
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
      players: {},
      answers: {},
      questionIds: questions.map((q) => q.id),
      lastWinner: null,
      rematchReady: {},
    };

    this.roundQuestions.set(code, questions);
    this.displayCorrect.set(code, []);
    await set(ref(db, `rooms/${code}`), stripUndefined(this.toFirebase(state)));
    await this.armHostDisconnect(code);
    this.persistLastHostedCode(code);
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
    await this.showQuestion(code, 0);
  }

  async nextAfterReveal(code: string): Promise<void> {
    const room = await this.requireRoom(code);
    const next = room.currentIndex + 1;
    if (next >= room.totalQuestions) {
      await this.finishRound(code);
      return;
    }
    await this.showQuestion(code, next);
  }

  async reveal(code: string): Promise<void> {
    const room = await this.requireRoom(code);
    if (room.phase !== 'question') return;

    const questions = await this.getRoundQuestions(code, room);
    const question = questions[room.currentIndex];
    if (!question) return;

    const correctIndex =
      this.displayCorrect.get(code)?.[room.currentIndex] ?? question.correctIndex;

    const qKey = String(room.currentIndex);
    const answers = room.answers[qKey] ?? {};
    const scoringMode = room.config.scoringMode ?? 'timed';
    const duration =
      room.currentQuestion?.durationMs ??
      clampQuestionSeconds(room.config.questionSeconds ?? 15) * 1000;
    const endsAt = room.currentQuestion?.endsAt ?? Date.now();
    const base = DIFFICULTY_POINTS[question.difficulty];
    const deltas: Record<string, number> = {};
    const playerUpdates: Record<string, number> = {};

    for (const [playerId, player] of Object.entries(room.players)) {
      const ans = answers[playerId];
      let delta = 0;
      if (ans && ans.choice === correctIndex) {
        if (scoringMode === 'standard') {
          delta = 1;
        } else {
          const answeredAt = Math.min(ans.answeredAt, endsAt);
          const timeLeft = Math.max(0, endsAt - answeredAt);
          const speed = timeLeft / duration;
          delta = Math.round(base * (0.4 + 0.6 * speed));
        }
      }
      deltas[playerId] = delta;
      playerUpdates[`players/${playerId}/score`] = player.score + delta;
    }

    await this.patch(code, {
      phase: 'reveal',
      correctIndex,
      lastScoreDeltas: deltas,
      ...playerUpdates,
    });
  }

  async endGame(code: string): Promise<void> {
    // Host quit mid-round — show finished screen without awarding a win.
    await this.finishRound(code, false);
  }

  async rematch(code: string, nextConfig?: RoomConfig): Promise<void> {
    const room = await this.fetchFreshRoom(code);
    // Wins already applied in finishRound; keep lastWinner and reset round state.
    const config: RoomConfig = nextConfig
      ? {
          categories: nextConfig.categories,
          questionTypes: nextConfig.questionTypes,
          roundLength: nextConfig.roundLength,
          language: nextConfig.language ?? room.config.language,
          scoringMode: nextConfig.scoringMode ?? room.config.scoringMode ?? 'timed',
          questionSeconds: clampQuestionSeconds(
            nextConfig.questionSeconds ?? room.config.questionSeconds ?? 15,
          ),
        }
      : room.config;

    const playerUpdates: Record<string, unknown> = {};
    for (const id of Object.keys(room.players)) {
      playerUpdates[`players/${id}/score`] = 0;
    }

    const questions = this.generator.generate(
      config.categories,
      config.roundLength,
      config.questionTypes,
    );
    if (questions.length === 0) {
      throw new Error('NO_QUESTIONS');
    }

    this.roundQuestions.set(code, questions);
    this.displayCorrect.set(code, []);

    const db = this.requireDb();
    await remove(ref(db, `rooms/${code}/answers`));
    await remove(ref(db, `rooms/${code}/rematchReady`));

    await this.patch(code, {
      config,
      currentIndex: -1,
      totalQuestions: questions.length,
      currentQuestion: null,
      correctIndex: null,
      lastScoreDeltas: null,
      rematchReady: null,
      questionIds: questions.map((q) => q.id),
      lastWinner: room.lastWinner,
      ...playerUpdates,
    });

    // Jump straight into the next round (skip lobby).
    await this.showQuestion(code, 0);
  }

  async deleteRoom(code: string): Promise<void> {
    await this.cancelHostDisconnect();
    this.stopWatching();
    this.roundQuestions.delete(code);
    this.displayCorrect.delete(code);
    this.hostedCode = null;
    this.clearLastHostedCode(code);
    const db = this.requireDb();
    await remove(ref(db, `rooms/${code}`));
    this.room.set(null);
  }

  /** Host leaves lobby/play or closes the tab — tear down the room for all players. */
  async leaveHostedRoom(code?: string): Promise<void> {
    const c = (code ?? this.hostedCode)?.toUpperCase();
    if (!c || !this.hostedCode) {
      this.stopWatching();
      return;
    }
    if (this.hostedCode !== c) {
      this.stopWatching();
      return;
    }
    try {
      await this.deleteRoom(c);
    } catch (e) {
      console.error(e);
      this.stopWatching();
      this.hostedCode = null;
      this.clearLastHostedCode(c);
      this.room.set(null);
    }
  }

  get isHosting(): boolean {
    return this.hostedCode != null;
  }

  /** Drop the previous room this browser hosted so Firebase does not accumulate orphans. */
  private async deletePreviousHostedRoom(): Promise<void> {
    const previous = this.hostedCode ?? this.readLastHostedCode();
    if (!previous) return;
    try {
      if (this.hostedCode === previous) {
        await this.deleteRoom(previous);
      } else {
        const db = this.requireDb();
        await remove(ref(db, `rooms/${previous}`));
        this.clearLastHostedCode(previous);
      }
    } catch (e) {
      console.error(e);
      this.clearLastHostedCode(previous);
    }
  }

  private readLastHostedCode(): string | null {
    try {
      const code = localStorage.getItem(LAST_HOSTED_CODE_KEY)?.trim().toUpperCase();
      return code || null;
    } catch {
      return null;
    }
  }

  private persistLastHostedCode(code: string): void {
    try {
      localStorage.setItem(LAST_HOSTED_CODE_KEY, code);
    } catch {
      /* ignore quota / private mode */
    }
  }

  private clearLastHostedCode(code?: string): void {
    try {
      if (!code) {
        localStorage.removeItem(LAST_HOSTED_CODE_KEY);
        return;
      }
      const stored = localStorage.getItem(LAST_HOSTED_CODE_KEY)?.trim().toUpperCase();
      if (!stored || stored === code.toUpperCase()) {
        localStorage.removeItem(LAST_HOSTED_CODE_KEY);
      }
    } catch {
      /* ignore */
    }
  }

  private async armHostDisconnect(code: string): Promise<void> {
    await this.cancelHostDisconnect();
    const db = this.requireDb();
    const roomRef = ref(db, `rooms/${code}`);
    this.disconnectOp = onDisconnect(roomRef);
    await this.disconnectOp.remove();
    this.hostedCode = code;
  }

  private async cancelHostDisconnect(): Promise<void> {
    if (!this.disconnectOp) return;
    try {
      await this.disconnectOp.cancel();
    } catch {
      /* ignore — connection may already be gone */
    }
    this.disconnectOp = null;
  }

  private async finishRound(code: string, awardWin = true): Promise<void> {
    const room = await this.requireRoom(code);
    if (room.phase === 'finished') return;

    const winner = awardWin ? this.pickWinner(room.players) : null;
    const updates: Record<string, unknown> = {
      phase: 'finished',
      currentQuestion: null,
      correctIndex: null,
      lastWinner: winner,
      rematchReady: null,
    };
    if (awardWin && winner) {
      const current = room.players[winner.playerId];
      if (current) {
        updates[`players/${winner.playerId}/wins`] = (current.wins ?? 0) + 1;
      }
    }
    await this.patch(code, updates);
  }

  private pickWinner(players: Record<string, RoomPlayer>): LastWinner | null {
    const list = Object.values(players);
    if (list.length === 0) return null;
    const sorted = [...list].sort(
      (a, b) => b.score - a.score || a.name.localeCompare(b.name),
    );
    const top = sorted[0];
    return { playerId: top.id, name: top.name, avatar: top.avatar };
  }

  private async showQuestion(code: string, index: number): Promise<void> {
    const room = await this.requireRoom(code);
    const questions = await this.getRoundQuestions(code, room);
    const question = questions[index];
    if (!question) {
      throw new Error('NO_QUESTIONS');
    }

    const lang = room.config.language;
    const durationMs = clampQuestionSeconds(room.config.questionSeconds ?? 15) * 1000;

    const optionPairs = [0, 1, 2, 3].map((i) => ({
      text: question.options[i][lang],
      originalIndex: i,
    }));
    shuffleInPlace(optionPairs);
    const displayCorrect = optionPairs.findIndex(
      (o) => o.originalIndex === question.correctIndex,
    );

    const corrects = this.displayCorrect.get(code) ?? [];
    corrects[index] = displayCorrect;
    this.displayCorrect.set(code, corrects);

    const publicQ: PublicQuestion = {
      id: question.id,
      type: question.type,
      category: question.category,
      difficulty: question.difficulty,
      prompt: question.prompt[lang],
      options: [
        optionPairs[0].text,
        optionPairs[1].text,
        optionPairs[2].text,
        optionPairs[3].text,
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
      players: state.players,
      answers: state.answers,
      questionIds: state.questionIds,
      lastScoreDeltas: state.lastScoreDeltas ?? null,
      lastWinner: state.lastWinner,
      rematchReady: state.rematchReady,
    };
  }

  private normalizePlayer(id: string, raw: Record<string, unknown>): RoomPlayer {
    const avatarRaw = Number(raw['avatar'] ?? 0);
    return {
      id: String(raw['id'] ?? id),
      name: String(raw['name'] ?? 'Player'),
      score: Number(raw['score'] ?? 0),
      avatar: Number.isFinite(avatarRaw)
        ? ((avatarRaw % AVATAR_COUNT) + AVATAR_COUNT) % AVATAR_COUNT
        : 0,
      joinedAt: Number(raw['joinedAt'] ?? Date.now()),
      wins: Number(raw['wins'] ?? 0),
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
    const scoringRaw = String(configRaw['scoringMode'] ?? 'timed');
    const scoringMode: ScoringMode =
      scoringRaw === 'standard' ? 'standard' : 'timed';

    const lw = raw['lastWinner'];
    let lastWinner: LastWinner | null = null;
    if (lw && typeof lw === 'object') {
      const o = lw as Record<string, unknown>;
      lastWinner = {
        playerId: String(o['playerId'] ?? ''),
        name: String(o['name'] ?? ''),
        avatar: Number(o['avatar'] ?? 0),
      };
    }

    return {
      code,
      phase: (raw['phase'] as RoomState['phase']) ?? 'lobby',
      config: {
        categories: (configRaw['categories'] as RoomConfig['categories']) ?? [],
        questionTypes,
        roundLength: Number(configRaw['roundLength'] ?? 12),
        language: (configRaw['language'] as RoomConfig['language']) ?? 'en',
        scoringMode,
        questionSeconds: clampQuestionSeconds(Number(configRaw['questionSeconds'] ?? 15)),
      },
      createdAt: Number(raw['createdAt'] ?? Date.now()),
      currentIndex: Number(raw['currentIndex'] ?? -1),
      totalQuestions: Number(raw['totalQuestions'] ?? 0),
      currentQuestion: (raw['currentQuestion'] as PublicQuestion) ?? null,
      correctIndex:
        raw['correctIndex'] === undefined || raw['correctIndex'] === null
          ? null
          : Number(raw['correctIndex']),
      players,
      answers: (raw['answers'] as Record<string, Record<string, PlayerAnswer>>) ?? {},
      questionIds: (raw['questionIds'] as string[]) ?? [],
      lastScoreDeltas: (raw['lastScoreDeltas'] as Record<string, number>) ?? undefined,
      lastWinner,
      rematchReady: (raw['rematchReady'] as Record<string, boolean>) ?? {},
    };
  }
}
