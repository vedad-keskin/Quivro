import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  CATEGORIES,
  DIFFICULTIES,
  type CategoryId,
  type Difficulty,
  type Question,
  type QuestionType,
} from '../../../data/questions/types';
import { LanguageService } from '../../core/language.service';
import { QuestionBankService } from '../../core/question-bank.service';
import { LangToggle } from '../../shared/lang-toggle';

@Component({
  selector: 'app-admin-questions',
  imports: [FormsModule, RouterLink, LangToggle],
  template: `
    <div class="q-page">
      <header class="top">
        <a routerLink="/" class="q-btn q-btn-ghost">← {{ lang.t().back }}</a>
        <app-lang-toggle />
      </header>

      <div class="q-card form">
        <h1>{{ lang.t().addQuestions }}</h1>
        <p class="q-muted">{{ lang.t().overlayHint }}</p>

        <div class="q-grid-2">
          <label>
            <span class="q-label">{{ lang.t().category }}</span>
            <select class="q-select" [(ngModel)]="category">
              @for (c of categories; track c) {
                <option [value]="c">{{ lang.t()[c] }}</option>
              }
            </select>
          </label>
          <label>
            <span class="q-label">{{ lang.t().difficulty }}</span>
            <select class="q-select" [(ngModel)]="difficulty">
              @for (d of difficulties; track d) {
                <option [value]="d">{{ lang.t()[d] }}</option>
              }
            </select>
          </label>
          <label>
            <span class="q-label">{{ lang.t().type }}</span>
            <select class="q-select" [(ngModel)]="type">
              <option value="mcq">{{ lang.t().mcq }}</option>
              <option value="image_mcq">{{ lang.t().imageMcq }}</option>
            </select>
          </label>
          @if (type === 'image_mcq') {
            <label>
              <span class="q-label">{{ lang.t().imageUrl }}</span>
              <input class="q-input" [(ngModel)]="image" placeholder="questions/placeholders/tower.svg" />
            </label>
          }
        </div>

        <label>
          <span class="q-label">{{ lang.t().prompt }} (EN)</span>
          <input class="q-input" [(ngModel)]="promptEn" />
        </label>
        <label>
          <span class="q-label">{{ lang.t().prompt }} (BS)</span>
          <input class="q-input" [(ngModel)]="promptBs" />
        </label>

        @for (i of [0, 1, 2, 3]; track i) {
          <div class="option-row">
            <label class="correct">
              <input type="radio" name="correct" [value]="i" [(ngModel)]="correctIndex" />
              {{ lang.t().correctAnswer }}
            </label>
            <input class="q-input" [placeholder]="lang.t().option + ' ' + (i + 1) + ' EN'" [(ngModel)]="optionsEn[i]" />
            <input class="q-input" [placeholder]="lang.t().option + ' ' + (i + 1) + ' BS'" [(ngModel)]="optionsBs[i]" />
          </div>
        }

        @if (message()) {
          <p class="ok">{{ message() }}</p>
        }

        <div class="actions">
          <button type="button" class="q-btn q-btn-primary" (click)="save()">
            {{ lang.t().saveQuestion }}
          </button>
          <button type="button" class="q-btn q-btn-secondary" (click)="exportJson()">
            {{ lang.t().exportJson }}
          </button>
          <button type="button" class="q-btn q-btn-ghost" (click)="clear()">
            {{ lang.t().clearOverlay }}
          </button>
        </div>

        <section>
          <h2>{{ lang.t().yourOverlay }} ({{ overlay().length }})</h2>
          <ul>
            @for (q of overlay(); track q.id) {
              <li>{{ q.id }} — {{ q.prompt.en }}</li>
            } @empty {
              <li class="q-muted">—</li>
            }
          </ul>
        </section>
      </div>
    </div>
  `,
  styles: `
    .top {
      display: flex;
      justify-content: space-between;
      margin-bottom: 1.25rem;
    }
    .form {
      max-width: 820px;
      margin: 0 auto;
      display: grid;
      gap: 1rem;
    }
    h1, h2 {
      margin: 0;
    }
    .option-row {
      display: grid;
      grid-template-columns: auto 1fr 1fr;
      gap: 0.65rem;
      align-items: center;
    }
    .correct {
      font-weight: 700;
      font-size: 0.85rem;
      color: var(--q-muted);
      display: flex;
      gap: 0.35rem;
      align-items: center;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.65rem;
    }
    .ok {
      color: #15803d;
      font-weight: 700;
    }
    ul {
      margin: 0.5rem 0 0;
      padding-left: 1.1rem;
    }
    @media (max-width: 720px) {
      .option-row {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class AdminQuestionsPage {
  readonly lang = inject(LanguageService);
  private readonly bank = inject(QuestionBankService);

  readonly categories = CATEGORIES;
  readonly difficulties = DIFFICULTIES;
  readonly overlay = signal(this.bank.getOverlay());
  readonly message = signal('');

  category: CategoryId = 'geography';
  difficulty: Difficulty = 'easy';
  type: QuestionType = 'mcq';
  image = '';
  promptEn = '';
  promptBs = '';
  optionsEn = ['', '', '', ''];
  optionsBs = ['', '', '', ''];
  correctIndex: 0 | 1 | 2 | 3 = 0;

  save(): void {
    if (
      !this.promptEn.trim() ||
      !this.promptBs.trim() ||
      this.optionsEn.some((o) => !o.trim()) ||
      this.optionsBs.some((o) => !o.trim()) ||
      (this.type === 'image_mcq' && !this.image.trim())
    ) {
      alert(this.lang.t().fillAllFields);
      return;
    }

    const question: Question = {
      id: this.bank.createQuestionId(this.category, this.difficulty, this.type),
      type: this.type,
      category: this.category,
      difficulty: this.difficulty,
      prompt: { en: this.promptEn.trim(), bs: this.promptBs.trim() },
      options: [
        { en: this.optionsEn[0].trim(), bs: this.optionsBs[0].trim() },
        { en: this.optionsEn[1].trim(), bs: this.optionsBs[1].trim() },
        { en: this.optionsEn[2].trim(), bs: this.optionsBs[2].trim() },
        { en: this.optionsEn[3].trim(), bs: this.optionsBs[3].trim() },
      ],
      correctIndex: Number(this.correctIndex) as 0 | 1 | 2 | 3,
      image: this.type === 'image_mcq' ? this.image.trim() : undefined,
    };

    this.bank.addQuestion(question);
    this.overlay.set(this.bank.getOverlay());
    this.message.set(this.lang.t().questionSaved);
    this.promptEn = '';
    this.promptBs = '';
    this.optionsEn = ['', '', '', ''];
    this.optionsBs = ['', '', '', ''];
    this.image = '';
  }

  exportJson(): void {
    const blob = new Blob([this.bank.exportOverlayJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quivro-questions-overlay.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  clear(): void {
    this.bank.clearOverlay();
    this.overlay.set([]);
    this.message.set('');
  }
}
