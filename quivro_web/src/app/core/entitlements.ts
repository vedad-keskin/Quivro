import type { CategoryId, QuestionType } from '../../data/questions/types';
import type { RoomConfig, ScoringMode } from './room.models';

/**
 * Single source of truth for the free/Pro split. Everything that gates a
 * feature reads from here so the split can be changed in one place.
 */

export const FREE_CATEGORIES: CategoryId[] = [
  'geography',
  'biology',
  'technology',
  'history',
  'sports',
];

/** One of these is free each week — see `rotatingFreeCategory`. */
export const PRO_CATEGORIES: CategoryId[] = ['movies', 'famous', 'islam', 'food'];

export const FREE_QUESTION_TYPES: QuestionType[] = ['mcq'];
export const FREE_SCORING_MODES: ScoringMode[] = ['standard'];
export const FREE_ROUND_LENGTH_PRESETS = [10, 20, 30] as const;
export const FREE_MAX_ROUND_LENGTH = 30;

export const PRO_PRICE = '€4.99';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
/** The epoch fell on a Thursday; shifting by 4 days makes the rotation flip Monday 00:00 UTC. */
const MONDAY_OFFSET_MS = 4 * 24 * 60 * 60 * 1000;

/**
 * The Pro category that is free this week. Derived from the UTC week number so
 * every host worldwide sees the same one, with no storage and no server call.
 */
export function rotatingFreeCategory(now: number = Date.now()): CategoryId {
  const week = Math.floor((now - MONDAY_OFFSET_MS) / WEEK_MS);
  const index = ((week % PRO_CATEGORIES.length) + PRO_CATEGORIES.length) % PRO_CATEGORIES.length;
  return PRO_CATEGORIES[index];
}

export function isCategoryFree(category: CategoryId, now: number = Date.now()): boolean {
  return FREE_CATEGORIES.includes(category) || category === rotatingFreeCategory(now);
}

export function isQuestionTypeFree(type: QuestionType): boolean {
  return FREE_QUESTION_TYPES.includes(type);
}

export function isScoringModeFree(mode: ScoringMode): boolean {
  return FREE_SCORING_MODES.includes(mode);
}

export function isRoundLengthFree(length: number): boolean {
  return (FREE_ROUND_LENGTH_PRESETS as readonly number[]).includes(length);
}

/**
 * Last line of defence before a room is written to Firebase. Forces a non-Pro
 * config down to free limits so stale or tampered UI state cannot create a Pro
 * room. Routes through `isCategoryFree` so the weekly rotation survives.
 */
export function clampToFree(config: RoomConfig, now: number = Date.now()): RoomConfig {
  const categories = config.categories.filter((c) => isCategoryFree(c, now));
  const questionTypes = config.questionTypes.filter(isQuestionTypeFree);
  return {
    ...config,
    categories: categories.length ? categories : [FREE_CATEGORIES[0]],
    questionTypes: questionTypes.length ? questionTypes : [...FREE_QUESTION_TYPES],
    roundLength: Math.min(config.roundLength, FREE_MAX_ROUND_LENGTH),
    scoringMode: isScoringModeFree(config.scoringMode)
      ? config.scoringMode
      : FREE_SCORING_MODES[0],
  };
}
