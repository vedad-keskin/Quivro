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
  color: string;
  isBot?: boolean;
  joinedAt: number;
}

export interface PublicQuestion {
  id: string;
  type: QuestionType;
  category: CategoryId;
  difficulty: Difficulty;
  prompt: string;
  options: [string, string, string, string];
  imageUrl?: string;
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
  players: Record<string, RoomPlayer>;
  /** answers[questionIndex][playerId] */
  answers: Record<string, Record<string, PlayerAnswer>>;
  /** Host-only full question ids for the round */
  questionIds: string[];
  lastScoreDeltas?: Record<string, number>;
}

export const PLAYER_COLORS = [
  '#22d3ee',
  '#f97316',
  '#ec4899',
  '#84cc16',
  '#2f7cf6',
  '#7b3ff2',
  '#eab308',
  '#14b8a6',
];
