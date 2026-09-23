import { Injectable } from '@angular/core';
import { getSeedQuestions } from '../../data/questions';
import type { Question } from '../../data/questions/types';

@Injectable({ providedIn: 'root' })
export class QuestionBankService {
  getAll(): Question[] {
    return getSeedQuestions();
  }
}
