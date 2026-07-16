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

export interface PublicQuestion {
  id: string;
  type: QuestionType;
  category: CategoryId;
  difficulty: Difficulty;
  prompt: string;
  options: [string, string, string, string];
  imageUrl?: string | null;
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

export interface RoomConfig {
  categories: CategoryId[];
  questionTypes: QuestionType[];
  roundLength: number;
  language: Lang;
  /** timed = speed bonus; standard = +1 per correct */
  scoringMode: ScoringMode;
  /** Seconds allowed for each question in the round */
  questionSeconds: number;
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
  /** Tab-scoped host claim — only the matching sessionStorage tab may host. */
  hostSessionId?: string | null;
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
] as const;

/** Creature / animal icons only — no face smileys. Count divisible by 4. */
export const AVATAR_EMOJIS = [
  '🦉',
  '🦊',
  '🐯',
  '🐸',
  '🤖',
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
  '🐷',
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
