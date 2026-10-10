import { Injectable } from '@angular/core';
import { getSeedQuestions } from '../../data/questions';
import type { Question } from '../../data/questions/types';

export type QuestionMetadata = Readonly<Pick<Question, 'type' | 'category' | 'difficulty'>>;

@Injectable({ providedIn: 'root' })
export class QuestionBankService {
  private metadataById: Map<string, QuestionMetadata> | null = null;

  getAll(): Question[] {
    return getSeedQuestions();
  }

  /** Local metadata only: no question text, answers, image downloads, or Firebase calls. */
  getMetadata(id: string): QuestionMetadata | null {
    this.metadataById ??= new Map(
      this.getAll().map(({ id, type, category, difficulty }) => [
        id,
        { type, category, difficulty },
      ]),
    );
    return this.metadataById.get(id) ?? null;
  }
}
