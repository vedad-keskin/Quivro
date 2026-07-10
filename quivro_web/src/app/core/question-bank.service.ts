import { Injectable } from '@angular/core';
import { getSeedQuestions } from '../../data/questions';
import type {
  CategoryId,
  Difficulty,
  Question,
  QuestionType,
} from '../../data/questions/types';

const OVERLAY_KEY = 'quivro.questionOverlay';

@Injectable({ providedIn: 'root' })
export class QuestionBankService {
  private overlay: Question[] = this.readOverlay();

  getAll(): Question[] {
    return [...getSeedQuestions(), ...this.overlay];
  }

  getOverlay(): Question[] {
    return [...this.overlay];
  }

  addQuestion(question: Question): void {
    this.overlay = [...this.overlay, question];
    this.persistOverlay();
  }

  clearOverlay(): void {
    this.overlay = [];
    localStorage.removeItem(OVERLAY_KEY);
  }

  exportOverlayJson(): string {
    return JSON.stringify(this.overlay, null, 2);
  }

  createQuestionId(
    category: CategoryId,
    difficulty: Difficulty,
    type: QuestionType,
  ): string {
    const stamp = Date.now().toString(36);
    return `${category.slice(0, 3)}-${difficulty.slice(0, 3)}-${type}-${stamp}`;
  }

  private readOverlay(): Question[] {
    try {
      const raw = localStorage.getItem(OVERLAY_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as Question[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private persistOverlay(): void {
    localStorage.setItem(OVERLAY_KEY, JSON.stringify(this.overlay));
  }
}
