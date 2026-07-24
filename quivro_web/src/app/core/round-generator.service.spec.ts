import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import type { Question } from '../../data/questions/types';
import { QuestionBankService } from './question-bank.service';
import { RoundGeneratorService } from './round-generator.service';

function q(
  id: string,
  category: Question['category'],
  difficulty: Question['difficulty'],
  type: Question['type'] = 'mcq',
): Question {
  return {
    id,
    type,
    category,
    difficulty,
    prompt: { en: id, bs: id },
    options: [
      { en: 'A', bs: 'A' },
      { en: 'B', bs: 'B' },
      { en: 'C', bs: 'C' },
      { en: 'D', bs: 'D' },
    ],
    correctIndex: 0,
  };
}

describe('RoundGeneratorService excludeIds', () => {
  it('skips previously used IDs across generates', () => {
    const bank: Question[] = [
      q('bio-e-1', 'biology', 'easy'),
      q('bio-e-2', 'biology', 'easy'),
      q('bio-e-3', 'biology', 'easy'),
      q('bio-m-1', 'biology', 'medium'),
      q('bio-m-2', 'biology', 'medium'),
      q('bio-m-3', 'biology', 'medium'),
      q('bio-h-1', 'biology', 'hard'),
      q('bio-h-2', 'biology', 'hard'),
      q('bio-h-3', 'biology', 'hard'),
    ];

    TestBed.configureTestingModule({
      providers: [
        RoundGeneratorService,
        {
          provide: QuestionBankService,
          useValue: { getAll: () => bank, overlay: [] },
        },
      ],
    });
    const generator = TestBed.inject(RoundGeneratorService);

    const exclude = new Set<string>();
    const first = generator.generate(['biology'], 3, ['mcq'], exclude);
    expect(first).toHaveLength(3);
    for (const question of first) exclude.add(question.id);

    const second = generator.generate(['biology'], 3, ['mcq'], exclude);
    expect(second).toHaveLength(3);
    const overlap = second.filter((question) =>
      first.some((f) => f.id === question.id),
    );
    expect(overlap).toHaveLength(0);
  });

  it('releases exclude when a difficulty pool is exhausted', () => {
    const bank: Question[] = [
      q('bio-e-1', 'biology', 'easy'),
      q('bio-m-1', 'biology', 'medium'),
      q('bio-h-1', 'biology', 'hard'),
    ];

    TestBed.configureTestingModule({
      providers: [
        RoundGeneratorService,
        {
          provide: QuestionBankService,
          useValue: { getAll: () => bank, overlay: [] },
        },
      ],
    });
    const generator = TestBed.inject(RoundGeneratorService);

    const exclude = new Set(bank.map((question) => question.id));
    const round = generator.generate(['biology'], 3, ['mcq'], exclude);
    expect(round).toHaveLength(3);
    expect(exclude.size).toBe(0);
  });
});
