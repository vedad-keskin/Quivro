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
  cyclePowerUpSlot,
  EMPTY_POWER_UP_SLOTS,
  normalizePowerUpSlots,
  POWER_UP_CATALOG,
  type PowerUpSlots,
  type ScoringMode,
} from '../../core/room.models';
import { SnackbarService } from '../../core/snackbar.service';
import { SettingsChips } from '../../shared/settings-chips';
import { StudioFooter } from '../../shared/studio-footer';
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
  powerUpSlots: PowerUpSlots;
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
      powerUpSlots: normalizePowerUpSlots(parsed.powerUpSlots),
    };
  } catch {
    return null;
  }
}

@Component({
  selector: 'app-create-round',
  imports: [FormsModule, RouterLink, SettingsChips, StudioFooter],
  template: `
    <div class="q-page create">
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
          <div class="tiles tiles-cats">
            @for (cat of categories; track cat) {
              <button
                type="button"
                class="tile"
                [class.active]="selected().includes(cat)"
                [class.locked]="ent.categoryLocked(cat)"
                [disabled]="!needsCategories()"
                [attr.aria-pressed]="selected().includes(cat)"
                (click)="toggleCategory(cat)"
              >
                <span class="tile-icon">
                  <img class="art" [src]="categoryInfo[cat].icon" alt="" />
                  @if (ent.categoryLocked(cat)) {
                    <img class="stamp" src="/brand/pro_badge.png" [alt]="lang.t().proLocked" />
                  }
                </span>
                <span class="tile-copy">
                  <strong>{{ categoryLabel(cat) }}</strong>
                  <span>{{ categoryDesc(cat) }}</span>
                </span>
                @if (isFreeThisWeek(cat)) {
                  <img class="free-mark" src="/brand/free_rotation.png" [alt]="lang.t().freeThisWeek" />
                }
              </button>
            }
          </div>
          @if (needsCategories() && selected().length === 0) {
            <p class="hint warn">{{ lang.t().selectAtLeastOne }}</p>
          }
        </section>

        <div class="pair">
          <section>
            <label class="q-label">{{ lang.t().questionTypes }}</label>
            <div class="tiles">
              @for (t of questionTypes; track t) {
                <button
                  type="button"
                  class="tile"
                  [class.active]="types().includes(t)"
                  [class.locked]="ent.questionTypeLocked(t)"
                  [attr.aria-pressed]="types().includes(t)"
                  (click)="toggleType(t)"
                >
                  <span class="tile-icon">
                    <img class="art" [src]="typeInfo[t].icon" alt="" />
                    @if (ent.questionTypeLocked(t)) {
                      <img class="stamp" src="/brand/pro_badge.png" [alt]="lang.t().proLocked" />
                    }
                  </span>
                  <span class="tile-copy">
                    <strong>{{ typeLabel(t) }}</strong>
                    <span>{{ typeDesc(t) }}</span>
                  </span>
                </button>
              }
            </div>
            @if (types().length === 0) {
              <p class="hint warn">{{ lang.t().selectAtLeastOneType }}</p>
            }
          </section>

          <section>
            <label class="q-label">{{ lang.t().scoringMode }}</label>
            <div class="tiles">
              <button
                type="button"
                class="tile"
                [class.active]="scoringMode() === 'standard'"
                [attr.aria-pressed]="scoringMode() === 'standard'"
                (click)="scoringMode.set('standard')"
              >
                <span class="tile-icon">
                  <img class="art" src="/room-icons/standard.png" alt="" />
                </span>
                <span class="tile-copy">
                  <strong>{{ lang.t().scoringStandard }}</strong>
                  <span>{{ scoringDesc('standard') }}</span>
                </span>
              </button>
              <button
                type="button"
                class="tile"
                [class.active]="scoringMode() === 'timed'"
                [class.locked]="ent.scoringModeLocked('timed')"
                [attr.aria-pressed]="scoringMode() === 'timed'"
                (click)="pickScoring('timed')"
              >
                <span class="tile-icon">
                  <img class="art" src="/room-icons/timed.png" alt="" />
                  @if (ent.scoringModeLocked('timed')) {
                    <img class="stamp" src="/brand/pro_badge.png" [alt]="lang.t().proLocked" />
                  }
                </span>
                <span class="tile-copy">
                  <strong>{{ lang.t().scoringTimed }}</strong>
                  <span>{{ scoringDesc('timed') }}</span>
                </span>
              </button>
            </div>
          </section>
        </div>

        <div class="pair">
          <section>
            <div class="meter-head">
              <img src="/room-icons/time_per_q.png" alt="" />
              <label class="q-label">{{ lang.t().questionTime }}</label>
            </div>
            <div class="pills">
              @for (n of timerPresets; track n) {
                <button
                  type="button"
                  class="pill"
                  [class.active]="questionSeconds() === n"
                  [attr.aria-pressed]="questionSeconds() === n"
                  (click)="questionSeconds.set(n)"
                >
                  {{ n }}{{ lang.t().seconds }}
                </button>
              }
            </div>
            <p class="hint">{{ lang.t().descQuestionTime }}</p>
          </section>

          <section>
            <div class="meter-head">
              <img src="/room-icons/round_length.png" alt="" />
              <label class="q-label">{{ lang.t().roundLength }}</label>
            </div>
            <div class="pills">
              @for (n of presets; track n) {
                <button
                  type="button"
                  class="pill"
                  [class.active]="!customMode() && length() === n"
                  [class.locked]="ent.roundLengthLocked(n)"
                  [attr.aria-pressed]="!customMode() && length() === n"
                  (click)="pickPreset(n)"
                >
                  {{ n }}
                  @if (ent.roundLengthLocked(n)) {
                    <img class="stamp" src="/brand/pro_badge.png" [alt]="lang.t().proLocked" />
                  }
                </button>
              }
              <button
                type="button"
                class="pill"
                [class.active]="customMode()"
                [class.locked]="ent.customLengthLocked()"
                [attr.aria-pressed]="customMode()"
                (click)="pickCustom()"
              >
                {{ lang.t().custom }}
                @if (ent.customLengthLocked()) {
                  <img class="stamp" src="/brand/pro_badge.png" [alt]="lang.t().proLocked" />
                }
              </button>
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
        </div>

        <section>
          <label class="q-label">{{ lang.t().powerUps }}</label>
          <div class="power-slots">
            @for (slot of powerUpSlots(); track $index) {
              <div class="slot-reel">
                <button
                  type="button"
                  class="slot-nudge"
                  [attr.aria-label]="lang.t().powerUpNext"
                  (click)="cycleSlot($index, 1)"
                >
                  <span class="chevron up" aria-hidden="true"></span>
                </button>
                <div class="power-slot" [class.filled]="slot">
                  @if (slot === 'fifty_fifty') {
                    <img [src]="fiftyFiftyIcon" alt="" />
                  } @else {
                    <span class="slot-plus" aria-hidden="true">+</span>
                  }
                </div>
                <button
                  type="button"
                  class="slot-nudge"
                  [attr.aria-label]="lang.t().powerUpPrev"
                  (click)="cycleSlot($index, -1)"
                >
                  <span class="chevron down" aria-hidden="true"></span>
                </button>
                <span class="slot-name">
                  {{ slot === 'fifty_fifty' ? lang.t().powerUpFifty : lang.t().descPowerUpEmpty }}
                </span>
              </div>
            }
          </div>
          <p class="hint">{{ lang.t().descPowerUpFifty }} {{ lang.t().powerUpsHint }}</p>
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

      <app-studio-footer />
    </div>
  `,
  styles: `
    .create {
      display: grid;
      grid-template-rows: auto 1fr auto;
      min-height: 100dvh;
      gap: 1rem;
    }
    .create .panel {
      align-content: start;
    }
    .top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
    }
    .panel {
      max-width: 960px;
      margin: 0 auto;
      display: grid;
      gap: 1.15rem;
    }
    .brand h1 {
      margin: 0;
      font-size: clamp(1.8rem, 3vw, 2.4rem);
      font-weight: 900;
    }
    .pair {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem 1.25rem;
      align-items: start;
    }
    .tiles {
      display: grid;
      gap: 0.5rem;
    }
    .tiles-cats {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    .pair .tiles {
      grid-template-columns: 1fr 1fr;
    }
    .tile {
      position: relative;
      display: flex;
      align-items: center;
      gap: 0.55rem;
      min-width: 0;
      padding: 0.4rem 0.55rem 0.4rem 0.4rem;
      text-align: left;
      border-radius: 16px;
      border: 2px solid var(--q-border);
      background: var(--q-card);
      color: var(--q-navy);
      cursor: pointer;
    }
    .tile:focus-visible,
    .pill:focus-visible,
    .slot-nudge:focus-visible {
      outline: 2px solid var(--q-blue);
      outline-offset: 2px;
    }
    .tile-icon {
      position: relative;
      flex: 0 0 56px;
      width: 56px;
      height: 56px;
      border-radius: 16px;
      border: 2px solid transparent;
      display: grid;
      place-items: center;
    }
    .tile.active .tile-icon {
      background:
        linear-gradient(var(--q-card), var(--q-card)) padding-box,
        var(--q-gradient) border-box;
    }
    .tile-icon .art {
      width: 48px;
      height: 48px;
      object-fit: contain;
      display: block;
    }
    .stamp {
      position: absolute;
      top: -8px;
      right: -10px;
      width: 26px;
      height: 26px;
      object-fit: contain;
      pointer-events: none;
    }
    .free-mark {
      width: 68px;
      height: 68px;
      object-fit: contain;
      flex-shrink: 0;
    }
    .tile.locked {
      opacity: 0.78;
    }
    .tile-copy {
      min-width: 0;
      display: grid;
      gap: 0.1rem;
    }
    .tile-copy strong {
      font-size: 0.82rem;
      font-weight: 900;
      line-height: 1.15;
    }
    .tile-copy span {
      font-size: 0.72rem;
      font-weight: 700;
      line-height: 1.25;
      color: var(--q-muted);
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      line-clamp: 2;
      overflow: hidden;
    }
    .meter-head {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      margin-bottom: 0.45rem;
    }
    .meter-head img {
      width: 40px;
      height: 40px;
      object-fit: contain;
    }
    .meter-head .q-label {
      margin: 0;
    }
    .pills {
      display: flex;
      flex-wrap: wrap;
      gap: 0.45rem;
    }
    .pill {
      position: relative;
      padding: 0.4rem 0.8rem;
      border-radius: 999px;
      border: 2px solid var(--q-border);
      background: var(--q-card);
      color: var(--q-navy);
      font-weight: 800;
      cursor: pointer;
    }
    .pill.active {
      border-color: transparent;
      color: #fff;
      background: var(--q-gradient);
    }
    .pill.locked {
      opacity: 0.78;
    }
    .pill .stamp {
      width: 22px;
      height: 22px;
      top: -9px;
      right: -8px;
    }
    .hint {
      margin: 0.5rem 0 0;
      color: var(--q-muted);
      font-weight: 700;
      font-size: 0.82rem;
    }
    .warn {
      color: #db2777;
    }
    .custom-input {
      margin-top: 0.65rem;
      max-width: 10rem;
    }
    .cats-disabled {
      opacity: 0.45;
    }
    .cats-disabled .tile {
      pointer-events: none;
    }
    @media (max-width: 720px) {
      .tiles-cats {
        grid-template-columns: 1fr 1fr;
      }
      .tiles-cats .tile {
        flex-direction: column;
        align-items: flex-start;
      }
      .free-mark {
        width: 56px;
        height: 56px;
      }
      .pair {
        grid-template-columns: 1fr;
      }
    }
    .power-slots {
      display: flex;
      gap: 0.85rem;
      margin-top: 0.35rem;
    }
    .slot-reel {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.35rem;
    }
    .slot-nudge {
      width: 28px;
      height: 28px;
      padding: 0;
      border-radius: 999px;
      border: 2px solid transparent;
      background:
        linear-gradient(var(--q-card), var(--q-card)) padding-box,
        var(--q-gradient) border-box;
      color: inherit;
      cursor: pointer;
      display: grid;
      place-items: center;
    }
    .chevron {
      width: 7px;
      height: 7px;
      border-right: 2px solid currentColor;
      border-bottom: 2px solid currentColor;
      display: block;
    }
    .chevron.up {
      transform: rotate(-135deg);
      margin-top: 3px;
    }
    .chevron.down {
      transform: rotate(45deg);
      margin-bottom: 3px;
    }
    .power-slot {
      width: 76px;
      height: 76px;
      border-radius: 999px;
      border: 2px dashed var(--q-border);
      background: var(--q-card);
      display: grid;
      place-items: center;
      overflow: hidden;
    }
    .power-slot.filled {
      border-style: solid;
      border-color: transparent;
      background:
        linear-gradient(var(--q-card), var(--q-card)) padding-box,
        var(--q-gradient) border-box;
    }
    .power-slot img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .slot-plus {
      font-size: 1.7rem;
      font-weight: 800;
      line-height: 1;
      color: var(--q-muted);
    }
    .slot-name {
      max-width: 76px;
      font-size: 0.72rem;
      font-weight: 800;
      line-height: 1.15;
      text-align: center;
      color: var(--q-muted);
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

  readonly categoryInfo: Record<CategoryId, { icon: string; descKey: keyof UiStrings }> = {
    geography: { icon: '/room-icons/geo.png', descKey: 'descGeography' },
    biology: { icon: '/room-icons/bio.png', descKey: 'descBiology' },
    history: { icon: '/room-icons/his.png', descKey: 'descHistory' },
    technology: { icon: '/room-icons/tech.png', descKey: 'descTechnology' },
    sports: { icon: '/room-icons/sports.png', descKey: 'descSports' },
    movies: { icon: '/room-icons/movtv.png', descKey: 'descMovies' },
    famous: { icon: '/room-icons/fam.png', descKey: 'descFamous' },
    islam: { icon: '/room-icons/isl.png', descKey: 'descIslam' },
    food: { icon: '/room-icons/food.png', descKey: 'descFood' },
    images: { icon: '/room-icons/picture.png', descKey: 'descPictureQ' },
  };
  readonly typeInfo: Record<QuestionType, { icon: string; descKey: keyof UiStrings }> = {
    mcq: { icon: '/room-icons/text.png', descKey: 'descTextQ' },
    image_mcq: { icon: '/room-icons/picture.png', descKey: 'descPictureQ' },
  };
  readonly scoringInfo: Record<ScoringMode, { descKey: keyof UiStrings }> = {
    standard: { descKey: 'descScoringStandard' },
    timed: { descKey: 'descScoringTimed' },
  };

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
  readonly powerUpSlots = signal<PowerUpSlots>(
    this.saved?.powerUpSlots ?? ([...EMPTY_POWER_UP_SLOTS] as PowerUpSlots),
  );
  readonly fiftyFiftyIcon = POWER_UP_CATALOG[0].icon;
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
        powerUpSlots: this.powerUpSlots(),
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

  cycleSlot(index: number, direction: number): void {
    const next = [...this.powerUpSlots()] as PowerUpSlots;
    next[index] = cyclePowerUpSlot(next[index], direction < 0 ? -1 : 1);
    this.powerUpSlots.set(next);
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
        powerUpSlots: this.powerUpSlots(),
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
