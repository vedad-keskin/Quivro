import { Injectable, inject } from '@angular/core';
import type {
  CategoryId,
  Difficulty,
  Question,
  QuestionType,
} from '../../data/questions/types';
import { DIFFICULTIES } from '../../data/questions/types';
import { QuestionBankService } from './question-bank.service';

export function normalizeRoundLength(length: number): number {
  const clamped = Math.min(60, Math.max(3, Math.round(length)));
  const rem = clamped % 3;
  return rem === 0 ? clamped : clamped + (3 - rem);
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

@Injectable({ providedIn: 'root' })
export class RoundGeneratorService {
  private readonly bank = inject(QuestionBankService);

  generate(
    categories: CategoryId[],
    roundLength: number,
    questionTypes: QuestionType[] = ['mcq', 'image_mcq'],
  ): Question[] {
    const length = normalizeRoundLength(roundLength);
    const perBand = length / 3;
    const types =
      questionTypes.length > 0 ? questionTypes : (['mcq', 'image_mcq'] as QuestionType[]);
    const all = this.bank
      .getAll()
      .filter((q) => categories.includes(q.category) && types.includes(q.type));

    const result: Question[] = [];
    for (const difficulty of DIFFICULTIES) {
      result.push(...this.pickForDifficulty(all, categories, difficulty, perBand));
    }
    return result;
  }

  private pickForDifficulty(
    all: Question[],
    categories: CategoryId[],
    difficulty: Difficulty,
    count: number,
  ): Question[] {
    const pool = shuffle(all.filter((q) => q.difficulty === difficulty));
    if (pool.length === 0) {
      console.warn(`No questions for difficulty ${difficulty}`);
      return [];
    }

    const byCategory = new Map<CategoryId, Question[]>();
    for (const category of categories) {
      byCategory.set(
        category,
        shuffle(pool.filter((q) => q.category === category)),
      );
    }

    const picked: Question[] = [];
    let guard = 0;
    while (picked.length < count && guard < count * 20) {
      guard++;
      for (const category of categories) {
        if (picked.length >= count) break;
        const list = byCategory.get(category) ?? [];
        const next = list.shift();
        if (next) {
          picked.push(next);
          list.push(next);
          byCategory.set(category, list);
        }
      }
      if (categories.every((c) => (byCategory.get(c)?.length ?? 0) === 0)) {
        const fallback = pool[picked.length % pool.length];
        if (fallback) picked.push(fallback);
      }
    }

    return shuffle(picked).slice(0, count);
  }
}
