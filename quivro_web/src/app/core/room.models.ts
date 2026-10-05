import type { CategoryId, Difficulty, QuestionType } from '../../data/questions/types';
import type { Lang } from '../../i18n/types';

export type RoomPhase =
  | 'lobby'
  | 'question'
  | 'reveal'
  | 'leaderboard'
  | 'finished';

export interface RoomPlayer {
  id: string;
  name: string;
  score: number;
  /** Avatar index 0..19 — shared with mobile */
  avatar: number;
  joinedAt: number;
  wins: number;
  /** Timestamp when this player last earned points (for tie ordering). */
  lastScoredAt?: number;
}

export interface LastWinner {
  playerId: string;
  name: string;
  avatar: number;
}

/** Hold large image preview before slide-to-dock begins. */
export const IMAGE_PREVIEW_HOLD_MS = 1_800;
/** Slide animation into leaderboard dock. */
export const IMAGE_SLIDE_MS = 450;
/** Answers stay locked until preview + slide finish. */
export const IMAGE_ANSWER_DELAY_MS = IMAGE_PREVIEW_HOLD_MS + IMAGE_SLIDE_MS;

export interface PublicQuestion {
  id: string;
  type: QuestionType;
  category: CategoryId;
  difficulty: Difficulty;
  prompt: string;
  options: [string, string, string, string];
  imageUrl?: string | null;
  /** Epoch ms when phones may answer (after image preview/dock). */
  answerOpensAt: number;
  endsAt: number;
  durationMs: number;
  index: number;
  total: number;
}

export interface PlayerAnswer {
  choice: number;
  answeredAt: number;
}

export type ScoringMode = 'timed' | 'standard';

export type PowerUpId = 'fifty_fifty';
export type PowerUpSlot = PowerUpId | null;
export type PowerUpSlots = [PowerUpSlot, PowerUpSlot, PowerUpSlot];

export const POWER_UP_CATALOG: readonly {
  id: PowerUpId;
  labelKey: 'powerUpFifty';
  descKey: 'descPowerUpFifty';
  icon: string;
}[] = [
  {
    id: 'fifty_fifty',
    labelKey: 'powerUpFifty',
    descKey: 'descPowerUpFifty',
    icon: '/room-icons/fifty_fifty.png',
  },
];

const POWER_UP_IDS = new Set<string>(POWER_UP_CATALOG.map((p) => p.id));

export const EMPTY_POWER_UP_SLOTS: PowerUpSlots = [null, null, null];

const POWER_UP_ORDER: PowerUpSlot[] = [null, ...POWER_UP_CATALOG.map((p) => p.id)];

/** Step one slot through empty, then each catalog power-up, wrapping. */
export function cyclePowerUpSlot(current: PowerUpSlot, direction: 1 | -1): PowerUpSlot {
  const index = POWER_UP_ORDER.indexOf(current);
  const at = index < 0 ? 0 : index;
  const next = (at + direction + POWER_UP_ORDER.length) % POWER_UP_ORDER.length;
  return POWER_UP_ORDER[next];
}

export function randomPowerUpSlots(rand: () => number = Math.random): PowerUpSlots {
  const pick = () => POWER_UP_ORDER[Math.floor(rand() * POWER_UP_ORDER.length)];
  return [pick(), pick(), pick()];
}

export function isPowerUpId(value: unknown): value is PowerUpId {
  return typeof value === 'string' && POWER_UP_IDS.has(value);
}

/** Always 3 slots. Unknown ids and missing data become empty. */
export function normalizePowerUpSlots(value: unknown): PowerUpSlots {
  const slots: PowerUpSlot[] = [null, null, null];
  if (Array.isArray(value)) {
    for (let i = 0; i < 3 && i < value.length; i++) {
      slots[i] = isPowerUpId(value[i]) ? value[i] : null;
    }
  } else if (value && typeof value === 'object') {
    const raw = value as Record<string, unknown>;
    for (let i = 0; i < 3; i++) {
      const id = raw[String(i)];
      slots[i] = isPowerUpId(id) ? id : null;
    }
  }
  return slots as PowerUpSlots;
}

/** Firebase drops null array holes, so only filled slots are stored, keyed by index. */
export function powerUpSlotsToFirebase(slots: PowerUpSlots): Record<string, PowerUpId> {
  const out: Record<string, PowerUpId> = {};
  slots.forEach((slot, i) => {
    if (slot) out[String(i)] = slot;
  });
  return out;
}

/**
 * Up to two wrong option indices that are not already hidden.
 * Empty when nothing wrong is left to remove.
 */
export function pickFiftyFiftyEliminations(
  correctIndex: number,
  alreadyHidden: readonly number[] = [],
): number[] {
  const hidden = new Set(alreadyHidden);
  const pool = [0, 1, 2, 3].filter((i) => i !== correctIndex && !hidden.has(i));
  const take = Math.min(2, pool.length);
  const picked: number[] = [];
  for (let n = 0; n < take; n++) {
    const at = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(at, 1)[0]);
  }
  return picked.sort((a, b) => a - b);
}

export interface PowerUpRequest {
  slot: number;
  type: PowerUpId;
  questionIndex: number;
  at: number;
}

export interface PlayerPowerUpState {
  /** Slot index → question index it was spent on. */
  used: Record<string, number>;
  /** Question index → option indices hidden for that player. */
  eliminated: Record<string, number[]>;
}

export interface FiftyFiftyDecision {
  eliminated: number[];
  clearAnswer: boolean;
}

/** Host gate for one 50/50 tap. Null means reject and do not spend the slot. */
export function resolveFiftyFiftyRequest(input: {
  phase: string;
  questionIndex: number;
  answerOpensAt: number;
  endsAt: number;
  now: number;
  slots: PowerUpSlots;
  request: { slot: number; type: string; questionIndex: number };
  usedSlot: boolean;
  /** Another slot was already spent on this question. */
  usedOnQuestion: boolean;
  correctIndex: number;
  alreadyEliminated: readonly number[];
  existingChoice: number | null;
}): FiftyFiftyDecision | null {
  if (input.phase !== 'question') return null;
  if (input.now < input.answerOpensAt || input.now > input.endsAt) return null;
  if (input.request.questionIndex !== input.questionIndex) return null;
  if (input.request.type !== 'fifty_fifty') return null;
  const slot = input.request.slot;
  if (!Number.isInteger(slot) || slot < 0 || slot > 2) return null;
  if (input.slots[slot] !== 'fifty_fifty') return null;
  if (input.usedSlot || input.usedOnQuestion) return null;
  if (!Number.isInteger(input.correctIndex) || input.correctIndex < 0 || input.correctIndex > 3) {
    return null;
  }
  const fresh = pickFiftyFiftyEliminations(input.correctIndex, input.alreadyEliminated);
  if (fresh.length === 0) return null;
  const eliminated = [...new Set([...input.alreadyEliminated, ...fresh])]
    .filter((i) => i !== input.correctIndex && i >= 0 && i <= 3)
    .sort((a, b) => a - b);
  return {
    eliminated,
    clearAnswer: input.existingChoice != null && eliminated.includes(input.existingChoice),
  };
}

export function parsePowerUpRequests(value: unknown): Record<string, PowerUpRequest> {
  if (!value || typeof value !== 'object') return {};
  const out: Record<string, PowerUpRequest> = {};
  for (const [playerId, raw] of Object.entries(value as Record<string, unknown>)) {
    if (!raw || typeof raw !== 'object') continue;
    const req = raw as Record<string, unknown>;
    const slot = Number(req['slot']);
    const questionIndex = Number(req['questionIndex']);
    const at = Number(req['at']);
    if (!isPowerUpId(req['type'])) continue;
    if (!Number.isInteger(slot) || slot < 0 || slot > 2) continue;
    if (!Number.isFinite(questionIndex) || !Number.isFinite(at)) continue;
    out[playerId] = {
      slot,
      type: req['type'],
      questionIndex,
      at,
    };
  }
  return out;
}

export function parsePowerUps(value: unknown): Record<string, PlayerPowerUpState> {
  if (!value || typeof value !== 'object') return {};
  const out: Record<string, PlayerPowerUpState> = {};
  for (const [playerId, raw] of Object.entries(value as Record<string, unknown>)) {
    if (!raw || typeof raw !== 'object') continue;
    const node = raw as Record<string, unknown>;
    const used: Record<string, number> = {};
    const usedRaw = node['used'];
    if (usedRaw && typeof usedRaw === 'object') {
      for (const [slot, qIndex] of Object.entries(usedRaw as Record<string, unknown>)) {
        const n = Number(qIndex);
        if (Number.isFinite(n)) used[slot] = n;
      }
    }
    const eliminated: Record<string, number[]> = {};
    const elimRaw = node['eliminated'];
    if (elimRaw && typeof elimRaw === 'object') {
      for (const [qIndex, indices] of Object.entries(elimRaw as Record<string, unknown>)) {
        if (!Array.isArray(indices)) continue;
        const nums = indices
          .map((n) => Number(n))
          .filter((n) => Number.isInteger(n) && n >= 0 && n <= 3);
        if (nums.length) eliminated[qIndex] = nums;
      }
    }
    out[playerId] = { used, eliminated };
  }
  return out;
}

export interface RoomConfig {
  categories: CategoryId[];
  questionTypes: QuestionType[];
  roundLength: number;
  language: Lang;
  /** timed = speed bonus; standard = +1 per correct */
  scoringMode: ScoringMode;
  /** Seconds allowed for each question in the round */
  questionSeconds: number;
  /** Three loadout slots. Null is an empty slot. Duplicates allowed. */
  powerUpSlots: PowerUpSlots;
}

export function clampQuestionSeconds(value: number): number {
  return Math.min(60, Math.max(5, Math.round(value) || 15));
}

export interface RoomState {
  code: string;
  phase: RoomPhase;
  config: RoomConfig;
  createdAt: number;
  currentIndex: number;
  totalQuestions: number;
  currentQuestion: PublicQuestion | null;
  correctIndex: number | null;
  players: Record<string, RoomPlayer>;
  answers: Record<string, Record<string, PlayerAnswer>>;
  questionIds: string[];
  lastScoreDeltas?: Record<string, number>;
  lastWinners: LastWinner[];
  /** True when the round ended with multiple players tied for first. */
  roundTied?: boolean;
  /** Players who tapped Play again on mobile */
  rematchReady: Record<string, boolean>;
  /** Pending 50/50 taps, keyed by player id. Host consumes these. */
  powerUpRequests?: Record<string, PowerUpRequest>;
  /** Per-player spent slots and hidden options. */
  powerUps?: Record<string, PlayerPowerUpState>;
  /** Tab-scoped host claim — only the matching sessionStorage tab may host. */
  hostSessionId?: string | null;
  /** Epoch ms when the room expires (createdAt + ROOM_TTL_MS). */
  expiresAt: number;
  /** Epoch ms the host tab disconnected; cleared while host is active. */
  hostGoneAt?: number | null;
}

/** How long a room lives from createdAt before it is considered expired. */
export const ROOM_TTL_MS = 48 * 60 * 60 * 1000;
/** Grace after host disconnect before an abandoned room is reap-eligible. */
export const HOST_GONE_GRACE_MS = 30 * 60 * 1000;

/**
 * True when a room should be deleted: past its TTL, or host gone longer than
 * the grace window. Enforced lazily on access + by the web-only sweep.
 */
export function isRoomDead(
  room: Pick<RoomState, 'createdAt' | 'expiresAt' | 'hostGoneAt'>,
  now: number,
): boolean {
  const expiresAt =
    typeof room.expiresAt === 'number' && room.expiresAt > 0
      ? room.expiresAt
      : (room.createdAt ?? 0) + ROOM_TTL_MS;
  if (now > expiresAt) return true;
  if (room.hostGoneAt && now - room.hostGoneAt > HOST_GONE_GRACE_MS) return true;
  return false;
}

/** Sort: score desc, last point desc, join order asc. Keep in sync with mobile ranked(). */
export function comparePlayers(a: RoomPlayer, b: RoomPlayer): number {
  const byScore = b.score - a.score;
  if (byScore !== 0) return byScore;
  const byLastPoint = (b.lastScoredAt ?? 0) - (a.lastScoredAt ?? 0);
  if (byLastPoint !== 0) return byLastPoint;
  return a.joinedAt - b.joinedAt;
}

export function rankPlayers(players: RoomPlayer[]): RoomPlayer[] {
  return [...players].sort(comparePlayers);
}

/** Places gained (positive) or lost (negative) per id between two rankings. New ids get 0. */
export function rankMoves(prev: string[], next: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  next.forEach((id, i) => {
    const before = prev.indexOf(id);
    out[id] = before < 0 ? 0 : before - i;
  });
  return out;
}

export const AVATAR_COLORS = [
  '#22d3ee',
  '#f97316',
  '#ec4899',
  '#84cc16',
  '#2f7cf6',
  '#7b3ff2',
  '#eab308',
  '#14b8a6',
  '#ef4444',
  '#0ea5e9',
  '#a855f7',
  '#10b981',
  '#f59e0b',
  '#6366f1',
  '#d946ef',
  '#06b6d4',
  '#f43f5e',
  '#8b5cf6',
  '#22c55e',
  '#3b82f6',
  '#0891b2',
  '#ea580c',
  '#db2777',
  '#65a30d',
  '#2563eb',
  '#6d28d9',
  '#ca8a04',
  '#0d9488',
  '#dc2626',
  '#0284c7',
  '#9333ea',
  '#059669',
  '#d97706',
  '#4f46e5',
  '#c026d3',
  '#0e7490',
  '#e11d48',
  '#7c3aed',
  '#16a34a',
  '#1d4ed8',
  '#0f766e',
  '#be185d',
  '#7c2d12',
  '#1e40af',
  // Extended palette (indices 44..87).
  '#0ea5e9',
  '#db2777',
  '#84cc16',
  '#7b3ff2',
  '#f59e0b',
  '#14b8a6',
  '#ef4444',
  '#6366f1',
  '#22c55e',
  '#ec4899',
  '#2f7cf6',
  '#ca8a04',
  '#06b6d4',
  '#a855f7',
  '#65a30d',
  '#f43f5e',
  '#0891b2',
  '#8b5cf6',
  '#eab308',
  '#10b981',
  '#ea580c',
  '#3b82f6',
  '#d946ef',
  '#0d9488',
  '#dc2626',
  '#4f46e5',
  '#16a34a',
  '#0284c7',
  '#c026d3',
  '#7c3aed',
  '#d97706',
  '#1d4ed8',
  '#be185d',
  '#059669',
  '#9333ea',
  '#e11d48',
  '#0f766e',
  '#6d28d9',
  '#2563eb',
  '#7c2d12',
  '#22d3ee',
  '#f97316',
  '#84cc16',
  '#7b3ff2',
] as const;

/** Creature / animal icons only — no face smileys. Count divisible by 4. */
export const AVATAR_EMOJIS = [
  '🦉',
  '🦊',
  '🐯',
  '🐸',
  '🦍', // MIUI/Xiaomi: was 🪼 (Unicode 15, missing glyph on many devices)
  '🦄',
  '🦁',
  '🐼',
  '🐙',
  '🐺',
  '🐨',
  '🐲',
  '🐧',
  '🐝',
  '🦋',
  '🐢',
  '🦈',
  '🦅',
  '🦕',
  '🦔',
  '🐴',
  '🐱',
  '🐶',
  '🐰',
  '🐻',
  '🐭',
  '🐮',
  '🐔',
  '🦆',
  '🦒',
  '🦇',
  '🐿️',
  '🦦',
  '🦥',
  '🦩',
  '🦚',
  '🦜',
  '🐊',
  '🦎',
  '🦀',
  '🐘',
  '🐪',
  '🦏',
  '🦛',
  // Extended set (indices 44..87) — no pigs, no duplicates of above.
  '🐹',
  '🦓',
  '🦌',
  '🦬',
  '🐃',
  '🐂',
  '🐒',
  '🐏',
  '🐑',
  '🐐',
  '🦙',
  '🐫',
  '🦣',
  '🦘',
  '🦫',
  '🦨',
  '🦡',
  '🦃',
  '🦢',
  '🐦',
  '🦤',
  '🦭',
  '🐬',
  '🐳',
  '🐋',
  '🐟',
  '🐠',
  '🐡',
  '🦐',
  '🦞',
  '🦑',
  '🪲',
  '🐞',
  '🐜',
  '🪰',
  '🪱',
  '🦟',
  '🪳',
  '🕷️',
  '🦂',
  '🐌',
  '🦖',
  '🐉',
  '🐍',
] as const;

export const AVATAR_COUNT = AVATAR_EMOJIS.length;

export function avatarColor(index: number): string {
  const n = AVATAR_COUNT;
  return AVATAR_COLORS[((index % n) + n) % n];
}

export function avatarEmoji(index: number): string {
  const n = AVATAR_COUNT;
  return AVATAR_EMOJIS[((index % n) + n) % n];
}

export function stripUndefined<T>(value: T): T {
  if (value === undefined) {
    return null as T;
  }
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item)) as T;
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (v !== undefined) {
      out[k] = stripUndefined(v);
    }
  }
  return out as T;
}

export function shuffleInPlace<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

/** Stable FNV-1a hash for deterministic shuffle seeds. */
export function hashSeed(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Seed shared by all clients for the same room question. */
export function questionShuffleSeed(
  roomCode: string,
  questionId: string,
  index: number,
): number {
  return hashSeed(`${roomCode.toUpperCase()}:${questionId}:${index}`);
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic Fisher–Yates shuffle — same seed always yields same order. */
export function shuffleWithSeed<T>(items: readonly T[], seed: number): T[] {
  const out = [...items];
  const rand = mulberry32(seed >>> 0);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Shuffle four localized options and return display order + correct display index. */
export function shuffledOptionsForQuestion(
  options: readonly [string, string, string, string],
  correctIndex: number,
  roomCode: string,
  questionId: string,
  index: number,
): { options: [string, string, string, string]; displayCorrect: number } {
  const pairs = options.map((text, originalIndex) => ({ text, originalIndex }));
  const shuffled = shuffleWithSeed(
    pairs,
    questionShuffleSeed(roomCode, questionId, index),
  );
  const displayCorrect = shuffled.findIndex((o) => o.originalIndex === correctIndex);
  return {
    options: [
      shuffled[0].text,
      shuffled[1].text,
      shuffled[2].text,
      shuffled[3].text,
    ],
    displayCorrect,
  };
}
