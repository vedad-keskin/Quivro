import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  CATEGORIES,
  MIN_ROUND_LENGTH,
  QUESTION_SECONDS_PRESETS,
  QUESTION_TYPES,
  ROUND_LENGTH_PRESETS,
  type CategoryId,
  type QuestionType,
} from '../../../data/questions/types';
import type { UiStrings } from '../../../i18n/en';
import { EntitlementService } from '../../core/entitlement.service';
import { FREE_CATEGORIES, FREE_MAX_ROUND_LENGTH } from '../../core/entitlements';
import { GameRoomService } from '../../core/game-room.service';
import { LanguageService } from '../../core/language.service';
import {
  isValidRoundLength,
  normalizeRoundLength,
  parseCustomRoundLength,
  roundLengthIssue,
} from '../../core/round-generator.service';
import {
  clampQuestionSeconds,
  type ScoringMode,
} from '../../core/room.models';
import { SnackbarService } from '../../core/snackbar.service';
import { SettingsChips } from '../../shared/settings-chips';
import { UpgradeDialogService } from '../../shared/upgrade-dialog.service';

const ROUND_PREFS_KEY = 'quivro.roundPrefs';

interface RoundPrefs {
  categories: CategoryId[];
  categoryMemory: CategoryId[];
  questionTypes: QuestionType[];
  length: number;
  customMode: boolean;
  customLength: number;
  scoringMode: ScoringMode;
  questionSeconds: number;
}

function filterCategories(raw: unknown): CategoryId[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((c): c is CategoryId =>
    (CATEGORIES as readonly string[]).includes(c as string),
  );
}

function loadRoundPrefs(): RoundPrefs | null {
  try {
    const raw = localStorage.getItem(ROUND_PREFS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<RoundPrefs>;
    const questionTypes = (parsed.questionTypes ?? []).filter((t): t is QuestionType =>
      (QUESTION_TYPES as readonly string[]).includes(t),
    );
    const types =
      questionTypes.length > 0 ? questionTypes : [...QUESTION_TYPES];
    const needsCats = types.includes('mcq');
    const memory = filterCategories(parsed.categoryMemory);
    const categories = filterCategories(parsed.categories);
    const scoringMode: ScoringMode =
      parsed.scoringMode === 'standard' ? 'standard' : 'timed';
    const rawLength = Number(parsed.length) || 10;
    const lengthIsPreset = (ROUND_LENGTH_PRESETS as readonly number[]).includes(
      rawLength,
    );
    const remembered =
      memory.length > 0
        ? memory
        : categories.length > 0
          ? categories
          : [...CATEGORIES];
    return {
      categories: needsCats
        ? categories.length > 0
          ? categories
          : [...remembered]
        : [],
      categoryMemory: remembered,
      questionTypes: types,
      length: lengthIsPreset ? rawLength : 10,
      customMode: Boolean(parsed.customMode),
      customLength: parseCustomRoundLength(Number(parsed.customLength) || 10),
      scoringMode,
      questionSeconds: clampQuestionSeconds(Number(parsed.questionSeconds) || 15),
    };
  } catch {
    return null;
  }
}

@Component({
  selector: 'app-create-round',
  imports: [FormsModule, RouterLink, SettingsChips],
  template: `
    <div class="q-page">
      <header class="top">
        <a routerLink="/" class="q-btn q-btn-ghost">← {{ lang.t().back }}</a>
        <app-settings-chips />
      </header>

      <div class="panel">
        <div class="brand">
          <h1>{{ lang.t().createRound }}</h1>
          <div class="q-brand-line"></div>
        </div>

        <section [class.cats-disabled]="!needsCategories()">
          <label class="q-label">{{ lang.t().categories }}</label>
          <div class="chips">
            @for (cat of categories; track cat) {
              <span class="hint-wrap">
                <button
                  type="button"
                  class="q-chip"
                  [class.active]="selected().includes(cat)"
                  [class.locked]="ent.categoryLocked(cat)"
                  [disabled]="!needsCategories()"
                  (click)="toggleCategory(cat)"
                >
                  {{ categoryLabel(cat) }}
                  @if (ent.categoryLocked(cat)) {
                    <span class="lock" aria-hidden="true">🔒</span>
                  } @else if (isFreeThisWeek(cat)) {
                    <span class="gift" aria-hidden="true">★</span>
                  }
                </button>
                <div class="preview">
                  <div class="p-head">
                    <span class="p-emoji">{{ categoryInfo[cat].emoji }}</span>
                    <strong class="p-title">{{ categoryLabel(cat) }}</strong>
                  </div>
                  <p class="p-body">{{ categoryDesc(cat) }}</p>
                  @if (ent.categoryLocked(cat)) {
                    <p class="p-tag">🔒 {{ lang.t().proLocked }}</p>
                  } @else if (isFreeThisWeek(cat)) {
                    <p class="p-tag free">★ {{ lang.t().freeThisWeek }}</p>
                  }
                </div>
              </span>
            }
          </div>
          @if (needsCategories() && selected().length === 0) {
            <p class="hint warn">{{ lang.t().selectAtLeastOne }}</p>
          }
        </section>

        <section>
          <label class="q-label">{{ lang.t().questionTypes }}</label>
          <div class="chips">
            @for (t of questionTypes; track t) {
              <span class="hint-wrap">
                <button
                  type="button"
                  class="q-chip"
                  [class.active]="types().includes(t)"
                  [class.locked]="ent.questionTypeLocked(t)"
                  (click)="toggleType(t)"
                >
                  {{ typeLabel(t) }}
                  @if (ent.questionTypeLocked(t)) {
                    <span class="lock" aria-hidden="true">🔒</span>
                  }
                </button>
                <div class="preview" [class.has-img]="t === 'image_mcq'">
                  <div class="p-head">
                    <span class="p-emoji">{{ typeInfo[t].emoji }}</span>
                    <strong class="p-title">{{ typeLabel(t) }}</strong>
                  </div>
                  <p class="p-body">{{ typeDesc(t) }}</p>
                  @if (ent.questionTypeLocked(t)) {
                    <p class="p-tag">🔒 {{ lang.t().proLocked }}</p>
                  }
                  @if (t === 'image_mcq') {
                    <img class="p-img" [src]="randomPreviewImage()" alt="" />
                  }
                </div>
              </span>
            }
          </div>
          @if (types().length === 0) {
            <p class="hint warn">{{ lang.t().selectAtLeastOneType }}</p>
          }
        </section>

        <section>
          <label class="q-label">{{ lang.t().scoringMode }}</label>
          <div class="chips">
            <span class="hint-wrap">
              <button
                type="button"
                class="q-chip"
                [class.active]="scoringMode() === 'standard'"
                (click)="scoringMode.set('standard')"
              >
                {{ lang.t().scoringStandard }}
              </button>
              <div class="preview">
                <div class="p-head">
                  <span class="p-emoji">{{ scoringInfo.standard.emoji }}</span>
                  <strong class="p-title">{{ lang.t().scoringStandard }}</strong>
                </div>
                <p class="p-body">{{ scoringDesc('standard') }}</p>
              </div>
            </span>
            <span class="hint-wrap">
              <button
                type="button"
                class="q-chip"
                [class.active]="scoringMode() === 'timed'"
                [class.locked]="ent.scoringModeLocked('timed')"
                (click)="pickScoring('timed')"
              >
                {{ lang.t().scoringTimed }}
                @if (ent.scoringModeLocked('timed')) {
                  <span class="lock" aria-hidden="true">🔒</span>
                }
              </button>
              <div class="preview">
                <div class="p-head">
                  <span class="p-emoji">{{ scoringInfo.timed.emoji }}</span>
                  <strong class="p-title">{{ lang.t().scoringTimed }}</strong>
                </div>
                <p class="p-body">{{ scoringDesc('timed') }}</p>
                @if (ent.scoringModeLocked('timed')) {
                  <p class="p-tag">🔒 {{ lang.t().proLocked }}</p>
                }
              </div>
            </span>
          </div>
        </section>

        <section>
          <label class="q-label">{{ lang.t().questionTime }}</label>
          <div class="chips">
            @for (n of timerPresets; track n) {
              <span class="hint-wrap">
                <button
                  type="button"
                  class="q-chip"
                  [class.active]="questionSeconds() === n"
                  (click)="questionSeconds.set(n)"
                >
                  {{ n }}{{ lang.t().seconds }}
                </button>
                <div class="preview">
                  <div class="p-head">
                    <span class="p-emoji">⏱️</span>
                    <strong class="p-title">{{ n }} {{ lang.t().seconds }}</strong>
                  </div>
                  <p class="p-body">{{ lang.t().descQuestionTime }}</p>
                </div>
              </span>
            }
          </div>
        </section>

        <section>
          <label class="q-label">{{ lang.t().roundLength }}</label>
          <div class="chips">
            @for (n of presets; track n) {
              <span class="hint-wrap">
                <button
                  type="button"
                  class="q-chip"
                  [class.active]="!customMode() && length() === n"
                  [class.locked]="ent.roundLengthLocked(n)"
                  (click)="pickPreset(n)"
                >
                  {{ n }}
                  @if (ent.roundLengthLocked(n)) {
                    <span class="lock" aria-hidden="true">🔒</span>
                  }
                </button>
                <div class="preview">
                  <div class="p-head">
                    <span class="p-emoji">📏</span>
                    <strong class="p-title">{{ n }} {{ lang.t().questions }}</strong>
                  </div>
                  <p class="p-body">{{ lang.t().descRoundLength }}</p>
                  @if (ent.roundLengthLocked(n)) {
                    <p class="p-tag">🔒 {{ lang.t().proLocked }}</p>
                  }
                </div>
              </span>
            }
            <span class="hint-wrap">
              <button
                type="button"
                class="q-chip"
                [class.active]="customMode()"
                [class.locked]="ent.customLengthLocked()"
                (click)="pickCustom()"
              >
                {{ lang.t().custom }}
                @if (ent.customLengthLocked()) {
                  <span class="lock" aria-hidden="true">🔒</span>
                }
              </button>
              <div class="preview">
                <div class="p-head">
                  <span class="p-emoji">🎚️</span>
                  <strong class="p-title">{{ lang.t().custom }}</strong>
                </div>
                <p class="p-body">{{ lang.t().descRoundLength }}</p>
                @if (ent.customLengthLocked()) {
                  <p class="p-tag">🔒 {{ lang.t().proLocked }}</p>
                }
              </div>
            </span>
          </div>
          @if (customMode()) {
            <input
              class="q-input custom-input"
              type="number"
              [min]="minRoundLength"
              [ngModel]="customLength()"
              (ngModelChange)="onCustom($event)"
            />
          }
          <p class="hint" [class.warn]="customMode() && !customLengthValid()">
            {{ effectiveLength() }} {{ lang.t().questions }}
            · {{ lang.t().difficultyMix }}
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
    .cats-disabled {
      opacity: 0.45;
    }
    .cats-disabled .q-chip {
      pointer-events: none;
    }

    /* Locked controls stay visible and clickable — clicking opens the upgrade dialog. */
    .q-chip.locked {
      opacity: 0.6;
    }
    .q-chip.locked:hover {
      opacity: 0.85;
    }
    .lock,
    .gift {
      margin-left: 0.3rem;
      font-size: 0.72em;
      line-height: 1;
    }
    .gift {
      color: #f59e0b;
    }
    .p-tag {
      margin: 0.15rem 0 0;
      font-size: 0.74rem;
      font-weight: 900;
      color: var(--q-blue);
      letter-spacing: 0.01em;
    }
    .p-tag.free {
      color: #f59e0b;
    }

    /* Fun hover preview cards */
    .hint-wrap {
      position: relative;
      display: inline-flex;
    }
    .preview {
      position: absolute;
      bottom: calc(100% + 12px);
      left: 50%;
      width: max-content;
      min-width: min(252px, 90vw);
      max-width: 90vw;
      display: grid;
      gap: 0.3rem;
      padding: 0.65rem 0.75rem 0.7rem;
      text-align: left;
      border: 2px solid transparent;
      border-radius: 16px;
      background:
        linear-gradient(var(--q-card), var(--q-card)) padding-box,
        var(--q-gradient) border-box;
      box-shadow: var(--q-shadow);
      opacity: 0;
      pointer-events: none;
      z-index: 50;
      transform: translateX(-50%) translateY(6px) scale(0.96);
      transform-origin: bottom center;
      transition:
        opacity 0.18s ease,
        transform 0.18s ease;
    }
    .preview.has-img {
      min-width: 0;
      grid-template-columns: max-content max-content;
      grid-template-rows: auto auto;
      column-gap: 0.55rem;
      row-gap: 0.2rem;
      align-items: start;
      padding: 0 0 0 0.75rem;
    }
    .preview.has-img .p-head {
      grid-column: 1;
      padding-top: 0.65rem;
    }
    .preview.has-img .p-body {
      grid-column: 1;
      padding-bottom: 0.7rem;
      padding-right: 0.15rem;
    }
    .preview.has-img .p-img {
      grid-column: 2;
      grid-row: 1 / span 2;
      width: auto;
      height: 128px;
      max-width: none;
      max-height: none;
      margin: 0;
      align-self: stretch;
      justify-self: end;
      border: none;
      border-radius: 0 14px 14px 0;
      object-fit: cover;
    }
    .hint-wrap:hover .preview,
    .hint-wrap:focus-within .preview {
      opacity: 1;
      transform: translateX(-50%) translateY(0) scale(1);
    }
    .preview::after {
      content: '';
      position: absolute;
      left: 50%;
      bottom: -8px;
      width: 14px;
      height: 14px;
      transform: translateX(-50%) rotate(45deg);
      background:
        linear-gradient(var(--q-card), var(--q-card)) padding-box,
        var(--q-gradient) border-box;
      border: 2px solid transparent;
      border-radius: 0 0 3px 0;
      z-index: 0;
    }
    .preview::before {
      content: '';
      position: absolute;
      left: 50%;
      bottom: 0;
      width: 22px;
      height: 10px;
      transform: translateX(-50%);
      background: var(--q-card);
      z-index: 1;
    }
    .p-head {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      width: max-content;
    }
    .p-emoji {
      font-size: 1.15rem;
      line-height: 1;
      flex-shrink: 0;
    }
    .p-title {
      font-size: 0.92rem;
      font-weight: 900;
      color: var(--q-navy);
      line-height: 1.2;
      white-space: nowrap;
    }
    .p-body {
      margin: 0;
      width: 0;
      min-width: 100%;
      font-size: 0.78rem;
      font-weight: 700;
      line-height: 1.3;
      color: var(--q-muted);
    }
    .p-img {
      width: auto;
      height: auto;
      max-width: 100%;
      max-height: 118px;
      margin: 0.15rem auto 0;
      display: block;
      border-radius: 10px;
      border: 2px solid var(--q-border);
    }
    @media (hover: none) {
      .preview {
        display: none;
      }
    }
  `,
})
export class CreateRoundPage {
  readonly lang = inject(LanguageService);
  readonly rooms = inject(GameRoomService);
  readonly ent = inject(EntitlementService);
  private readonly router = inject(Router);
  private readonly snack = inject(SnackbarService);
  private readonly upgrade = inject(UpgradeDialogService);

  readonly categories = CATEGORIES;
  readonly questionTypes = QUESTION_TYPES;
  readonly presets = ROUND_LENGTH_PRESETS;
  readonly timerPresets = QUESTION_SECONDS_PRESETS;
  readonly minRoundLength = MIN_ROUND_LENGTH;

  /** Emoji + description key for each category hover card. */
  readonly categoryInfo: Record<CategoryId, { emoji: string; descKey: keyof UiStrings }> = {
    geography: { emoji: '🌍', descKey: 'descGeography' },
    biology: { emoji: '🧬', descKey: 'descBiology' },
    technology: { emoji: '💻', descKey: 'descTechnology' },
    history: { emoji: '🏛️', descKey: 'descHistory' },
    sports: { emoji: '⚽', descKey: 'descSports' },
    movies: { emoji: '🎬', descKey: 'descMovies' },
    famous: { emoji: '🌟', descKey: 'descFamous' },
    islam: { emoji: '☪️', descKey: 'descIslam' },
    food: { emoji: '🍔', descKey: 'descFood' },
    images: { emoji: '🖼️', descKey: 'descPictureQ' },
  };
  readonly typeInfo: Record<QuestionType, { emoji: string; descKey: keyof UiStrings }> = {
    mcq: { emoji: '✏️', descKey: 'descTextQ' },
    image_mcq: { emoji: '🖼️', descKey: 'descPictureQ' },
  };
  readonly scoringInfo: Record<ScoringMode, { emoji: string; descKey: keyof UiStrings }> = {
    standard: { emoji: '🎯', descKey: 'descScoringStandard' },
    timed: { emoji: '⚡', descKey: 'descScoringTimed' },
  };

  /** Stable random image from the web pool for the picture-questions preview. */
  readonly randomPreviewImage = signal(
    `/questions/images/${Math.floor(Math.random() * 150) + 1}.jpg`,
  );

  private readonly saved = loadRoundPrefs();
  readonly selected = signal<CategoryId[]>(this.saved?.categories ?? [...CATEGORIES]);
  readonly categoryMemory = signal<CategoryId[]>(
    this.saved?.categoryMemory ?? this.saved?.categories ?? [...CATEGORIES],
  );
  readonly types = signal<QuestionType[]>(this.saved?.questionTypes ?? [...QUESTION_TYPES]);
  readonly length = signal(this.saved?.length ?? 10);
  readonly customMode = signal(this.saved?.customMode ?? false);
  readonly customLength = signal(this.saved?.customLength ?? 10);
  readonly scoringMode = signal<ScoringMode>(this.saved?.scoringMode ?? 'timed');
  readonly questionSeconds = signal(this.saved?.questionSeconds ?? 15);
  readonly creating = signal(false);

  readonly effectiveLength = computed(() =>
    this.customMode() ? this.customLength() : this.length(),
  );
  readonly customLengthValid = computed(
    () => !this.customMode() || isValidRoundLength(this.customLength()),
  );
  readonly needsCategories = computed(() => this.types().includes('mcq'));
  readonly canCreate = computed(
    () =>
      this.types().length > 0 &&
      (!this.needsCategories() || this.selected().length > 0) &&
      this.customLengthValid() &&
      this.rooms.isLive,
  );

  constructor() {
    // Web-only opportunistic cleanup of expired rooms on app entry (throttled).
    void this.rooms.sweepExpiredRooms();
    // Saved prefs and defaults can name Pro-only options. Re-run whenever the
    // entitlement resolves, which includes the initial Firestore round-trip.
    effect(() => {
      const pro = this.ent.isPro();
      if (!pro) untracked(() => this.dropLockedSelections());
    });
    effect(() => {
      const prefs: RoundPrefs = {
        categories: this.selected(),
        categoryMemory: this.categoryMemory(),
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

  categoryDesc(cat: CategoryId): string {
    return this.lang.t()[this.categoryInfo[cat].descKey];
  }

  typeDesc(t: QuestionType): string {
    return this.lang.t()[this.typeInfo[t].descKey];
  }

  scoringDesc(mode: ScoringMode): string {
    return this.lang.t()[this.scoringInfo[mode].descKey];
  }

  isFreeThisWeek(cat: CategoryId): boolean {
    return !this.ent.isPro() && cat === this.ent.freeThisWeek();
  }

  /** Strips Pro-only picks so a free host can never submit a locked config. */
  private dropLockedSelections(): void {
    const cats = this.selected().filter((c) => !this.ent.categoryLocked(c));
    if (cats.length !== this.selected().length) {
      this.selected.set(cats.length > 0 ? cats : [...FREE_CATEGORIES]);
    }
    const memory = this.categoryMemory().filter((c) => !this.ent.categoryLocked(c));
    if (memory.length !== this.categoryMemory().length) {
      this.categoryMemory.set(memory.length > 0 ? memory : [...FREE_CATEGORIES]);
    }
    const types = this.types().filter((t) => !this.ent.questionTypeLocked(t));
    if (types.length !== this.types().length) {
      this.types.set(types.length > 0 ? types : ['mcq']);
    }
    if (this.ent.scoringModeLocked(this.scoringMode())) this.scoringMode.set('standard');
    if (this.customMode()) this.customMode.set(false);
    if (this.ent.roundLengthLocked(this.length())) this.length.set(FREE_MAX_ROUND_LENGTH);
  }

  toggleCategory(cat: CategoryId): void {
    if (!this.needsCategories()) return;
    if (this.ent.categoryLocked(cat)) {
      this.upgrade.show();
      return;
    }
    const cur = this.selected();
    const next = cur.includes(cat)
      ? cur.filter((c) => c !== cat)
      : [...cur, cat];
    this.selected.set(next);
    if (next.length > 0) this.categoryMemory.set([...next]);
  }

  toggleType(t: QuestionType): void {
    if (this.ent.questionTypeLocked(t)) {
      this.upgrade.show();
      return;
    }
    const cur = this.types();
    const turningOff = cur.includes(t);
    const next = turningOff ? cur.filter((x) => x !== t) : [...cur, t];

    if (t === 'mcq') {
      if (turningOff) {
        const cats = this.selected();
        if (cats.length > 0) this.categoryMemory.set([...cats]);
        this.selected.set([]);
      } else {
        const mem = this.categoryMemory();
        const restored = mem.length > 0 ? [...mem] : [...CATEGORIES];
        this.selected.set(restored.filter((c) => !this.ent.categoryLocked(c)));
      }
    }

    this.types.set(next);
  }

  pickScoring(mode: ScoringMode): void {
    if (this.ent.scoringModeLocked(mode)) {
      this.upgrade.show();
      return;
    }
    this.scoringMode.set(mode);
  }

  pickPreset(n: number): void {
    if (this.ent.roundLengthLocked(n)) {
      this.upgrade.show();
      return;
    }
    this.customMode.set(false);
    this.length.set(n);
  }

  pickCustom(): void {
    if (this.ent.customLengthLocked()) {
      this.upgrade.show();
      return;
    }
    this.customMode.set(true);
  }

  onCustom(value: number | string): void {
    this.customMode.set(true);
    const prev = this.customLength();
    const next = parseCustomRoundLength(value);
    this.customLength.set(next);
    if (
      roundLengthIssue(next) === 'high' &&
      roundLengthIssue(prev) !== 'high'
    ) {
      this.snack.error(this.lang.t().roundLengthTooHigh);
    }
  }

  async create(): Promise<void> {
    if (!this.canCreate() || this.creating()) return;
    this.creating.set(true);
    try {
      const code = await this.rooms.createRoom({
        categories: this.selected(),
        questionTypes: this.types(),
        roundLength: normalizeRoundLength(this.effectiveLength()),
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
