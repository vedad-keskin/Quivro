import { Component, DestroyRef, computed, effect, inject, signal, untracked } from '@angular/core';
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
import { FREE_CATEGORIES, FREE_MAX_ROUND_LENGTH, PRO_CATEGORIES, isPowerUpFree, isQuestionTypeFree, isRoundLengthFree } from '../../core/entitlements';
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
  randomPowerUpSlots,
  type PowerUpSlot,
  type PowerUpSlots,
  type ScoringMode,
} from '../../core/room.models';
import { SnackbarService } from '../../core/snackbar.service';
import { SettingsChips } from '../../shared/settings-chips';
import { StudioFooter } from '../../shared/studio-footer';
import { UpgradeDialogService } from '../../shared/upgrade-dialog.service';

const ROUND_PREFS_KEY = 'quivro.roundPrefs';
const REEL_STOPS_MS = [600, 850, 1100];

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
    <div class="q-page q-show create">
      <header class="top">
        <a routerLink="/" class="back">← {{ lang.t().back }}</a>
        <app-settings-chips />
      </header>

      <div class="panel rs">
        <div class="title">
          <h1>{{ lang.t().createRound }}</h1>
        </div>

        <div class="pair">
          <section class="stage">
            <span class="step" aria-hidden="true">1</span>
            <h2 class="stage-label">{{ lang.t().questionTypes }}</h2>
            <div class="tiles">
              @for (t of questionTypes; track t) {
                <button
                  type="button"
                  class="tile"
                  [style.--accent]="typeInfo[t].accent"
                  [class.on]="types().includes(t)"
                  [class.locked]="ent.questionTypeLocked(t)"
                  [attr.aria-pressed]="types().includes(t)"
                  (click)="toggleType(t)"
                >
                  <span class="plate"><img [src]="typeInfo[t].icon" alt="" /></span>
                  <span class="tile-copy">
                    <strong>{{ typeLabel(t) }}</strong>
                    <span>{{ typeDesc(t) }}</span>
                  </span>
                  @if (types().includes(t)) {
                    <span class="stamp" aria-hidden="true"><svg viewBox="0 0 24 24" width="14" height="14"><path d="M5 12.5 L10 17.5 L19 7" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" /></svg></span>
                  }
                  @if (!isQuestionTypeFree(t)) {
                    <img class="corner-badge" src="/brand/pro_badge.png" [alt]="proAlt(ent.questionTypeLocked(t))" />
                  }
                </button>
              }
            </div>
            @if (types().length === 0) {
              <p class="hint warn">{{ lang.t().selectAtLeastOneType }}</p>
            }
          </section>

          <section class="stage">
            <span class="step" aria-hidden="true">2</span>
            <h2 class="stage-label">{{ lang.t().scoringMode }}</h2>
            <div class="tiles">
              <button
                type="button"
                class="tile"
                style="--accent: var(--q-cyan)"
                [class.on]="scoringMode() === 'standard'"
                [attr.aria-pressed]="scoringMode() === 'standard'"
                (click)="scoringMode.set('standard')"
              >
                <span class="plate"><img src="/room-icons/standard.png" alt="" /></span>
                <span class="tile-copy">
                  <strong>{{ lang.t().scoringStandard }}</strong>
                  <span>{{ scoringDesc('standard') }}</span>
                </span>
                @if (scoringMode() === 'standard') {
                  <span class="stamp" aria-hidden="true"><svg viewBox="0 0 24 24" width="14" height="14"><path d="M5 12.5 L10 17.5 L19 7" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" /></svg></span>
                }
              </button>
              <button
                type="button"
                class="tile"
                style="--accent: var(--q-orange)"
                [class.on]="scoringMode() === 'timed'"
                [class.locked]="ent.scoringModeLocked('timed')"
                [attr.aria-pressed]="scoringMode() === 'timed'"
                (click)="pickScoring('timed')"
              >
                <span class="plate"><img src="/room-icons/timed.png" alt="" /></span>
                <span class="tile-copy">
                  <strong>{{ lang.t().scoringTimed }}</strong>
                  <span>{{ scoringDesc('timed') }}</span>
                </span>
                @if (scoringMode() === 'timed') {
                  <span class="stamp" aria-hidden="true"><svg viewBox="0 0 24 24" width="14" height="14"><path d="M5 12.5 L10 17.5 L19 7" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" /></svg></span>
                }
                <img class="corner-badge" src="/brand/pro_badge.png" [alt]="proAlt(ent.scoringModeLocked('timed'))" />
              </button>
            </div>
          </section>
        </div>

        <div class="cat-fold" [class.open]="needsCategories()">
          <div class="cat-fold-inner" [attr.inert]="needsCategories() ? null : ''">
        <section class="stage">
          <span class="step" aria-hidden="true">3</span>
          <h2 class="stage-label">{{ lang.t().categories }}</h2>
          <div class="tiles tiles-cats">
            @for (cat of categories; track cat) {
              <button
                type="button"
                class="tile"
                [style.--accent]="categoryInfo[cat].accent"
                [class.on]="selected().includes(cat)"
                [class.locked]="ent.categoryLocked(cat)"
                [disabled]="!needsCategories()"
                [attr.aria-pressed]="selected().includes(cat)"
                (click)="toggleCategory(cat)"
              >
                <span class="plate"><img [src]="categoryInfo[cat].icon" alt="" /></span>
                <span class="tile-copy">
                  <strong>{{ categoryLabel(cat) }}</strong>
                  <span>{{ categoryDesc(cat) }}</span>
                </span>
                @if (selected().includes(cat)) {
                  <span class="stamp" aria-hidden="true"><svg viewBox="0 0 24 24" width="14" height="14"><path d="M5 12.5 L10 17.5 L19 7" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" /></svg></span>
                }
                @if (isWeeklyCategory(cat)) {
                  <img class="corner-badge" src="/brand/free_rotation2.png" [alt]="lang.t().freeThisWeek" />
                } @else if (isProCategory(cat)) {
                  <img class="corner-badge" src="/brand/pro_badge.png" [alt]="proAlt(ent.categoryLocked(cat))" />
                }
              </button>
            }
          </div>
          @if (needsCategories() && selected().length === 0) {
            <p class="hint warn">{{ lang.t().selectAtLeastOne }}</p>
          }
        </section>
          </div>
        </div>

        <div class="pair">
          <section class="stage">
            <span class="step" aria-hidden="true">{{ needsCategories() ? 4 : 3 }}</span>
            <img class="stage-art" src="/room-icons/time_per_q.png" alt="" />
            <h2 class="stage-label">{{ lang.t().questionTime }}</h2>
            <div class="keys">
              @for (n of timerPresets; track n) {
                <button
                  type="button"
                  class="key"
                  [class.on]="questionSeconds() === n"
                  [attr.aria-pressed]="questionSeconds() === n"
                  (click)="questionSeconds.set(n)"
                >
                  {{ n }}<small>{{ lang.t().seconds }}</small>
                </button>
              }
            </div>
            <p class="hint">{{ lang.t().descQuestionTime }}</p>
          </section>

          <section class="stage">
            <span class="step" aria-hidden="true">{{ needsCategories() ? 5 : 4 }}</span>
            <img class="stage-art" src="/room-icons/round_length.png" alt="" />
            <h2 class="stage-label">{{ lang.t().roundLength }}</h2>
            <div class="keys">
              @for (n of presets; track n) {
                <button
                  type="button"
                  class="key"
                  [class.on]="!customMode() && length() === n"
                  [class.locked]="ent.roundLengthLocked(n)"
                  [attr.aria-pressed]="!customMode() && length() === n"
                  (click)="pickPreset(n)"
                >
                  {{ n }}
                  @if (!isRoundLengthFree(n)) {
                    <img class="corner-badge" src="/brand/pro_badge.png" [alt]="proAlt(ent.roundLengthLocked(n))" />
                  }
                </button>
              }
              <button
                type="button"
                class="key key-word"
                [class.on]="customMode()"
                [class.locked]="ent.customLengthLocked()"
                [attr.aria-pressed]="customMode()"
                (click)="pickCustom()"
              >
                {{ lang.t().custom }}
                <img class="corner-badge" src="/brand/pro_badge.png" [alt]="proAlt(ent.customLengthLocked())" />
              </button>
            </div>
            <div class="readout" [class.bad]="customMode() && !customLengthValid()">
              @if (customMode()) {
                <input
                  class="readout-num readout-input"
                  type="number"
                  [min]="minRoundLength"
                  [attr.aria-label]="lang.t().roundLength"
                  [ngModel]="customLength()"
                  (ngModelChange)="onCustom($event)"
                />
              } @else {
                <span class="readout-num">{{ effectiveLength() }}</span>
              }
              <span class="readout-unit">{{ lang.t().questions }}</span>
              @if (customMode()) {
                <span class="readout-steps">
                  <button type="button" class="nudge step-key" [attr.aria-label]="lang.t().decrease" (click)="stepCustom(-1)">
                    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                      <path d="M6 12 H18" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" />
                    </svg>
                  </button>
                  <button type="button" class="nudge step-key" [attr.aria-label]="lang.t().increase" (click)="stepCustom(1)">
                    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                      <path d="M6 12 H18 M12 6 V18" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" />
                    </svg>
                  </button>
                </span>
              }
            </div>
            <p class="hint">{{ lang.t().difficultyMix }}</p>
          </section>
        </div>

        <section class="stage">
          <span class="step" aria-hidden="true">{{ needsCategories() ? 6 : 5 }}</span>
          <h2 class="stage-label">{{ lang.t().powerUps }}</h2>
          <div class="machine">
            <div class="marquee" aria-hidden="true"></div>
            <div class="machine-body">
              <div class="reels">
                @for (slot of powerUpSlots(); track $index) {
                  <div class="reel">
                    <button
                      type="button"
                      class="nudge"
                      [disabled]="spinning()[$index]"
                      [attr.aria-label]="lang.t().powerUpNext"
                      (click)="cycleSlot($index, 1)"
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                        <path d="M5.5 14.5 L12 8.5 L18.5 14.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
                      </svg>
                    </button>
                    <div class="window-wrap">
                      <div
                        class="window"
                        [class.locked]="!!slot && ent.powerUpLocked(slot)"
                        [class.from-up]="$index === slotSlide()?.index && slotSlide()?.dir === 1"
                        [class.from-down]="$index === slotSlide()?.index && slotSlide()?.dir === -1"
                      >
                        @if (spinning()[$index]) {
                          <div class="strip" aria-hidden="true">
                            @for (s of reelStrip; track $index) {
                              <span class="strip-cell">
                                @if (s) {
                                  <img [src]="fiftyFiftyIcon" alt="" />
                                } @else {
                                  <span class="slot-plus">+</span>
                                }
                              </span>
                            }
                          </div>
                        } @else if (slot === 'fifty_fifty') {
                          <img class="reel-art" [src]="fiftyFiftyIcon" alt="" />
                        } @else {
                          <span class="slot-plus" aria-hidden="true">+</span>
                        }
                      </div>
                      @if (slot && !isPowerUpFree(slot)) {
                        <img class="corner-badge" src="/brand/pro_badge.png" [alt]="proAlt(ent.powerUpLocked(slot))" />
                      }
                    </div>
                    <button
                      type="button"
                      class="nudge"
                      [disabled]="spinning()[$index]"
                      [attr.aria-label]="lang.t().powerUpPrev"
                      (click)="cycleSlot($index, -1)"
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                        <path d="M5.5 9.5 L12 15.5 L18.5 9.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
                      </svg>
                    </button>
                    <div class="reel-copy" [class.empty]="!slot" [attr.aria-live]="'polite'">
                      <strong>
                        {{ slot === 'fifty_fifty' ? lang.t().powerUpFifty : lang.t().descPowerUpEmpty }}
                      </strong>
                      @if (slot === 'fifty_fifty') {
                        <span>{{ lang.t().descPowerUpFifty }}</span>
                      }
                    </div>
                  </div>
                }
              </div>
              <button
                type="button"
                class="lever"
                [class.pulled]="leverPulled()"
                [disabled]="isSpinning()"
                [attr.aria-label]="lang.t().powerUpSpin"
                (click)="pullLever()"
              >
                <span class="lever-track" aria-hidden="true">
                  <span class="lever-stick"></span>
                  <span class="lever-hub"></span>
                  <span class="lever-knob"></span>
                </span>
                <span class="lever-text" aria-hidden="true">{{ lang.t().powerUpSpin }}</span>
              </button>
            </div>
          </div>
          <p class="hint">{{ lang.t().powerUpsHint }}</p>
          @if (powerUpBlocked()) {
            <p class="hint warn">{{ lang.t().powerUpNeedsPro }}</p>
          }
        </section>
        @if (!rooms.isLive) {
          <p class="hint warn">{{ lang.t().firebaseMissing }}</p>
        }

        <button
          type="button"
          class="go"
          [disabled]="!canCreate() || creating()"
          (click)="create()"
        >
          {{ lang.t().generateCode }}
          <span class="go-arrow" aria-hidden="true">▶</span>
        </button>
      </div>

      <app-studio-footer />
      @if (resetPrompt()) {
        <div class="modal-backdrop" (click)="resetPrompt.set(false)">
          <div
            class="modal"
            role="dialog"
            aria-modal="true"
            (click)="$event.stopPropagation()"
          >
            <p>{{ lang.t().powerUpReset }}</p>
            <div class="modal-actions">
              <button type="button" class="key-btn" (click)="resetPrompt.set(false)">
                {{ lang.t().back }}
              </button>
              <button type="button" class="go go-sm" (click)="confirmReset()">
                {{ lang.t().generateCode }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    .create {
      display: grid;
      grid-template-rows: auto 1fr auto;
      min-height: 100dvh;
      gap: 1rem;
    }
    .top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
    }
    .panel {
      width: 100%;
      max-width: 980px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 2.1rem;
      align-content: start;
    }

    .title {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .title h1 {
      margin: 0;
      font-family: var(--display);
      font-weight: 400;
      font-size: clamp(2.2rem, 5vw, 3.4rem);
      line-height: 1;
      letter-spacing: 0.01em;
      color: var(--q-navy);
      text-shadow: 3px 3px 0 var(--bulb);
    }
    :host-context(html[data-theme='dark']) .title h1 {
      color: var(--bulb);
      text-shadow: 3px 3px 0 var(--ink);
    }

    /* Slot machine cabinet (tiles, keys and reels live in styles.css under .rs) */
    .machine {
      margin-top: 0.4rem;
      padding: 0.85rem 1rem 1.1rem;
      border: 3px solid var(--ink);
      border-radius: 22px;
      background: linear-gradient(180deg, #e8435a, #b81d3a);
      box-shadow: 6px 6px 0 var(--ink);
    }
    .marquee {
      margin: 0 0.5rem 0.85rem;
    }
    .machine-body {
      display: flex;
      align-items: stretch;
      gap: 0.9rem;
    }
    .strip-cell img {
      width: calc(var(--win) - 14px);
      height: calc(var(--win) - 14px);
      object-fit: contain;
    }
    .strip {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      filter: blur(1.5px);
      animation: reel-spin 0.16s linear infinite;
    }
    .strip-cell {
      height: calc(var(--win) - 6px);
      display: grid;
      place-items: center;
    }
    @keyframes reel-spin {
      to {
        transform: translateY(calc(-2 * (var(--win) - 6px)));
      }
    }

    /* Lever */
    .lever {
      flex-shrink: 0;
      width: 64px;
      padding: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      border: 0;
      border-radius: 12px;
      background: transparent;
      cursor: pointer;
    }
    .lever:focus-visible {
      outline: 3px solid var(--q-blue);
      outline-offset: 3px;
    }
    .lever:disabled {
      cursor: default;
    }
    .lever-track {
      position: relative;
      width: 64px;
      height: 150px;
    }
    .lever-stick {
      position: absolute;
      left: calc(50% - 6px);
      bottom: 75px;
      width: 12px;
      height: 58px;
      border: 2px solid var(--ink);
      border-radius: 6px;
      background: linear-gradient(90deg, #9aa3b5, #f1f4f9 45%, #8a93a6);
      transform-origin: bottom center;
    }
    .lever-hub {
      position: absolute;
      left: calc(50% - 20px);
      top: calc(50% - 12px);
      width: 40px;
      height: 24px;
      border: 3px solid var(--ink);
      border-radius: 8px;
      background: #2a1530;
      z-index: 1;
    }
    .lever-knob {
      position: absolute;
      left: calc(50% - 18px);
      top: 0;
      width: 36px;
      height: 36px;
      border: 3px solid var(--ink);
      border-radius: 50%;
      background: radial-gradient(circle at 35% 30%, #ff8a9b, #e11d48 55%, #9f1239);
      z-index: 2;
      transition: transform 0.15s ease;
    }
    .lever:hover:not(:disabled) .lever-knob {
      transform: translateY(5px);
    }
    .lever.pulled .lever-stick {
      animation: stick-pull 0.6s ease-in-out;
    }
    .lever.pulled .lever-knob {
      animation: knob-pull 0.6s ease-in-out;
    }
    @keyframes stick-pull {
      40% {
        transform: scaleY(-1);
      }
    }
    @keyframes knob-pull {
      40% {
        transform: translateY(116px) scale(1.15);
      }
    }
    .lever-text {
      font-family: var(--display);
      font-size: 1rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #fff;
      text-shadow: 2px 2px 0 var(--ink);
    }

    .modal p {
      margin: 0;
      font-weight: 800;
      line-height: 1.35;
    }

    @media (max-width: 720px) {
      .machine {
        padding: 0.7rem 0.6rem 0.8rem;
      }
      .machine-body {
        gap: 0.4rem;
      }
      .lever {
        width: 48px;
      }
      .go {
        position: sticky;
        bottom: 1rem;
        z-index: 5;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .strip,
      .lever.pulled .lever-stick,
      .lever.pulled .lever-knob {
        animation: none !important;
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

  readonly categoryInfo: Record<CategoryId, { icon: string; descKey: keyof UiStrings; accent: string }> = {
    geography: { icon: '/room-icons/geo.png', descKey: 'descGeography', accent: 'var(--q-cyan)' },
    biology: { icon: '/room-icons/bio.png', descKey: 'descBiology', accent: 'var(--q-lime)' },
    history: { icon: '/room-icons/his.png', descKey: 'descHistory', accent: 'var(--q-orange)' },
    technology: { icon: '/room-icons/tech.png', descKey: 'descTechnology', accent: 'var(--q-blue)' },
    sports: { icon: '/room-icons/sports.png', descKey: 'descSports', accent: 'var(--q-pink)' },
    movies: { icon: '/room-icons/movtv.png', descKey: 'descMovies', accent: 'var(--q-purple)' },
    famous: { icon: '/room-icons/fam.png', descKey: 'descFamous', accent: 'var(--q-orange)' },
    islam: { icon: '/room-icons/isl.png', descKey: 'descIslam', accent: 'var(--q-lime)' },
    food: { icon: '/room-icons/food.png', descKey: 'descFood', accent: 'var(--q-pink)' },
    images: { icon: '/room-icons/picture.png', descKey: 'descPictureQ', accent: 'var(--q-cyan)' },
  };
  readonly typeInfo: Record<QuestionType, { icon: string; descKey: keyof UiStrings; accent: string }> = {
    mcq: { icon: '/room-icons/text.png', descKey: 'descTextQ', accent: 'var(--q-blue)' },
    image_mcq: { icon: '/room-icons/picture.png', descKey: 'descPictureQ', accent: 'var(--q-pink)' },
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
  /** Alternating filled/empty cells; two copies so the scroll loops seamlessly. */
  readonly reelStrip = [true, false, true, false];
  readonly spinning = signal<boolean[]>([false, false, false]);
  readonly isSpinning = computed(() => this.spinning().some(Boolean));
  readonly leverPulled = signal(false);
  private spinTimers: ReturnType<typeof setTimeout>[] = [];
  readonly powerUpBlocked = computed(() =>
    this.powerUpSlots().some((slot) => !!slot && this.ent.powerUpLocked(slot)),
  );
  readonly creating = signal(false);
  readonly resetPrompt = signal(false);

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
    inject(DestroyRef).onDestroy(() => this.spinTimers.forEach(clearTimeout));
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

  categoryDesc(cat: CategoryId): string {
    return this.lang.t()[this.categoryInfo[cat].descKey];
  }

  typeLabel(t: QuestionType): string {
    return t === 'mcq' ? this.lang.t().mcq : this.lang.t().imageMcq;
  }

  typeDesc(t: QuestionType): string {
    return this.lang.t()[this.typeInfo[t].descKey];
  }

  scoringDesc(mode: ScoringMode): string {
    return this.lang.t()[this.scoringInfo[mode].descKey];
  }

  readonly isQuestionTypeFree = isQuestionTypeFree;
  readonly isPowerUpFree = isPowerUpFree;
  readonly isRoundLengthFree = isRoundLengthFree;

  isWeeklyCategory(cat: CategoryId): boolean {
    return cat === this.ent.freeThisWeek();
  }

  isProCategory(cat: CategoryId): boolean {
    return (PRO_CATEGORIES as readonly CategoryId[]).includes(cat);
  }

  proAlt(locked: boolean): string {
    return locked ? this.lang.t().proLocked : this.lang.t().proName;
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

  readonly slotSlide = signal<{ index: number; dir: 1 | -1 } | null>(null);

  cycleSlot(index: number, direction: number): void {
    const dir: 1 | -1 = direction < 0 ? -1 : 1;
    this.slotSlide.set({ index, dir });
    const next = [...this.powerUpSlots()] as PowerUpSlots;
    next[index] = cyclePowerUpSlot(next[index], dir);
    this.powerUpSlots.set(next);
  }

  pullLever(): void {
    if (this.isSpinning()) return;
    const result = randomPowerUpSlots();
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.powerUpSlots.set(result);
      return;
    }
    this.leverPulled.set(true);
    this.spinning.set([true, true, true]);
    this.spinTimers = [
      setTimeout(() => this.leverPulled.set(false), 600),
      ...REEL_STOPS_MS.map((ms, i) => setTimeout(() => this.landReel(i, result[i]), ms)),
    ];
  }

  private landReel(index: number, slot: PowerUpSlot): void {
    this.slotSlide.set({ index, dir: 1 });
    const next = [...this.powerUpSlots()] as PowerUpSlots;
    next[index] = slot;
    this.powerUpSlots.set(next);
    this.spinning.update((s) => s.map((v, i) => (i === index ? false : v)));
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

  stepCustom(delta: number): void {
    this.onCustom(this.customLength() + delta);
  }

  async create(): Promise<void> {
    if (!this.canCreate() || this.creating()) return;
    if (this.powerUpBlocked()) {
      this.resetPrompt.set(true);
      return;
    }
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

  confirmReset(): void {
    this.resetPrompt.set(false);
    this.powerUpSlots.set([...EMPTY_POWER_UP_SLOTS]);
    void this.create();
  }
}
