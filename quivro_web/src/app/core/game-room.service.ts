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
import {
  DIFFICULTY_POINTS,
  IMAGE_MCQ_POINTS,
} from '../../data/questions/types';
import { FirebaseService } from './firebase.service';
import { QuestionBankService } from './question-bank.service';
import { RoundGeneratorService } from './round-generator.service';
import { ServerTimeService } from './server-time.service';
import {
  shuffledOptionsForQuestion,
  stripUndefined,
  AVATAR_COUNT,
  IMAGE_ANSWER_DELAY_MS,
  clampQuestionSeconds,
  rankPlayers,
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
const HOST_SESSION_KEY = 'quivro.hostSessionId';

@Injectable({ providedIn: 'root' })
export class GameRoomService {
  private readonly firebase = inject(FirebaseService);
  private readonly generator = inject(RoundGeneratorService);
  private readonly bank = inject(QuestionBankService);
  private readonly serverTime = inject(ServerTimeService);

  readonly room = signal<RoomState | null>(null);
  /** True when this browser tab owns host controls / teardown for the watched room. */
  readonly hosting = signal(false);

  private unsubscribe: Unsubscribe | null = null;
  private roundQuestions = new Map<string, Question[]>();
  /** Room code this browser tab is hosting (for leave / onDisconnect cleanup). */
  private hostedCode: string | null = null;
  private disconnectOp: OnDisconnect | null = null;
  /** The question index for which reveal() has already fired (prevents double-reveal). */
  private revealedIndex = -1;
  /** The question index currently being shown (prevents re-entry in showQuestion). */
  private showingIndex = -1;

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
    const hostSessionId = this.ensureTabHostSessionId();
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
      lastWinners: [],
      rematchReady: {},
      hostSessionId,
    };

    this.roundQuestions.set(code, questions);
    await set(ref(db, `rooms/${code}`), stripUndefined(this.toFirebase(state)));
    await this.armHostDisconnect(code);
    this.persistLastHostedCode(code);
    this.hosting.set(true);
    await this.watchRoom(code);
    return code;
  }

  async watchRoom(code: string): Promise<void> {
    this.stopWatching();
    const upper = code.toUpperCase();
    const db = this.requireDb();
    const roomRef = ref(db, `rooms/${upper}`);

    if (this.hostedCode !== upper) {
      await this.tryClaimHost(upper, roomRef);
    } else {
      this.hosting.set(true);
    }

    this.unsubscribe = onValue(roomRef, (snap) => {
      const raw = snap.val();
      if (!raw) {
        this.room.set(null);
        return;
      }
      this.room.set(this.fromFirebase(upper, raw));
    });
  }

  stopWatching(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
  }

  private requireHost(code: string): void {
    if (!this.isHosting || this.hostedCode !== code.toUpperCase()) {
      throw new Error('NOT_HOST');
    }
  }

  async startGame(code: string): Promise<void> {
    this.requireHost(code);
    const room = await this.fetchFreshRoom(code);
    if (Object.keys(room.players).length === 0) {
      throw new Error('NO_PLAYERS');
    }
    this.showingIndex = -1;
    await this.showQuestion(code, 0);
  }

  async nextAfterReveal(code: string): Promise<void> {
    if (!this.isHosting || this.hostedCode !== code.toUpperCase()) return;
    // Always fetch fresh state from Firebase to avoid acting on stale signal data.
    const room = await this.fetchFreshRoom(code);
    if (room.phase !== 'reveal') return; // Already advanced or finished.
    const next = room.currentIndex + 1;
    if (next >= room.totalQuestions) {
      await this.finishRound(code);
      return;
    }
    await this.showQuestion(code, next);
  }

  async reveal(code: string): Promise<void> {
    if (!this.isHosting || this.hostedCode !== code.toUpperCase()) return;
    const room = await this.fetchFreshRoom(code);
    if (room.phase !== 'question') return;
    // Prevent double-reveal for the same question index (per tab).
    if (this.revealedIndex === room.currentIndex) return;
    this.revealedIndex = room.currentIndex;

    const questions = await this.getRoundQuestions(code, room);
    const question = questions[room.currentIndex];
    if (!question) return;

    const lang = room.config.language;
    const { displayCorrect } = shuffledOptionsForQuestion(
      [
        question.options[0][lang],
        question.options[1][lang],
        question.options[2][lang],
        question.options[3][lang],
      ],
      question.correctIndex,
      code,
      question.id,
      room.currentIndex,
    );
    const correctIndex = displayCorrect;

    const qKey = String(room.currentIndex);
    const answers = room.answers[qKey] ?? {};
    const scoringMode = room.config.scoringMode ?? 'timed';
    const duration =
      room.currentQuestion?.durationMs ??
      clampQuestionSeconds(room.config.questionSeconds ?? 15) * 1000;
    const endsAt = room.currentQuestion?.endsAt ?? Date.now();
    const base =
      question.type === 'image_mcq'
        ? IMAGE_MCQ_POINTS
        : DIFFICULTY_POINTS[question.difficulty];
    const deltas: Record<string, number> = {};
    const playerUpdates: Record<string, number> = {};

    const answerOpensAt =
      room.currentQuestion?.answerOpensAt ??
      endsAt - duration;

    for (const [playerId, player] of Object.entries(room.players)) {
      const ans = answers[playerId];
      let delta = 0;
      // Ignore answers submitted before the image preview/dock finished.
      const answerValid =
        !!ans &&
        ans.answeredAt >= answerOpensAt &&
        ans.choice === correctIndex;
      if (answerValid && ans) {
        if (scoringMode === 'standard') {
          delta = 1;
        } else {
          // Timed mode uses the final stored answer timestamp (last reselect wins).
          const answeredAt = Math.min(ans.answeredAt, endsAt);
          const timeLeft = Math.max(0, endsAt - answeredAt);
          const speed = timeLeft / duration;
          delta = Math.round(base * (0.4 + 0.6 * speed));
        }
      }
      deltas[playerId] = delta;
      playerUpdates[`players/${playerId}/score`] = player.score + delta;
      if (delta > 0 && ans) {
        playerUpdates[`players/${playerId}/lastScoredAt`] = ans.answeredAt;
      }
    }

    await this.patch(code, {
      phase: 'reveal',
      correctIndex,
      lastScoreDeltas: deltas,
      ...playerUpdates,
    });
  }

  async endGame(code: string): Promise<void> {
    this.requireHost(code);
    // Host quit mid-round — show finished screen without awarding a win.
    await this.finishRound(code, false);
  }

  async rematch(code: string, nextConfig?: RoomConfig): Promise<void> {
    this.requireHost(code);
    const room = await this.fetchFreshRoom(code);
    // Wins already applied in finishRound; keep lastWinners and reset round state.
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

    const readyIds = new Set(
      Object.keys(room.rematchReady ?? {}).filter(
        (id) => room.rematchReady[id] && room.players[id],
      ),
    );
    if (readyIds.size === 0) {
      throw new Error('NO_PLAYERS');
    }

    // Keep only opted-in players; remove everyone else from the next round.
    const playerUpdates: Record<string, unknown> = {};
    for (const id of Object.keys(room.players)) {
      if (readyIds.has(id)) {
        playerUpdates[`players/${id}/score`] = 0;
        playerUpdates[`players/${id}/lastScoredAt`] = 0;
      } else {
        playerUpdates[`players/${id}`] = null;
      }
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
      roundTied: null,
      questionIds: questions.map((q) => q.id),
      lastWinners: room.lastWinners,
      ...playerUpdates,
    });

    // Jump straight into the next round (skip lobby).
    this.showingIndex = -1;
    await this.showQuestion(code, 0);
  }

  async deleteRoom(code: string): Promise<void> {
    await this.cancelHostDisconnect();
    this.stopWatching();
    this.roundQuestions.delete(code);
    this.hostedCode = null;
    this.hosting.set(false);
    this.clearLastHostedCode(code);
    const db = this.requireDb();
    await remove(ref(db, `rooms/${code}`));
    this.room.set(null);
  }

  /** Host leaves lobby/play or closes the tab — tear down the room for all players. */
  async leaveHostedRoom(code?: string): Promise<void> {
    const c = (code ?? this.hostedCode)?.toUpperCase();
    if (!c) {
      this.stopWatching();
      this.hosting.set(false);
      return;
    }

    // Only the tab that successfully claimed host may delete the room.
    // localStorage lastHostedCode alone is not enough (shared across tabs).
    const canTeardown = this.hostedCode === c && this.hosting();
    if (!canTeardown) {
      this.stopWatching();
      return;
    }

    try {
      await this.deleteRoom(c);
    } catch (e) {
      console.error(e);
      this.stopWatching();
      this.hostedCode = null;
      this.hosting.set(false);
      this.clearLastHostedCode(c);
      this.room.set(null);
    }
  }

  get isHosting(): boolean {
    return this.hosting();
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

  /**
   * Claim host for this tab only when sessionStorage matches the room's
   * hostSessionId (or when claiming a legacy room that has none yet).
   */
  private async tryClaimHost(
    upper: string,
    roomRef: ReturnType<typeof ref>,
  ): Promise<void> {
    const lastHosted = this.readLastHostedCode();
    if (lastHosted !== upper) {
      this.hosting.set(false);
      return;
    }

    let snap;
    try {
      snap = await get(roomRef);
    } catch {
      this.hosting.set(false);
      return;
    }
    if (!snap.exists()) {
      this.hosting.set(false);
      return;
    }

    const raw = snap.val() as Record<string, unknown>;
    const remoteSession =
      typeof raw['hostSessionId'] === 'string' && raw['hostSessionId']
        ? String(raw['hostSessionId'])
        : null;
    const localSession = this.readTabHostSessionId();

    if (localSession && remoteSession && localSession === remoteSession) {
      await this.armHostDisconnect(upper);
      this.persistLastHostedCode(upper);
      this.hosting.set(true);
      return;
    }

    // Legacy room (no hostSessionId yet): first matching tab claims it.
    if (localSession && !remoteSession) {
      await update(roomRef, { hostSessionId: localSession });
      await this.armHostDisconnect(upper);
      this.persistLastHostedCode(upper);
      this.hosting.set(true);
      return;
    }

    if (!localSession && !remoteSession) {
      const sessionId = this.ensureTabHostSessionId();
      await update(roomRef, { hostSessionId: sessionId });
      await this.armHostDisconnect(upper);
      this.persistLastHostedCode(upper);
      this.hosting.set(true);
      return;
    }

    // Another tab already owns this room — watch as spectator only.
    this.hosting.set(false);
  }

  private ensureTabHostSessionId(): string {
    const existing = this.readTabHostSessionId();
    if (existing) return existing;
    const id =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `h_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    this.persistTabHostSessionId(id);
    return id;
  }

  private readTabHostSessionId(): string | null {
    try {
      const id = sessionStorage.getItem(HOST_SESSION_KEY)?.trim();
      return id || null;
    } catch {
      return null;
    }
  }

  private persistTabHostSessionId(id: string): void {
    try {
      sessionStorage.setItem(HOST_SESSION_KEY, id);
    } catch {
      /* ignore quota / private mode */
    }
  }

  private async armHostDisconnect(code: string): Promise<void> {
    await this.cancelHostDisconnect();
    const db = this.requireDb();
    const roomRef = ref(db, `rooms/${code}`);
    this.disconnectOp = onDisconnect(roomRef);
    await this.disconnectOp.remove();
    this.hostedCode = code;
    this.hosting.set(true);
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
    const room = await this.fetchFreshRoom(code);
    if (room.phase === 'finished') return;

    const ranked = rankPlayers(Object.values(room.players));
    const topScore = ranked.length > 0 ? ranked[0].score : null;
    const leaders =
      topScore === null ? [] : ranked.filter((p) => p.score === topScore);
    const coWinners = awardWin
      ? leaders.map((p) => ({
          playerId: p.id,
          name: p.name,
          avatar: p.avatar,
        }))
      : [];

    const updates: Record<string, unknown> = {
      phase: 'finished',
      currentQuestion: null,
      correctIndex: null,
      lastWinners: coWinners,
      roundTied: awardWin && coWinners.length > 1,
      rematchReady: null,
    };
    for (const w of coWinners) {
      const current = room.players[w.playerId];
      if (current) {
        updates[`players/${w.playerId}/wins`] = (current.wins ?? 0) + 1;
      }
    }
    await this.patch(code, updates);
  }

  private async showQuestion(code: string, index: number): Promise<void> {
    // Guard against re-entry for the same question index (per tab).
    if (this.showingIndex === index) return;

    const room = await this.fetchFreshRoom(code);
    const questions = await this.getRoundQuestions(code, room);
    const question = questions[index];
    if (!question) {
      throw new Error('NO_QUESTIONS');
    }

    // Another host tab or a refresh may have already published this question.
    if (
      room.phase === 'question' &&
      room.currentIndex === index &&
      room.currentQuestion?.id === question.id
    ) {
      this.showingIndex = index;
      this.revealedIndex = -1;
      return;
    }

    this.showingIndex = index;
    // Reset the reveal guard so the new question is eligible for reveal.
    this.revealedIndex = -1;

    const lang = room.config.language;
    const durationMs = clampQuestionSeconds(room.config.questionSeconds ?? 15) * 1000;
    const now = this.serverTime.nowMs();
    const answerDelayMs =
      question.type === 'image_mcq' ? IMAGE_ANSWER_DELAY_MS : 0;
    const answerOpensAt = now + answerDelayMs;

    const { options: shuffledOptions } = shuffledOptionsForQuestion(
      [
        question.options[0][lang],
        question.options[1][lang],
        question.options[2][lang],
        question.options[3][lang],
      ],
      question.correctIndex,
      code,
      question.id,
      index,
    );

    const publicQ: PublicQuestion = {
      id: question.id,
      type: question.type,
      category: question.category,
      difficulty: question.difficulty,
      prompt: question.prompt[lang],
      options: shuffledOptions,
      answerOpensAt,
      endsAt: answerOpensAt + durationMs,
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
      lastWinners: state.lastWinners,
      roundTied: state.roundTied ?? null,
      rematchReady: state.rematchReady,
      hostSessionId: state.hostSessionId ?? null,
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
      lastScoredAt: Number(raw['lastScoredAt'] ?? 0),
    };
  }

  private normalizePublicQuestion(raw: unknown): PublicQuestion | null {
    if (!raw || typeof raw !== 'object') return null;
    const q = raw as Record<string, unknown>;
    const durationMs = Number(q['durationMs'] ?? 15_000);
    const endsAt = Number(q['endsAt'] ?? 0);
    const answerOpensAt = Number(
      q['answerOpensAt'] ?? Math.max(0, endsAt - durationMs),
    );
    const optionsRaw = q['options'];
    const options: [string, string, string, string] = ['', '', '', ''];
    if (Array.isArray(optionsRaw)) {
      for (let i = 0; i < 4; i++) {
        options[i] = String(optionsRaw[i] ?? '');
      }
    }
    return {
      id: String(q['id'] ?? ''),
      type: (q['type'] as PublicQuestion['type']) ?? 'mcq',
      category: (q['category'] as PublicQuestion['category']) ?? 'geography',
      difficulty: (q['difficulty'] as PublicQuestion['difficulty']) ?? 'easy',
      prompt: String(q['prompt'] ?? ''),
      options,
      imageUrl: q['imageUrl'] == null ? null : String(q['imageUrl']),
      answerOpensAt,
      endsAt,
      durationMs,
      index: Number(q['index'] ?? 0),
      total: Number(q['total'] ?? 0),
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

    const lastWinners = this.parseLastWinners(raw);

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
      currentQuestion: this.normalizePublicQuestion(raw['currentQuestion']),
      correctIndex:
        raw['correctIndex'] === undefined || raw['correctIndex'] === null
          ? null
          : Number(raw['correctIndex']),
      players,
      answers: (raw['answers'] as Record<string, Record<string, PlayerAnswer>>) ?? {},
      questionIds: (raw['questionIds'] as string[]) ?? [],
      lastScoreDeltas: (raw['lastScoreDeltas'] as Record<string, number>) ?? undefined,
      lastWinners,
      roundTied: raw['roundTied'] === true,
      rematchReady: (raw['rematchReady'] as Record<string, boolean>) ?? {},
      hostSessionId:
        typeof raw['hostSessionId'] === 'string' ? String(raw['hostSessionId']) : null,
    };
  }

  private parseLastWinners(raw: Record<string, unknown>): LastWinner[] {
    const list = raw['lastWinners'];
    if (Array.isArray(list)) {
      return list
        .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
        .map((o) => ({
          playerId: String(o['playerId'] ?? ''),
          name: String(o['name'] ?? ''),
          avatar: Number(o['avatar'] ?? 0),
        }));
    }
    const lw = raw['lastWinner'];
    if (lw && typeof lw === 'object') {
      const o = lw as Record<string, unknown>;
      return [
        {
          playerId: String(o['playerId'] ?? ''),
          name: String(o['name'] ?? ''),
          avatar: Number(o['avatar'] ?? 0),
        },
      ];
    }
    return [];
  }
}
