import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  CATEGORIES,
  QUESTION_SECONDS_PRESETS,
  QUESTION_TYPES,
  ROUND_LENGTH_PRESETS,
  type CategoryId,
  type QuestionType,
} from '../../../data/questions/types';
import { GameRoomService } from '../../core/game-room.service';
import { LanguageService } from '../../core/language.service';
import { normalizeRoundLength } from '../../core/round-generator.service';
import {
  clampQuestionSeconds,
  type ScoringMode,
} from '../../core/room.models';
import { SnackbarService } from '../../core/snackbar.service';
import { LangToggle } from '../../shared/lang-toggle';

const ROUND_PREFS_KEY = 'quivro.roundPrefs';

interface RoundPrefs {
  categories: CategoryId[];
  questionTypes: QuestionType[];
  length: number;
  customMode: boolean;
  customLength: number;
  scoringMode: ScoringMode;
  questionSeconds: number;
}

function loadRoundPrefs(): RoundPrefs | null {
  try {
    const raw = localStorage.getItem(ROUND_PREFS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<RoundPrefs>;
    const categories = (parsed.categories ?? []).filter((c): c is CategoryId =>
      (CATEGORIES as readonly string[]).includes(c),
    );
    const questionTypes = (parsed.questionTypes ?? []).filter((t): t is QuestionType =>
      (QUESTION_TYPES as readonly string[]).includes(t),
    );
    const scoringMode: ScoringMode =
      parsed.scoringMode === 'standard' ? 'standard' : 'timed';
    return {
      categories: categories.length > 0 ? categories : [...CATEGORIES],
      questionTypes: questionTypes.length > 0 ? questionTypes : [...QUESTION_TYPES],
      length: Number(parsed.length) || 12,
      customMode: Boolean(parsed.customMode),
      customLength: Number(parsed.customLength) || 12,
      scoringMode,
      questionSeconds: clampQuestionSeconds(Number(parsed.questionSeconds) || 15),
    };
  } catch {
    return null;
  }
}

@Component({
  selector: 'app-create-round',
  imports: [FormsModule, RouterLink, LangToggle],
  template: `
    <div class="q-page">
      <header class="top">
        <a routerLink="/" class="q-btn q-btn-ghost">← {{ lang.t().back }}</a>
        <app-lang-toggle />
      </header>

      <div class="panel">
        <div class="brand">
          <h1>{{ lang.t().createRound }}</h1>
          <div class="q-brand-line"></div>
        </div>

        <section>
          <label class="q-label">{{ lang.t().categories }}</label>
          <div class="chips">
            @for (cat of categories; track cat) {
              <button
                type="button"
                class="q-chip"
                [class.active]="selected().includes(cat)"
                (click)="toggleCategory(cat)"
              >
                {{ categoryLabel(cat) }}
              </button>
            }
          </div>
          @if (selected().length === 0) {
            <p class="hint warn">{{ lang.t().selectAtLeastOne }}</p>
          }
        </section>

        <section>
          <label class="q-label">{{ lang.t().questionTypes }}</label>
          <div class="chips">
            @for (t of questionTypes; track t) {
              <button
                type="button"
                class="q-chip"
                [class.active]="types().includes(t)"
                (click)="toggleType(t)"
              >
                {{ typeLabel(t) }}
              </button>
            }
          </div>
          @if (types().length === 0) {
            <p class="hint warn">{{ lang.t().selectAtLeastOneType }}</p>
          }
        </section>

        <section>
          <label class="q-label">{{ lang.t().scoringMode }}</label>
          <div class="chips">
            <button
              type="button"
              class="q-chip"
              [class.active]="scoringMode() === 'timed'"
              (click)="scoringMode.set('timed')"
            >
              {{ lang.t().scoringTimed }}
            </button>
            <button
              type="button"
              class="q-chip"
              [class.active]="scoringMode() === 'standard'"
              (click)="scoringMode.set('standard')"
            >
              {{ lang.t().scoringStandard }}
            </button>
          </div>
        </section>

        <section>
          <label class="q-label">{{ lang.t().questionTime }}</label>
          <div class="chips">
            @for (n of timerPresets; track n) {
              <button
                type="button"
                class="q-chip"
                [class.active]="questionSeconds() === n"
                (click)="questionSeconds.set(n)"
              >
                {{ n }}{{ lang.t().seconds }}
              </button>
            }
          </div>
        </section>

        <section>
          <label class="q-label">{{ lang.t().roundLength }}</label>
          <div class="chips">
            @for (n of presets; track n) {
              <button
                type="button"
                class="q-chip"
                [class.active]="!customMode() && length() === n"
                (click)="pickPreset(n)"
              >
                {{ n }}
              </button>
            }
            <button
              type="button"
              class="q-chip"
              [class.active]="customMode()"
              (click)="customMode.set(true)"
            >
              {{ lang.t().custom }}
            </button>
          </div>
          @if (customMode()) {
            <input
              class="q-input custom-input"
              type="number"
              min="3"
              max="60"
              [ngModel]="customLength()"
              (ngModelChange)="onCustom($event)"
            />
          }
          <p class="hint">
            {{ effectiveLength() }} {{ lang.t().questions }}
            · {{ bandSize() }} {{ lang.t().easy }} /
            {{ bandSize() }} {{ lang.t().medium }} /
            {{ bandSize() }} {{ lang.t().hard }}
          </p>
        </section>

        @if (!rooms.isLive) {
          <p class="hint warn">{{ lang.t().firebaseMissing }}</p>
        }

        <button
          type="button"
          class="q-btn q-btn-outline"
          [disabled]="!canCreate() || creating()"
          (click)="create()"
        >
          {{ lang.t().generateCode }}
        </button>
      </div>
    </div>
  `,
  styles: `
    .top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
    }
    .panel {
      max-width: 720px;
      margin: 0 auto;
      display: grid;
      gap: 1.5rem;
    }
    .brand h1 {
      margin: 0;
      font-size: clamp(1.8rem, 3vw, 2.4rem);
      font-weight: 900;
    }
    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.6rem;
    }
    .hint {
      margin: 0.65rem 0 0;
      color: var(--q-muted);
      font-weight: 700;
    }
    .warn {
      color: #db2777;
    }
    .custom-input {
      margin-top: 0.75rem;
      max-width: 10rem;
    }
  `,
})
export class CreateRoundPage {
  readonly lang = inject(LanguageService);
  readonly rooms = inject(GameRoomService);
  private readonly router = inject(Router);
  private readonly snack = inject(SnackbarService);

  readonly categories = CATEGORIES;
  readonly questionTypes = QUESTION_TYPES;
  readonly presets = ROUND_LENGTH_PRESETS;
  readonly timerPresets = QUESTION_SECONDS_PRESETS;

  private readonly saved = loadRoundPrefs();
  readonly selected = signal<CategoryId[]>(this.saved?.categories ?? [...CATEGORIES]);
  readonly types = signal<QuestionType[]>(this.saved?.questionTypes ?? [...QUESTION_TYPES]);
  readonly length = signal(this.saved?.length ?? 12);
  readonly customMode = signal(this.saved?.customMode ?? false);
  readonly customLength = signal(this.saved?.customLength ?? 12);
  readonly scoringMode = signal<ScoringMode>(this.saved?.scoringMode ?? 'timed');
  readonly questionSeconds = signal(this.saved?.questionSeconds ?? 15);
  readonly creating = signal(false);

  readonly effectiveLength = computed(() =>
    normalizeRoundLength(this.customMode() ? this.customLength() : this.length()),
  );
  readonly bandSize = computed(() => this.effectiveLength() / 3);
  readonly canCreate = computed(
    () =>
      this.selected().length > 0 &&
      this.types().length > 0 &&
      this.rooms.isLive,
  );

  constructor() {
    effect(() => {
      const prefs: RoundPrefs = {
        categories: this.selected(),
        questionTypes: this.types(),
        length: this.length(),
        customMode: this.customMode(),
        customLength: this.customLength(),
        scoringMode: this.scoringMode(),
        questionSeconds: this.questionSeconds(),
      };
      localStorage.setItem(ROUND_PREFS_KEY, JSON.stringify(prefs));
    });
  }

  categoryLabel(cat: CategoryId): string {
    return this.lang.t()[cat];
  }

  typeLabel(t: QuestionType): string {
    return t === 'mcq' ? this.lang.t().mcq : this.lang.t().imageMcq;
  }

  toggleCategory(cat: CategoryId): void {
    const cur = this.selected();
    this.selected.set(
      cur.includes(cat) ? cur.filter((c) => c !== cat) : [...cur, cat],
    );
  }

  toggleType(t: QuestionType): void {
    const cur = this.types();
    this.types.set(cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]);
  }

  pickPreset(n: number): void {
    this.customMode.set(false);
    this.length.set(n);
  }

  onCustom(value: number | string): void {
    this.customMode.set(true);
    this.customLength.set(Number(value) || 3);
  }

  async create(): Promise<void> {
    if (!this.canCreate() || this.creating()) return;
    this.creating.set(true);
    try {
      const code = await this.rooms.createRoom({
        categories: this.selected(),
        questionTypes: this.types(),
        roundLength: this.effectiveLength(),
        language: this.lang.lang(),
        scoringMode: this.scoringMode(),
        questionSeconds: clampQuestionSeconds(this.questionSeconds()),
      });
      await this.router.navigate(['/lobby', code]);
    } catch (e) {
      console.error(e);
      const msg =
        e instanceof Error && e.message === 'NO_QUESTIONS'
          ? this.lang.t().noQuestions
          : this.lang.t().createFailed;
      this.snack.error(msg);
    } finally {
      this.creating.set(false);
    }
  }
}
