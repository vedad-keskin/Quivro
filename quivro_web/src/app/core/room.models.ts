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
  lastWinner: LastWinner | null;
  /** Players who tapped Play again on mobile */
  rematchReady: Record<string, boolean>;
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
] as const;

/** Creature / object icons only — no face smileys. */
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
