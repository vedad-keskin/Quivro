import type { ScoringMode } from '../core/room.models';
import type { CategoryId, QuestionType } from '../../data/questions/types';

/** Accent for each content category. `images` matches picture questions. */
export const CATEGORY_ACCENT: Record<CategoryId, string> = {
  geography: 'var(--q-cyan)',
  biology: 'var(--q-lime)',
  history: 'var(--q-red)',
  technology: 'var(--q-indigo)',
  sports: 'var(--q-coral)',
  movies: 'var(--q-purple)',
  famous: 'var(--q-yellow)',
  islam: 'var(--q-green)',
  food: 'var(--q-pink)',
  images: 'var(--q-fuchsia)',
};

export const TYPE_ACCENT: Record<QuestionType, string> = {
  mcq: 'var(--q-blue)',
  image_mcq: 'var(--q-fuchsia)',
};

export const SCORING_ACCENT: Record<ScoringMode, string> = {
  standard: 'var(--q-gold)',
  timed: 'var(--q-orange)',
};
