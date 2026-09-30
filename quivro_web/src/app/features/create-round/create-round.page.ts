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

        <div class="pair">
          <section class="group">
            <label class="q-label">{{ lang.t().questionTypes }}</label>
            <div class="tokens">
              @for (t of questionTypes; track t) {
                <button
                  type="button"
                  class="token cat"
                  [class.on]="types().includes(t)"
                  [class.locked]="ent.questionTypeLocked(t)"
                  [attr.aria-pressed]="types().includes(t)"
                  (click)="toggleType(t)"
                >
                  <span class="token-icon">
                    <img class="art" [src]="typeInfo[t].icon" alt="" />
                  </span>
                  <span class="cat-copy">
                    <strong>{{ typeLabel(t) }}</strong>
                    <span>{{ typeDesc(t) }}</span>
                    @if (!isQuestionTypeFree(t)) {
                      <img class="corner-badge" src="/brand/pro_badge.png" [alt]="proAlt(ent.questionTypeLocked(t))" />
                    }
                  </span>
                </button>
              }
            </div>
            @if (types().length === 0) {
              <p class="hint warn">{{ lang.t().selectAtLeastOneType }}</p>
            }
          </section>

          <section class="group">
            <label class="q-label">{{ lang.t().scoringMode }}</label>
            <div class="tokens">
              <button
                type="button"
                class="token cat"
                [class.on]="scoringMode() === 'standard'"
                [attr.aria-pressed]="scoringMode() === 'standard'"
                (click)="scoringMode.set('standard')"
              >
                <span class="token-icon">
                  <img class="art" src="/room-icons/standard.png" alt="" />
                </span>
                <span class="cat-copy">
                  <strong>{{ lang.t().scoringStandard }}</strong>
                  <span>{{ scoringDesc('standard') }}</span>
                </span>
              </button>
              <button
                type="button"
                class="token cat"
                [class.on]="scoringMode() === 'timed'"
                [class.locked]="ent.scoringModeLocked('timed')"
                [attr.aria-pressed]="scoringMode() === 'timed'"
                (click)="pickScoring('timed')"
              >
                <span class="token-icon">
                  <img class="art" src="/room-icons/timed.png" alt="" />
                </span>
                <span class="cat-copy">
                  <strong>{{ lang.t().scoringTimed }}</strong>
                  <span>{{ scoringDesc('timed') }}</span>
                  <img class="corner-badge" src="/brand/pro_badge.png" [alt]="proAlt(ent.scoringModeLocked('timed'))" />
                </span>
              </button>
            </div>
          </section>
        </div>

        <section class="group" [class.cats-disabled]="!needsCategories()">
          <label class="q-label">{{ lang.t().categories }}</label>
          <div class="tokens tokens-cats">
            @for (cat of categories; track cat) {
              <button
                type="button"
                class="token cat"
                [class.on]="selected().includes(cat)"
                [class.locked]="ent.categoryLocked(cat)"
                [disabled]="!needsCategories()"
                [attr.aria-pressed]="selected().includes(cat)"
                (click)="toggleCategory(cat)"
              >
                <span class="token-icon">
                  <img class="art" [src]="categoryInfo[cat].icon" alt="" />
                </span>
                <span class="cat-copy">
                  <strong>{{ categoryLabel(cat) }}</strong>
                  <span>{{ categoryDesc(cat) }}</span>
                  @if (isWeeklyCategory(cat)) {
                    <img class="corner-badge" src="/brand/free_rotation2.png" [alt]="lang.t().freeThisWeek" />
                  } @else if (isProCategory(cat)) {
                    <img class="corner-badge" src="/brand/pro_badge.png" [alt]="proAlt(ent.categoryLocked(cat))" />
                  }
                </span>
              </button>
            }
          </div>
          @if (needsCategories() && selected().length === 0) {
            <p class="hint warn">{{ lang.t().selectAtLeastOne }}</p>
          }
        </section>

        <div class="pair">
          <section class="group">
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

          <section class="group round">
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
                  @if (!isRoundLengthFree(n)) {
                    <img class="corner-badge" src="/brand/pro_badge.png" [alt]="proAlt(ent.roundLengthLocked(n))" />
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
                <img class="corner-badge" src="/brand/pro_badge.png" [alt]="proAlt(ent.customLengthLocked())" />
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

        <section class="group">
          <label class="q-label">{{ lang.t().powerUps }}</label>
          <div class="power-slots">
            @for (slot of powerUpSlots(); track $index) {
              <div class="slot-reel">
                <div class="slot-switch">
                  <button
                    type="button"
                    class="slot-nudge"
                    [attr.aria-label]="lang.t().powerUpNext"
                    (click)="cycleSlot($index, 1)"
                  >
                    <svg class="arrow up" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                      <path d="M14.5 5.5 L8.5 12 L14.5 18.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                  </button>
                  <div
                    class="power-slot"
                    [class.filled]="slot"
                    [class.locked]="!!slot && ent.powerUpLocked(slot)"
                    [class.from-up]="$index === slotSlide()?.index && slotSlide()?.dir === 1"
                    [class.from-down]="$index === slotSlide()?.index && slotSlide()?.dir === -1"
                  >
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
                    <svg class="arrow down" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                      <path d="M14.5 5.5 L8.5 12 L14.5 18.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                  </button>
                </div>
                <div
                  class="slot-copy cat-copy"
                  [class.empty]="!slot"
                  [class.locked]="!!slot && ent.powerUpLocked(slot)"
                >
                  <strong>
                    {{ slot === 'fifty_fifty' ? lang.t().powerUpFifty : lang.t().descPowerUpEmpty }}
                  </strong>
                  @if (slot === 'fifty_fifty') {
                    <span>{{ lang.t().descPowerUpFifty }}</span>
                  }
                  @if (slot && !isPowerUpFree(slot)) {
                    <img class="corner-badge" src="/brand/pro_badge.png" [alt]="proAlt(ent.powerUpLocked(slot))" />
                  }
                </div>
              </div>
            }
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
          class="q-btn q-btn-outline"
          [disabled]="!canCreate() || creating()"
          (click)="create()"
        >
          {{ lang.t().generateCode }}
        </button>
      </div>

      <app-studio-footer />
      @if (resetPrompt()) {
        <div class="reset-backdrop" (click)="resetPrompt.set(false)">
          <div
            class="reset-card"
            role="dialog"
            aria-modal="true"
            (click)="$event.stopPropagation()"
          >
            <p>{{ lang.t().powerUpReset }}</p>
            <div class="reset-actions">
              <button type="button" class="q-btn q-btn-ghost" (click)="resetPrompt.set(false)">
                {{ lang.t().back }}
              </button>
              <button type="button" class="q-btn q-btn-outline" (click)="confirmReset()">
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
      gap: 1.35rem;
    }
    .brand h1 {
      margin: 0;
      font-size: clamp(1.8rem, 3vw, 2.4rem);
      font-weight: 900;
    }
    .group {
      background: var(--q-card);
      border: 2px solid var(--q-border);
      border-radius: 24px;
      padding: 1rem 1.1rem 1.15rem;
    }
    .pair {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.35rem;
      align-items: stretch;
    }
    .tokens {
      display: grid;
      gap: 0.85rem 0.35rem;
      justify-items: center;
    }
    .tokens-cats {
      grid-template-columns: repeat(3, minmax(0, 1fr));
      padding-top: 1.75rem;
      gap: 1.15rem 0.65rem;
    }
    .token.cat {
      flex-direction: row;
      align-items: center;
      gap: 0.45rem;
      text-align: left;
    }
    .cat-copy {
      position: relative;
      flex: 1;
      min-width: 0;
      display: grid;
      gap: 0.12rem;
      padding: 0.45rem 1.15rem 0.45rem 0.55rem;
      text-align: left;
      border-radius: 16px;
      border: 2px solid transparent;
      background:
        linear-gradient(var(--q-card), var(--q-card)) padding-box,
        var(--q-gradient) border-box;
    }
    .cat-copy strong {
      font-size: 0.82rem;
      font-weight: 900;
      line-height: 1.15;
      color: var(--q-navy);
    }
    .cat-copy span {
      font-size: 0.72rem;
      font-weight: 700;
      line-height: 1.25;
      color: var(--q-muted);
    }
    .token.locked .cat-copy,
    .slot-copy.locked,
    .slot-copy.empty {
      border: 2px solid var(--q-border);
      background: var(--q-card);
    }
    .corner-badge {
      position: absolute;
      top: -42px;
      right: -6px;
      width: 72px;
      height: 72px;
      max-width: none;
      max-height: none;
      object-fit: contain;
      pointer-events: none;
      transform: rotate(12deg);
      transition: transform 0.18s ease;
    }
    .token:hover .corner-badge,
    .token:focus-visible .corner-badge,
    .pill:hover .corner-badge,
    .pill:focus-visible .corner-badge,
    .slot-reel:hover .corner-badge,
    .slot-reel:has(:focus-visible) .corner-badge {
      transform: translate(8px, -12px) rotate(20deg);
    }
    @media (prefers-reduced-motion: reduce) {
      .corner-badge {
        transition: none;
      }
      .token:hover .corner-badge,
      .token:focus-visible .corner-badge,
      .pill:hover .corner-badge,
      .pill:focus-visible .corner-badge,
      .slot-reel:hover .corner-badge,
      .slot-reel:has(:focus-visible) .corner-badge {
        transform: rotate(12deg);
      }
    }
    .pair .tokens {
      grid-template-columns: 1fr;
      padding-top: 1.75rem;
    }
    .token {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.35rem;
      width: 100%;
      padding: 0.2rem;
      border: 0;
      background: transparent;
      color: var(--q-navy);
      cursor: pointer;
      opacity: 0.42;
    }
    .token.on {
      opacity: 1;
    }
    .token:focus-visible,
    .pill:focus-visible,
    .slot-nudge:focus-visible {
      outline: 2px solid var(--q-blue);
      outline-offset: 2px;
    }
    .token-icon {
      position: relative;
      width: 96px;
      height: 96px;
      border-radius: 28px;
      border: 4px solid transparent;
      display: grid;
      place-items: center;
    }
    .token.on .token-icon {
      background:
        linear-gradient(var(--q-card), var(--q-card)) padding-box,
        var(--q-gradient) border-box;
      box-shadow:
        0 0 0 4px color-mix(in srgb, #7b3ff2 32%, transparent),
        0 10px 24px color-mix(in srgb, #2f7cf6 42%, transparent);
    }
    .token-icon .art {
      width: 88px;
      height: 88px;
      object-fit: contain;
      display: block;
    }
    .token.locked .art {
      filter: grayscale(1);
    }
    .token-name {
      font-size: 0.8rem;
      font-weight: 800;
      line-height: 1.15;
      text-align: center;
      color: var(--q-muted);
    }
    .token.on .token-name {
      color: var(--q-navy);
      font-weight: 900;
    }
    .meter-head {
      display: flex;
      align-items: center;
      gap: 0.55rem;
      margin-bottom: 0.65rem;
    }
    .meter-head img {
      width: 88px;
      height: 88px;
      object-fit: contain;
    }
    .meter-head .q-label {
      margin: 0;
    }
    .pills {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      padding-top: 2.4rem;
    }
    .pill {
      position: relative;
      min-height: 44px;
      padding: 0.55rem 1rem;
      border-radius: 999px;
      border: 2px solid var(--q-border);
      background: var(--q-card);
      color: var(--q-navy);
      font-weight: 900;
      cursor: pointer;
      opacity: 0.5;
    }
    .pill.active {
      opacity: 1;
      border-color: transparent;
      color: #fff;
      background: var(--q-gradient);
    }
    .pill.locked {
      opacity: 0.42;
    }
    .pill .corner-badge {
      top: -58px;
      right: -4px;
    }
    .hint {
      margin: 0.65rem 0 0;
      color: var(--q-muted);
      font-weight: 700;
      font-size: 0.82rem;
    }
    .warn {
      color: #db2777;
    }
    .round {
      position: relative;
    }
    .custom-input {
      position: absolute;
      top: 0.85rem;
      right: 1rem;
      width: 5.25rem;
      margin: 0;
      padding: 0.4rem 0.55rem;
    }
    .cats-disabled {
      opacity: 0.45;
    }
    .cats-disabled .token {
      pointer-events: none;
    }
    .power-slots {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 1rem;
      margin-top: 0.35rem;
      padding-top: 1.75rem;
    }
    .slot-reel {
      position: relative;
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 0.65rem;
      flex: 1;
      min-width: 0;
    }
    .slot-reel:has(.corner-badge) {
      z-index: 1;
    }
    .slot-switch {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.35rem;
      flex-shrink: 0;
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
    .arrow {
      display: block;
    }
    .arrow.up {
      transform: rotate(90deg);
    }
    .arrow.down {
      transform: rotate(-90deg);
    }
    .slot-copy {
      position: relative;
      flex: 1;
      min-width: 0;
    }
    .slot-reel .corner-badge {
      pointer-events: auto;
      opacity: 1;
      filter: none;
      z-index: 2;
      top: -58px;
      right: -4px;
    }
    .power-slot {
      width: 88px;
      height: 88px;
      border-radius: 999px;
      border: 2px dashed var(--q-border);
      background: color-mix(in srgb, var(--q-bg) 55%, var(--q-card));
      display: grid;
      place-items: center;
      overflow: hidden;
    }
    .power-slot.filled {
      border-style: solid;
      border-width: 4px;
      border-color: transparent;
      background:
        linear-gradient(var(--q-card), var(--q-card)) padding-box,
        var(--q-gradient) border-box;
      box-shadow:
        0 0 0 4px color-mix(in srgb, #7b3ff2 32%, transparent),
        0 10px 24px color-mix(in srgb, #2f7cf6 42%, transparent);
    }
    .power-slot img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .power-slot.locked img {
      filter: grayscale(1);
    }
    .slot-plus {
      font-size: 1.7rem;
      font-weight: 800;
      line-height: 1;
      color: var(--q-muted);
    }
    .power-slot.from-up img,
    .power-slot.from-up .slot-plus {
      animation: slot-from-up 0.22s ease;
    }
    .power-slot.from-down img,
    .power-slot.from-down .slot-plus {
      animation: slot-from-down 0.22s ease;
    }
    @keyframes slot-from-up {
      from {
        opacity: 0;
        transform: translateY(-16px);
      }
      to {
        opacity: 1;
        transform: none;
      }
    }
    @keyframes slot-from-down {
      from {
        opacity: 0;
        transform: translateY(16px);
      }
      to {
        opacity: 1;
        transform: none;
      }
    }
    @media (max-width: 720px) {
      .tokens-cats {
        grid-template-columns: 1fr;
      }
      .pair {
        grid-template-columns: 1fr;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .power-slot.from-up img,
      .power-slot.from-up .slot-plus,
      .power-slot.from-down img,
      .power-slot.from-down .slot-plus {
        animation: none;
      }
    }
    .reset-backdrop {
      position: fixed;
      inset: 0;
      z-index: 200;
      display: grid;
      place-items: center;
      padding: 1rem;
      background: rgba(6, 12, 32, 0.55);
    }
    .reset-card {
      width: min(420px, 100%);
      display: grid;
      gap: 1rem;
      padding: 1.25rem 1.35rem;
      border: 2px solid transparent;
      border-radius: 24px;
      background:
        linear-gradient(var(--q-card), var(--q-card)) padding-box,
        var(--q-gradient) border-box;
      box-shadow: var(--q-shadow);
    }
    .reset-card p {
      margin: 0;
      font-weight: 800;
      line-height: 1.35;
    }
    .reset-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.6rem;
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
