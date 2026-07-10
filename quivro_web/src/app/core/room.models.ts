import type { CategoryId, Difficulty, QuestionType } from '../../data/questions/types';
import type { Lang } from '../../i18n/types';

export type RoomPhase =
  | 'lobby'
  | 'prepare'
  | 'question'
  | 'reveal'
  | 'leaderboard'
  | 'finished';

export interface RoomPlayer {
  id: string;
  name: string;
  score: number;
  /** Avatar index 0..7 — shared with mobile */
  avatar: number;
  joinedAt: number;
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

export interface RoomConfig {
  categories: CategoryId[];
  questionTypes: QuestionType[];
  roundLength: number;
  language: Lang;
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
  prepareEndsAt: number | null;
  players: Record<string, RoomPlayer>;
  /** answers[questionIndex][playerId] */
  answers: Record<string, Record<string, PlayerAnswer>>;
  /** Host-only full question ids for the round */
  questionIds: string[];
  lastScoreDeltas?: Record<string, number>;
}

/** Shared avatar accents (index 0..7) — keep in sync with Flutter */
export const AVATAR_COLORS = [
  '#22d3ee',
  '#f97316',
  '#ec4899',
  '#84cc16',
  '#2f7cf6',
  '#7b3ff2',
  '#eab308',
  '#14b8a6',
] as const;

export const AVATAR_EMOJIS = ['😎', '🦊', '🐯', '🐸', '🤖', '🦄', '🦁', '🐼'] as const;

export function avatarColor(index: number): string {
  return AVATAR_COLORS[((index % 8) + 8) % 8];
}

export function avatarEmoji(index: number): string {
  return AVATAR_EMOJIS[((index % 8) + 8) % 8];
}

/** Firebase RTDB rejects undefined — strip recursively */
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
