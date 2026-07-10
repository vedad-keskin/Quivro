import type { LocalizedString } from '../../i18n/types';

export type Lang = 'en' | 'bs';
export type CategoryId = 'geography' | 'biology' | 'gaming' | 'history' | 'sports';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type QuestionType = 'mcq' | 'image_mcq';

export interface Question {
  id: string;
  type: QuestionType;
  category: CategoryId;
  difficulty: Difficulty;
  prompt: LocalizedString;
  options: [LocalizedString, LocalizedString, LocalizedString, LocalizedString];
  correctIndex: 0 | 1 | 2 | 3;
  /** Relative path under /questions or absolute URL */
  image?: string;
}

export const CATEGORIES: CategoryId[] = ['geography', 'biology', 'gaming', 'history', 'sports'];
export const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];
export const ROUND_LENGTH_PRESETS = [12, 15, 20, 30] as const;
export const QUESTION_TYPES: QuestionType[] = ['mcq', 'image_mcq'];
export const QUESTION_SECONDS_PRESETS = [10, 15, 20, 30] as const;
export const REVEAL_MS = 3_500;

export const DIFFICULTY_POINTS: Record<Difficulty, number> = {
  easy: 500,
  medium: 750,
  hard: 1000,
};

export const QUESTION_TIMER_MS: Record<QuestionType, number> = {
  mcq: 15_000,
  image_mcq: 20_000,
};
