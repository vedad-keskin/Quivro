import { describe, expect, it, vi } from 'vitest';
import { QuestionBankService } from './question-bank.service';

describe('QuestionBankService metadata', () => {
  it('indexes the local bank once and exposes only preview metadata', () => {
    const bank = new QuestionBankService();
    const question = bank.getAll()[0];
    const read = vi.spyOn(bank, 'getAll');

    expect(bank.getMetadata(question.id)).toEqual({
      type: question.type,
      category: question.category,
      difficulty: question.difficulty,
    });
    expect(bank.getMetadata('missing-question')).toBeNull();
    bank.getMetadata(question.id);
    expect(read).toHaveBeenCalledTimes(1);
  });
});
