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
    const usedIds = new Set<string>();
    for (const difficulty of DIFFICULTIES) {
      result.push(
        ...this.pickForDifficulty(all, categories, difficulty, perBand, usedIds),
      );
    }
    return result;
  }

  private pickForDifficulty(
    all: Question[],
    categories: CategoryId[],
    difficulty: Difficulty,
    count: number,
    usedIds: Set<string>,
  ): Question[] {
    const pool = shuffle(
      all.filter((q) => q.difficulty === difficulty && !usedIds.has(q.id)),
    );
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
      let tookAny = false;
      for (const category of categories) {
        if (picked.length >= count) break;
        const list = byCategory.get(category) ?? [];
        while (list.length > 0) {
          const next = list.shift()!;
          if (usedIds.has(next.id)) continue;
          picked.push(next);
          usedIds.add(next.id);
          tookAny = true;
          break;
        }
        byCategory.set(category, list);
      }

      if (picked.length >= count) break;

      if (!tookAny) {
        const fallback = pool.find((q) => !usedIds.has(q.id));
        if (!fallback) {
          console.warn(
            `Exhausted unique questions for difficulty ${difficulty} (need ${count}, got ${picked.length})`,
          );
          break;
        }
        picked.push(fallback);
        usedIds.add(fallback.id);
      }
    }

    return shuffle(picked).slice(0, count);
  }
}
