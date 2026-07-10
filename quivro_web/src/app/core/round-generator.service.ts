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
  return Math.min(60, Math.max(3, Math.round(length)));
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Approximate easy/medium/hard counts that sum to `length`. */
export function allocateDifficultyCounts(
  length: number,
): Record<Difficulty, number> {
  const base = Math.floor(length / 3);
  const counts: Record<Difficulty, number> = {
    easy: base,
    medium: base,
    hard: base,
  };

  let remainder = length - base * 3;
  const order = shuffle([...DIFFICULTIES]);
  for (let i = 0; i < remainder; i++) {
    counts[order[i % order.length]]++;
  }

  // Light jitter for longer rounds so splits are not always near-equal.
  if (length >= 20) {
    const from = order[0];
    const to = order[1];
    if (counts[from] > 1) {
      counts[from]--;
      counts[to]++;
    }
  }

  // Ensure every difficulty gets at least one when the bank can support it.
  if (length >= 3) {
    for (const d of DIFFICULTIES) {
      if (counts[d] === 0) {
        const donor = DIFFICULTIES.find((x) => counts[x] > 1);
        if (donor) {
          counts[donor]--;
          counts[d]++;
        }
      }
    }
  }

  return counts;
}

/**
 * Soft progression: trends easy → medium → hard with light interleave
 * so the round does not feel like three rigid blocks.
 */
export function softOrderByDifficulty(questions: Question[]): Question[] {
  const pools: Record<Difficulty, Question[]> = {
    easy: shuffle(questions.filter((q) => q.difficulty === 'easy')),
    medium: shuffle(questions.filter((q) => q.difficulty === 'medium')),
    hard: shuffle(questions.filter((q) => q.difficulty === 'hard')),
  };

  const total = questions.length;
  const result: Question[] = [];

  for (let i = 0; i < total; i++) {
    const t = total === 1 ? 0 : i / (total - 1);
    // Weights ramp: easy early, hard late, medium peaks in the middle.
    const weights: Record<Difficulty, number> = {
      easy: Math.max(0.05, 1 - t),
      medium: Math.max(0.05, 1 - Math.abs(t - 0.5) * 1.6),
      hard: Math.max(0.05, t),
    };

    const available = DIFFICULTIES.filter((d) => pools[d].length > 0);
    if (available.length === 0) break;

    let sum = 0;
    const weighted = available.map((d) => {
      sum += weights[d];
      return { d, cum: sum };
    });
    const r = Math.random() * sum;
    const pick = weighted.find((w) => r <= w.cum)?.d ?? available[0];
    result.push(pools[pick].shift()!);
  }

  return result;
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
    const types =
      questionTypes.length > 0 ? questionTypes : (['mcq', 'image_mcq'] as QuestionType[]);
    const all = this.bank
      .getAll()
      .filter((q) => categories.includes(q.category) && types.includes(q.type));

    const counts = allocateDifficultyCounts(length);
    const usedIds = new Set<string>();
    const categoryUsage = new Map<CategoryId, number>();
    for (const c of categories) {
      categoryUsage.set(c, 0);
    }

    const picked: Question[] = [];
    for (const difficulty of DIFFICULTIES) {
      picked.push(
        ...this.pickForDifficulty(
          all,
          categories,
          difficulty,
          counts[difficulty],
          usedIds,
          categoryUsage,
        ),
      );
    }

    return softOrderByDifficulty(picked);
  }

  private pickForDifficulty(
    all: Question[],
    categories: CategoryId[],
    difficulty: Difficulty,
    count: number,
    usedIds: Set<string>,
    categoryUsage: Map<CategoryId, number>,
  ): Question[] {
    if (count <= 0) return [];

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

      // Prefer underused categories globally, then take one from that category.
      const ranked = [...categories].sort((a, b) => {
        const ua = categoryUsage.get(a) ?? 0;
        const ub = categoryUsage.get(b) ?? 0;
        if (ua !== ub) return ua - ub;
        return Math.random() - 0.5;
      });

      let tookAny = false;
      for (const category of ranked) {
        if (picked.length >= count) break;
        const list = byCategory.get(category) ?? [];
        while (list.length > 0) {
          const next = list.shift()!;
          if (usedIds.has(next.id)) continue;
          picked.push(next);
          usedIds.add(next.id);
          categoryUsage.set(category, (categoryUsage.get(category) ?? 0) + 1);
          tookAny = true;
          break;
        }
        byCategory.set(category, list);
        if (tookAny) break;
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
        categoryUsage.set(
          fallback.category,
          (categoryUsage.get(fallback.category) ?? 0) + 1,
        );
      }
    }

    return picked.slice(0, count);
  }
}
