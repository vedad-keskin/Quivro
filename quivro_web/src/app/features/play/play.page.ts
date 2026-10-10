import {
  afterRenderEffect,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { interval } from 'rxjs';
import {
  CATEGORIES,
  MIN_ROUND_LENGTH,
  QUESTION_SECONDS_PRESETS,
  QUESTION_TYPES,
  REVEAL_MS,
  ROUND_LENGTH_PRESETS,
  type CategoryId,
  type QuestionType,
} from '../../../data/questions/types';
import { EntitlementService } from '../../core/entitlement.service';
import {
  FREE_CATEGORIES,
  FREE_MAX_ROUND_LENGTH,
  PRO_CATEGORIES,
  isPowerUpFree,
  isQuestionTypeFree,
  isRoundLengthFree,
} from '../../core/entitlements';
import { GameRoomService } from '../../core/game-room.service';
import type { UiStrings } from '../../../i18n/en';
import { LanguageService } from '../../core/language.service';
import {
  isValidRoundLength,
  normalizeRoundLength,
  parseCustomRoundLength,
  roundLengthIssue,
} from '../../core/round-generator.service';
import {
  avatarColor,
  avatarEmoji,
  clampQuestionSeconds,
  cyclePowerUpSlot,
  EMPTY_POWER_UP_SLOTS,
  IMAGE_SLIDE_MS,
  POWER_UP_CATALOG,
  questionSettled,
  nextQuestionMultiplier,
  type RoomState,
  type PowerUpSlot,
  type PowerUpSlots,
  type RoomConfig,
  type RoomPlayer,
  type ScoringMode,
} from '../../core/room.models';
import { ServerTimeService } from '../../core/server-time.service';
import { SnackbarService } from '../../core/snackbar.service';
import { AnswerGrid, fitFont } from '../../shared/answer-grid';
import { CATEGORY_ACCENT, SCORING_ACCENT, TYPE_ACCENT } from '../../shared/round-accents';
import { Leaderboard } from '../../shared/leaderboard';
import { TimerRing } from '../../shared/timer-ring';
import { QuestionBoost } from '../../shared/question-boost';
import { QuestionFlames } from './question-flames';
import { UpgradeDialogService } from '../../shared/upgrade-dialog.service';

type ImagePhase = 'idle' | 'preview' | 'sliding' | 'docked';

@Component({
  selector: 'app-play',
  imports: [AnswerGrid, FormsModule, Leaderboard, TimerRing, QuestionBoost, QuestionFlames],
  template: `
    <div class="tv q-show" #tvRoot>
      @if (room(); as r) {
        @if (!rooms.hosting()) {
          <p class="spectator-banner">{{ lang.t().alreadyHostingOtherTab }}</p>
        }
        @if (r.phase === 'finished') {
          <section class="final">
            <div class="stage spotlight winner">
              @if (!reduceMotion) {
                <div class="confetti" aria-hidden="true">
                  @for (c of confetti; track c) {
                    <i [style.--i]="c"></i>
                  }
                </div>
              }
              @if (r.lastWinners.length === 1) {
                <svg class="crown" viewBox="0 0 32 22" aria-hidden="true">
                  <path d="M3 19 L1.5 5 L9.5 11 L16 2 L22.5 11 L30.5 5 L29 19 Z" />
                </svg>
                <span class="avatar big" [style.background]="avatarColor(r.lastWinners[0].avatar)">{{
                  avatarEmoji(r.lastWinners[0].avatar)
                }}</span>
                <p class="eyebrow">{{ lang.t().lastWinner }}</p>
                <h1 class="show-title">{{ r.lastWinners[0].name }}</h1>
              } @else if (r.lastWinners.length > 1) {
                <p class="eyebrow">{{ lang.t().roundTieWinners }}</p>
                <div class="co-winners">
                  @for (w of r.lastWinners; track w.playerId) {
                    <span class="co-winner">
                      <span class="avatar" [style.background]="avatarColor(w.avatar)">{{
                        avatarEmoji(w.avatar)
                      }}</span>
                      <strong class="show-title">{{ w.name }}</strong>
                    </span>
                  }
                </div>
              } @else {
                <h1 class="show-title">{{ lang.t().finalLeaderboard }}</h1>
              }
            </div>

            <app-leaderboard [title]="lang.t().finalLeaderboard" [players]="players()" />

            <div class="rematch-hub rs">
              <div class="pair">
                <section class="stage code-card">
                  <h2 class="stage-label">{{ lang.t().joinCode }}</h2>
                  <p class="digits sm" [attr.aria-label]="r.code">
                    @for (ch of r.code.split(''); track $index) {
                      <span class="digit" aria-hidden="true">{{ ch }}</span>
                    }
                  </p>
                  <button type="button" class="key-btn" (click)="copy()">
                    {{ copied() ? lang.t().copied : lang.t().copyCode }}
                  </button>
                </section>
                <section class="stage">
                  <h2 class="stage-label">
                    {{ lang.t().readyForRematch }}
                    <span class="count">{{ rematchReadyPlayers().length }}</span>
                  </h2>
                  <ul class="ready">
                    @for (p of rematchReadyPlayers(); track p.id) {
                      <li class="card">
                        <span class="avatar" [style.background]="avatarColor(p.avatar)">{{
                          avatarEmoji(p.avatar)
                        }}</span>
                        <span class="name">{{ p.name }}</span>
                      </li>
                    } @empty {
                      <li class="hint">{{ lang.t().waitingPlayers }}</li>
                    }
                  </ul>
                </section>
              </div>

              <h2 class="show-title hub-title">{{ lang.t().rematchSettings }}</h2>

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
                        [class.on]="selectedTypes().includes(t)"
                        [class.locked]="ent.questionTypeLocked(t)"
                        [attr.aria-pressed]="selectedTypes().includes(t)"
                        (click)="toggleType(t)"
                      >
                        <span class="plate"><img [src]="typeInfo[t].icon" alt="" /></span>
                        <span class="tile-copy">
                          <strong>{{ typeLabel(t) }}</strong>
                          <span>{{ typeDesc(t) }}</span>
                        </span>
                        @if (selectedTypes().includes(t)) {
                          <span class="stamp" aria-hidden="true"><svg viewBox="0 0 24 24" width="14" height="14"><path d="M5 12.5 L10 17.5 L19 7" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" /></svg></span>
                        }
                        @if (!isQuestionTypeFree(t)) {
                          <img class="corner-badge" src="/brand/pro_badge.png" [alt]="proAlt(ent.questionTypeLocked(t))" />
                        }
                      </button>
                    }
                  </div>
                  @if (selectedTypes().length === 0) {
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
                      [style.--accent]="scoringInfo.standard.accent"
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
                      [style.--accent]="scoringInfo.timed.accent"
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
                      [class.on]="selectedCats().includes(cat)"
                      [class.locked]="ent.categoryLocked(cat)"
                      [disabled]="!needsCategories()"
                      [attr.aria-pressed]="selectedCats().includes(cat)"
                      (click)="toggleCategory(cat)"
                    >
                      <span class="plate"><img [src]="categoryInfo[cat].icon" alt="" /></span>
                      <span class="tile-copy">
                        <strong>{{ categoryLabel(cat) }}</strong>
                        <span>{{ categoryDesc(cat) }}</span>
                      </span>
                      @if (selectedCats().includes(cat)) {
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
                @if (needsCategories() && selectedCats().length === 0) {
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
                        <button type="button" class="nudge step-key" [attr.aria-label]="lang.t().decrease" (click)="onCustom(customLength() - 1)">
                          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                            <path d="M6 12 H18" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" />
                          </svg>
                        </button>
                        <button type="button" class="nudge step-key" [attr.aria-label]="lang.t().increase" (click)="onCustom(customLength() + 1)">
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
                <div class="reels">
                  @for (slot of powerUpSlots(); track $index) {
                    <div class="reel">
                      <button type="button" class="nudge" [attr.aria-label]="lang.t().powerUpNext" (click)="cycleSlot($index, 1)">
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
                          @if (powerUpOf(slot); as power) {
                            <img class="reel-art" [src]="power.icon" alt="" />
                          } @else {
                            <span class="slot-plus" aria-hidden="true">+</span>
                          }
                        </div>
                        @if (slot && !isPowerUpFree(slot)) {
                          <img class="corner-badge" src="/brand/pro_badge.png" [alt]="proAlt(ent.powerUpLocked(slot))" />
                        }
                      </div>
                      <button type="button" class="nudge" [attr.aria-label]="lang.t().powerUpPrev" (click)="cycleSlot($index, -1)">
                        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                          <path d="M5.5 9.5 L12 15.5 L18.5 9.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                      </button>
                      <div class="reel-copy" [class.empty]="!slot" [attr.aria-live]="'polite'">
                        @if (powerUpOf(slot); as power) {
                          <strong>{{ lang.t()[power.labelKey] }}</strong>
                          <span>{{ lang.t()[power.descKey] }}</span>
                        } @else {
                          <strong>{{ lang.t().descPowerUpEmpty }}</strong>
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

              <div class="final-actions">
                <button type="button" class="key-btn" (click)="goHome()">
                  ← {{ lang.t().home }}
                </button>
                <button
                  type="button"
                  class="go"
                  [disabled]="!rooms.hosting() || !canRematch() || rematching()"
                  (click)="rematch()"
                >
                  {{ lang.t().startRematch }}
                  <span class="go-arrow" aria-hidden="true">▶</span>
                </button>
              </div>
            </div>
          </section>
        } @else {
          <div class="layout">
            <div
              class="board-col"
              [class.with-image]="
                (imagePhase() === 'sliding' || imagePhase() === 'docked') &&
                !!activeImageUrl()
              "
            >
              <app-leaderboard
                class="board"
                [title]="lang.t().leaderboard"
                [players]="players()"
                [deltas]="r.lastScoreDeltas"
                [podiumOnly]="
                  imagePhase() === 'sliding' || imagePhase() === 'docked'
                "
              />
              <div
                class="image-dock"
                [class.visible]="
                  (imagePhase() === 'sliding' || imagePhase() === 'docked') &&
                  !!activeImageUrl()
                "
                [class.receiving]="imagePhase() === 'sliding'"
                [class.seated]="imagePhase() === 'docked'"
              >
                @if (activeImageUrl(); as src) {
                  <img class="dock-image" [src]="src" alt="" />
                }
              </div>
            </div>

            <section
              class="stage qstage"
              [class.previewing]="imagePhase() === 'preview' || imagePhase() === 'sliding'"
            >
              @if (r.currentQuestion; as q) {
                <header class="meta">
                  <div class="meta-info" [class.boosted]="(q.multiplier ?? 1) > 1" [style.--accent]="q.imageUrl ? typeInfo.image_mcq.accent : categoryInfo[q.category].accent">
                    @if ((q.multiplier ?? 1) > 1) {
                      @for (questionKey of [r.roundId + ':' + q.index]; track questionKey) {
                        <app-question-flames [ignite]="currentBoostIgnition()" />
                      }
                    }
                    <p class="counter">
                      <span class="current-label">{{ lang.t().currentQuestionLabel }} <span aria-hidden="true">·</span> {{ lang.t().question }}</span>
                      <b>{{ q.index + 1 }}<small>/{{ q.total }}</small></b>
                    </p>
                    @if (imagePhase() !== 'preview' && imagePhase() !== 'sliding') {
                      @if (q.imageUrl) {
                        <span class="cat-chip current-chip" [style.--accent]="typeInfo.image_mcq.accent">
                          <img [src]="typeInfo.image_mcq.icon" alt="" />
                          <span class="cat-name">{{ lang.t().imageMcq }}</span>
                        </span>
                      } @else {
                        <span class="cat-chip current-chip" [style.--accent]="categoryInfo[q.category].accent">
                          <img [src]="categoryInfo[q.category].icon" alt="" />
                          <span class="cat-name">{{ categoryLabel(q.category) }}</span>
                          <span class="pips" role="img" [attr.aria-label]="difficultyLabel(q.difficulty)" [title]="difficultyLabel(q.difficulty)">
                            @for (p of pips; track p) {
                              <i [class.on]="p <= difficultyLevel[q.difficulty]"></i>
                            }
                          </span>
                        </span>
                      }
                    }
                    <app-question-boost [multiplier]="q.multiplier ?? 1" [timed]="r.config.scoringMode === 'timed'" />
                  </div>
                  @if (rooms.nextQuestion(); as next) {
                    <div class="next-meta" [class.boosted]="nextBoost() > 1" [style.--accent]="next.type === 'image_mcq' ? typeInfo.image_mcq.accent : categoryInfo[next.category].accent">
                      @if (nextBoost() > 1) {
                        @for (pulse of [r.roundId + ':' + q.index + ':' + nextBoostPulse()]; track pulse) {
                          <app-question-flames [ignite]="nextBoostPulse() > 0" />
                        }
                      }
                      <app-question-boost [multiplier]="nextBoost()" [pulse]="nextBoostPulse()"
                        [timed]="r.config.scoringMode === 'timed'" />
                      <span class="next-label">{{ lang.t().upNext }} <span aria-hidden="true">→</span></span>
                      <span class="cat-chip" [style.--accent]="next.type === 'image_mcq' ? typeInfo.image_mcq.accent : categoryInfo[next.category].accent">
                        <img [src]="next.type === 'image_mcq' ? typeInfo.image_mcq.icon : categoryInfo[next.category].icon" alt="" />
                        <span class="cat-name">{{ next.type === 'image_mcq' ? lang.t().imageMcq : categoryLabel(next.category) }}</span>
                        @if (next.type !== 'image_mcq') {
                          <span class="pips" role="img" [attr.aria-label]="difficultyLabel(next.difficulty)" [title]="difficultyLabel(next.difficulty)">
                            @for (p of pips; track p) {
                              <i [class.on]="p <= difficultyLevel[next.difficulty]"></i>
                            }
                          </span>
                        }
                      </span>
                    </div>
                  }
                  <div class="timer-slot">
                    @if (r.phase === 'question' && answersOpen()) {
                      <app-timer-ring
                        [endsAt]="q.endsAt"
                        [durationMs]="q.durationMs"
                        (expired)="onQuestionExpired()"
                      />
                    } @else if (r.phase === 'reveal') {
                      <span class="reveal-sticker">{{ lang.t().correct }}</span>
                    }
                  </div>
                </header>
                <div class="track" aria-hidden="true">
                  <span [style.width.%]="((q.index + 1) / q.total) * 100"></span>
                </div>

                <div
                  class="prompt-block"
                  #promptBlock
                  [class.dimmed]="imagePhase() === 'preview' || imagePhase() === 'sliding'"
                >
                  <h1 class="prompt"><span class="fit">{{ q.prompt }}</span></h1>
                </div>

                <div class="answered-row">
                  <span class="answered-label">
                    {{ lang.t().answered }}
                    <b>{{ answeredPlayers().length }}/{{ players().length }}</b>
                  </span>
                  <div class="chips" #answeredStrip>
                    @for (p of answeredPlayers(); track p.id) {
                      <span
                        class="chip"
                        [attr.data-chip-id]="p.id"
                        [class.correct]="
                          r.phase === 'reveal' && (r.lastScoreDeltas?.[p.id] ?? 0) > 0
                        "
                        [style.background]="avatarColor(p.avatar)"
                        [title]="p.name"
                      >
                        {{ avatarEmoji(p.avatar) }}
                      </span>
                    }
                  </div>
                </div>

                <app-answer-grid
                  [options]="q.options"
                  [revealed]="r.phase === 'reveal'"
                  [correctIndex]="r.correctIndex"
                  [choicesByIndex]="choicesByIndex()"
                  [disabled]="true"
                />

                @if (
                  (imagePhase() === 'preview' || imagePhase() === 'sliding') &&
                  activeImageUrl();
                  as src
                ) {
                  <div
                    class="image-preview-overlay"
                    [class.sliding]="imagePhase() === 'sliding'"
                  >
                    <p class="preview-hint">{{ lang.t().getReady }}</p>
                    <img class="preview-image" [src]="src" alt="" />
                  </div>
                }
              } @else {
                <p class="waiting">{{ lang.t().waitingPlayers }}</p>
              }

              <button
                type="button"
                class="end key-btn danger"
                [disabled]="!rooms.hosting()"
                (click)="end()"
              >
                {{ lang.t().endGame }}
              </button>
            </section>
          </div>
        }
      } @else {
        <p class="waiting">{{ lang.t().roomNotFound }}</p>
      }
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
    .tv {
      min-height: 100dvh;
      background: var(--q-bg);
      padding: clamp(0.75rem, 1.5vw, 1.25rem);
      position: relative;
      overflow: hidden;
    }
    .spectator-banner {
      position: relative;
      z-index: 5;
      margin: 0 0 0.75rem;
      padding: 0.75rem 1rem;
      border: 3px solid var(--ink);
      border-radius: 14px;
      background: var(--bulb);
      box-shadow: 4px 4px 0 var(--ink);
      color: #1a1530;
      font-weight: 800;
    }
    .layout {
      display: grid;
      grid-template-columns: minmax(280px, 32%) 1fr;
      gap: 1.1rem;
      height: calc(100dvh - 2.5rem);
      align-items: stretch;
    }
    .board-col {
      display: flex;
      flex-direction: column;
      gap: 0.9rem;
      height: 100%;
      min-height: 0;
    }
    .board {
      flex: 1 1 auto;
      min-height: 0;
    }
    .board-col.with-image .board {
      flex: 0 0 auto;
    }
    .image-dock {
      flex: 0 0 auto;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.45rem;
      border: 3px solid var(--ink);
      border-radius: 20px;
      background: var(--q-card);
      box-shadow: 6px 6px 0 var(--ink);
      max-height: 0;
      opacity: 0;
      overflow: hidden;
      pointer-events: none;
      transform: translateY(12px) scale(0.96);
      transition:
        flex 0.45s cubic-bezier(0.22, 1, 0.36, 1),
        max-height 0.45s cubic-bezier(0.22, 1, 0.36, 1),
        opacity 0.4s ease,
        transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
    }
    .board-col:not(.with-image) {
      gap: 0;
    }
    .image-dock:not(.visible) {
      padding: 0;
      border-width: 0;
    }
    .image-dock.visible {
      pointer-events: auto;
      opacity: 1;
      max-height: 100%;
      transform: none;
    }
    .board-col.with-image .image-dock {
      flex: 1 1 0;
      min-height: 0;
    }
    .image-dock.receiving .dock-image {
      opacity: 0;
    }
    .image-dock.seated {
      animation: dock-settle 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .dock-image {
      max-width: 100%;
      max-height: 100%;
      aspect-ratio: 3 / 4;
      object-fit: contain;
      object-position: center top;
      border: 3px solid var(--ink);
      border-radius: 14px;
      display: block;
      transition: opacity 0.2s ease;
    }
    @keyframes dock-settle {
      from {
        transform: scale(0.97);
      }
    }
    .qstage {
      position: relative;
      container-type: inline-size;
      display: flex;
      flex-direction: column;
      gap: 0.9rem;
      padding: clamp(1rem, 2vw, 1.6rem) clamp(1rem, 2vw, 1.6rem) 3.6rem;
      height: 100%;
      overflow: visible;
    }
    .qstage app-answer-grid {
      margin-bottom: 0.6rem;
    }
    .qstage.previewing .answered-row,
    .qstage.previewing app-answer-grid {
      opacity: 0.22;
      pointer-events: none;
    }
    .prompt-block.dimmed .prompt {
      opacity: 0.2;
    }
    .image-preview-overlay {
      position: absolute;
      inset: 0;
      z-index: 8;
      display: grid;
      place-items: center;
      align-content: center;
      gap: 0.65rem;
      padding: 1rem;
      background: color-mix(in srgb, var(--q-card) 94%, transparent);
      animation: preview-in 0.35s ease;
    }
    .image-preview-overlay.sliding {
      animation: preview-to-dock 0.45s cubic-bezier(0.22, 1, 0.36, 1) forwards;
    }
    .preview-hint {
      margin: 0;
      font-family: var(--display);
      font-size: clamp(1.3rem, 2.2vw, 1.8rem);
      letter-spacing: 0.04em;
      color: var(--q-navy);
    }
    .preview-image {
      height: min(74vh, 700px);
      max-width: min(100%, 540px);
      aspect-ratio: 3 / 4;
      object-fit: cover;
      object-position: center top;
      border: 4px solid var(--ink);
      border-radius: 22px;
      background: var(--lcd);
      box-shadow: 8px 8px 0 var(--ink);
    }
    @keyframes preview-in {
      from {
        opacity: 0;
        transform: scale(0.96);
      }
    }
    @keyframes preview-to-dock {
      to {
        opacity: 0;
        transform: translate(-30vw, 22vh) scale(0.48);
      }
    }
    .next-meta app-question-flames {
      --flame-border: 2px;
      --flame-radius: 16px;
    }
    .meta {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-shrink: 0;
    }
    .meta-info {
      position: relative;
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      align-items: center;
      column-gap: 0.85rem;
      row-gap: 0.15rem;
      flex: 0 1 30rem;
      min-width: 0;
      min-height: 5.5rem;
      padding: 0.65rem 1rem 0.65rem 0.7rem;
      border: 3px solid var(--ink);
      border-radius: 18px;
      background: var(--accent);
      color: #1a1530;
      box-shadow: 4px 4px 0 var(--ink);
    }
    .counter {
      display: contents;
    }
    .current-label {
      grid-column: 2;
      grid-row: 1;
      margin: 0;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-size: 0.75rem;
      line-height: 1.3;
      min-height: 1.875rem;
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.25em;
    }
    .meta-info app-question-boost { grid-column: 3; grid-row: 1; }
    .counter b {
      grid-column: 1;
      grid-row: 1 / 3;
      padding: 0.45rem 0.6rem;
      border: 3px solid var(--ink);
      border-radius: 10px;
      background: var(--lcd);
      box-shadow: inset 0 3px 0 rgba(0, 0, 0, 0.5);
      color: var(--bulb);
      font-family: var(--display);
      font-weight: 400;
      font-size: 2rem;
      letter-spacing: 0.04em;
      text-shadow: 0 0 10px color-mix(in srgb, var(--bulb) 55%, transparent);
    }
    .counter small {
      font-size: 0.65em;
      opacity: 0.7;
    }
    .cat-chip {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      align-items: center;
      gap: 0.6rem;
      font-weight: 900;
      line-height: 1.15;
      min-width: 0;
    }
    .current-chip {
      grid-column: 2 / -1;
      grid-row: 2;
      font-family: var(--display);
      font-weight: 400;
      font-size: clamp(1.5rem, 2.1cqi, 1.75rem);
    }
    .cat-chip img {
      width: 2.75rem;
      height: 2.75rem;
      object-fit: contain;
    }
    .pips {
      display: inline-flex;
      gap: 3px;
      margin-left: 0.2rem;
    }
    .pips i {
      width: 10px;
      height: 10px;
      border: 2px solid currentColor;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.5);
    }
    .pips i.on {
      background: currentColor;
    }
    .track {
      flex-shrink: 0;
      height: 14px;
      border: 3px solid var(--ink);
      border-radius: 999px;
      background: var(--q-track);
      overflow: hidden;
    }
    .track span {
      display: block;
      height: 100%;
      background:
        repeating-linear-gradient(-45deg, rgba(255, 255, 255, 0.35) 0 6px, transparent 6px 12px),
        var(--bulb);
      border-right: 3px solid var(--ink);
      transition: width 0.4s ease;
    }
    .prompt-block {
      flex-shrink: 0;
      max-height: min(34%, 18vh);
      min-height: 0;
      overflow: hidden;
    }
    .prompt {
      margin: 0;
      max-width: 42ch;
      color: var(--q-navy);
      font-size: clamp(1.9rem, 4.2vw, 3.1rem);
      line-height: 1.15;
      font-weight: 900;
    }
    .prompt .fit {
      display: block;
      overflow-wrap: break-word;
    }
    .answered-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.65rem;
      flex-shrink: 0;
      min-height: 2.4rem;
    }
    .answered-label {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      font-weight: 800;
      color: var(--q-muted);
      font-size: 0.9rem;
    }
    .answered-label b {
      padding: 0.05rem 0.45rem;
      border: 2px solid var(--ink);
      border-radius: 8px;
      background: var(--lcd);
      color: var(--bulb);
      font-family: var(--display);
      font-weight: 400;
      font-size: 1.05rem;
    }
    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
    }
    .chip,
    .avatar {
      flex-shrink: 0;
      width: 2.4rem;
      height: 2.4rem;
      display: grid;
      place-items: center;
      border: 3px solid var(--ink);
      border-radius: 50%;
      font-size: 1.1rem;
    }
    .chip {
      animation: chip-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      transition: box-shadow 0.2s ease;
    }
    .chip.correct {
      box-shadow: 0 0 0 3px var(--q-lime);
    }
    @keyframes chip-pop {
      from {
        transform: scale(0.4);
      }
    }
    .reveal-sticker {
      padding: 0.5rem 1rem;
      border: 3px solid var(--ink);
      border-radius: 14px;
      background: var(--q-lime);
      box-shadow: 4px 4px 0 var(--ink);
      color: #1a1530;
      font-family: var(--display);
      font-size: clamp(1.3rem, 2.2vw, 1.7rem);
      transform: rotate(-6deg);
      animation: sticker-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    @keyframes sticker-in {
      from {
        opacity: 0;
        transform: scale(1.8) rotate(-18deg);
      }
    }
    .end {
      position: absolute;
      right: 1rem;
      bottom: 0.9rem;
      z-index: 2;
      font-size: 0.9rem;
    }
    .waiting {
      font-weight: 800;
      color: var(--q-muted);
      padding: 2rem;
    }

    /* End screen */
    .final {
      max-width: 1040px;
      margin: 1.5rem auto;
      padding-left: 0.6rem;
      display: grid;
      gap: 1.6rem;
    }
    .winner {
      overflow: hidden;
      display: grid;
      justify-items: center;
      gap: 0.4rem;
      padding: 2rem 1.2rem 1.6rem;
      text-align: center;
    }
    .winner > :not(.confetti) {
      position: relative;
    }
    .winner .show-title {
      font-size: clamp(2.2rem, 6vw, 3.6rem);
    }
    .winner .crown {
      width: 64px;
      height: 44px;
      margin-bottom: -0.6rem;
      fill: var(--bulb);
      stroke: var(--ink);
      stroke-width: 2.4;
      stroke-linejoin: round;
      transform: rotate(-8deg);
    }
    .avatar.big {
      width: 6rem;
      height: 6rem;
      border-width: 4px;
      font-size: 3rem;
      box-shadow: 5px 5px 0 var(--ink);
    }
    .eyebrow {
      margin: 0.3rem 0 0;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      font-size: 0.85rem;
      color: var(--q-muted);
    }
    .co-winners {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 1rem 1.6rem;
    }
    .co-winner {
      display: inline-flex;
      align-items: center;
      gap: 0.6rem;
    }
    .co-winner .avatar {
      width: 3.6rem;
      height: 3.6rem;
      font-size: 1.8rem;
    }
    .co-winner .show-title {
      font-size: clamp(1.6rem, 4vw, 2.4rem);
    }
    .confetti {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }
    .confetti i {
      position: absolute;
      top: -20px;
      left: calc(var(--i) * 7% + 2%);
      width: 10px;
      height: 16px;
      border: 2px solid var(--ink);
      border-radius: 3px;
      background: var(--q-cyan);
      animation: fall 3.2s linear infinite;
      animation-delay: calc(var(--i) * -0.45s);
    }
    .confetti i:nth-child(4n + 1) {
      background: var(--q-pink);
    }
    .confetti i:nth-child(4n + 2) {
      background: var(--bulb);
      border-radius: 50%;
    }
    .confetti i:nth-child(4n + 3) {
      background: var(--q-lime);
    }
    @keyframes fall {
      to {
        transform: translateY(420px) rotate(540deg);
      }
    }
    .rematch-hub {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }
    .hub-title {
      font-size: clamp(1.8rem, 4vw, 2.6rem);
    }
    .code-card {
      display: grid;
      justify-items: center;
      gap: 0.8rem;
    }
    .count {
      margin-left: 0.4rem;
      padding: 0 0.5rem;
      border: 2px solid var(--ink);
      border-radius: 8px;
      background: var(--bulb);
      color: #1a1530;
    }
    .ready {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-wrap: wrap;
      gap: 0.6rem;
    }
    .card {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.35rem 0.7rem 0.35rem 0.35rem;
      border: 3px solid var(--ink);
      border-radius: 14px;
      background: var(--q-card);
      box-shadow: 0 4px 0 var(--ink);
      transform: rotate(-1deg);
      animation: chip-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .card:nth-child(even) {
      transform: rotate(1deg);
    }
    .name {
      font-weight: 900;
      color: var(--q-navy);
    }
    .final-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      align-items: stretch;
      gap: 1rem;
    }
    .final-actions .key-btn,
    .final-actions .go {
      width: 100%;
      box-sizing: border-box;
      padding: 1rem 1.5rem;
      border-radius: 16px;
      font-family: var(--display);
      font-size: clamp(1.05rem, 2.2vw, 1.6rem);
      font-weight: 400;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      box-shadow: 0 6px 0 var(--ink);
    }
    .final-actions .key-btn:hover:not(:disabled),
    .final-actions .go:hover:not(:disabled) {
      box-shadow: 0 8px 0 var(--ink);
    }
    .final-actions .key-btn:active:not(:disabled),
    .final-actions .go:active:not(:disabled) {
      box-shadow: 0 0 0 var(--ink);
    }
    .modal p {
      margin: 0;
      font-weight: 800;
      line-height: 1.35;
    }

    .next-meta {
      position: relative;
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
      gap: 0.3rem;
      flex: 0 1 21rem;
      min-width: 0;
      padding: 0.6rem 0.85rem;
      border: 2px solid var(--ink);
      border-radius: 16px;
      background: color-mix(in srgb, var(--accent) 10%, var(--q-card));
      color: var(--q-navy);
    }
    .next-label {
      grid-column: 1;
      grid-row: 1;
      min-height: 1.875rem;
      display: flex;
      align-items: center;
      gap: 0.25em;
      flex-shrink: 0;
      color: var(--q-muted);
      font-size: 0.75rem;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      overflow-wrap: anywhere;
    }
    .next-meta app-question-boost { grid-column: 2; grid-row: 1; }
    .next-meta .cat-chip {
      grid-column: 1 / -1;
      grid-row: 2;
      font-size: 1.125rem;
    }
    .next-meta .cat-chip img {
      width: 2rem;
      height: 2rem;
    }
    .cat-name {
      min-width: 0;
      overflow-wrap: anywhere;
    }
    .cat-chip img,
    .pips {
      flex-shrink: 0;
    }
    .timer-slot {
      display: grid;
      place-items: center;
      flex-shrink: 0;
      min-width: 5rem;
      min-height: 5rem;
      margin-left: auto;
    }
    @container (max-width: 680px) {
      .next-meta app-question-flames { --flame-height-scale: .3; }
      .meta {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 0.8rem;
      }
      .timer-slot {
        grid-column: 2;
        grid-row: 1;
      }
      .next-meta {
        grid-column: 1;
        grid-row: 2;
        gap: 0.45rem 0.75rem;
        padding: 0.5rem 0.7rem;
      }
    }
    @container (max-width: 420px) {
      .meta { grid-template-columns: minmax(0, 1fr); }
      .timer-slot { grid-column: 1; grid-row: 3; }
      .meta-info {
        grid-template-columns: minmax(0, 1fr) auto;
        padding: 0.6rem;
        row-gap: 0.4rem;
      }
      .counter {
        grid-column: 1;
        grid-row: 1;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.4rem;
        margin: 0;
        flex-wrap: wrap;
      }
      .counter b {
        font-size: 1.5rem;
        padding: 0.2rem 0.4rem;
      }
      .current-label {
        font-size: 0.65rem;
      }
      .current-chip {
        grid-column: 1 / -1;
        grid-row: 2;
        grid-template-columns: auto minmax(0, 1fr);
        gap: 0.3rem 0.5rem;
      }
      .current-chip img {
        width: 2.5rem;
        height: 2.5rem;
      }
      .current-chip .pips {
        grid-column: 2;
        margin: 0;
      }
      .next-meta {
        grid-column: 1 / -1;
      }
      .meta-info app-question-boost { grid-column: 2; grid-row: 1; }
    }
    @media (max-width: 960px) {
      .layout {
        grid-template-columns: 1fr;
        height: auto;
      }
      .board-col.with-image .image-dock {
        flex: 0 0 auto;
        min-height: min(50vh, 420px);
      }
      .preview-image {
        height: min(68vh, 560px);
        max-width: min(100%, 420px);
      }
      .qstage {
        height: auto;
        min-height: min(72dvh, 720px);
      }
      @keyframes preview-to-dock {
        to {
          opacity: 0;
          transform: translate(0, 36vh) scale(0.5);
        }
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .image-preview-overlay,
      .image-preview-overlay.sliding,
      .image-dock.seated,
      .chip,
      .card,
      .reveal-sticker {
        animation: none;
      }
      .image-dock,
      .dock-image,
      .track span {
        transition: none;
      }
    }
  `,
})
export class PlayPage implements OnInit, OnDestroy {
  readonly lang = inject(LanguageService);
  readonly rooms = inject(GameRoomService);
  readonly ent = inject(EntitlementService);
  private readonly upgrade = inject(UpgradeDialogService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snack = inject(SnackbarService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly serverTime = inject(ServerTimeService);

  readonly room = this.rooms.room;
  readonly nextBoost = computed(() => this.room() ? nextQuestionMultiplier(this.room()!) : 1);
  readonly nextBoostPulse = signal(0);
  readonly currentBoostIgnition = signal(false);
  private boostState: { round: string; index: number; next: number } | null = null;
  private boostBatchTimer: ReturnType<typeof setTimeout> | undefined;
  private boostAudio: HTMLAudioElement | null = null;
  readonly avatarColor = avatarColor;
  readonly avatarEmoji = avatarEmoji;
  readonly answeredStrip = viewChild<ElementRef<HTMLElement>>('answeredStrip');
  readonly tvRoot = viewChild<ElementRef<HTMLElement>>('tvRoot');
  readonly promptBlock = viewChild<ElementRef<HTMLElement>>('promptBlock');

  readonly categories = CATEGORIES;
  readonly questionTypes = QUESTION_TYPES;
  readonly presets = ROUND_LENGTH_PRESETS;
  readonly timerPresets = QUESTION_SECONDS_PRESETS;
  readonly minRoundLength = MIN_ROUND_LENGTH;
  readonly selectedCats = signal<CategoryId[]>([...CATEGORIES]);
  readonly selectedTypes = signal<QuestionType[]>([...QUESTION_TYPES]);
  readonly categoryMemory = signal<CategoryId[]>([...CATEGORIES]);
  readonly length = signal(10);
  readonly customMode = signal(false);
  readonly customLength = signal(10);
  readonly scoringMode = signal<ScoringMode>('timed');
  readonly questionSeconds = signal(15);
  readonly powerUpSlots = signal<PowerUpSlots>(
    [...EMPTY_POWER_UP_SLOTS] as PowerUpSlots,
  );
  readonly slotSlide = signal<{ index: number; dir: 1 | -1 } | null>(null);
  readonly isQuestionTypeFree = isQuestionTypeFree;
  readonly isPowerUpFree = isPowerUpFree;
  readonly isRoundLengthFree = isRoundLengthFree;

  powerUpOf(slot: PowerUpSlot) {
    return POWER_UP_CATALOG.find((p) => p.id === slot);
  }
  readonly categoryInfo: Record<CategoryId, { icon: string; descKey: keyof UiStrings; accent: string }> = {
    geography: { icon: '/room-icons/geo.png', descKey: 'descGeography', accent: CATEGORY_ACCENT.geography },
    biology: { icon: '/room-icons/bio.png', descKey: 'descBiology', accent: CATEGORY_ACCENT.biology },
    history: { icon: '/room-icons/his.png', descKey: 'descHistory', accent: CATEGORY_ACCENT.history },
    technology: { icon: '/room-icons/tech.png', descKey: 'descTechnology', accent: CATEGORY_ACCENT.technology },
    sports: { icon: '/room-icons/sports.png', descKey: 'descSports', accent: CATEGORY_ACCENT.sports },
    movies: { icon: '/room-icons/movtv.png', descKey: 'descMovies', accent: CATEGORY_ACCENT.movies },
    famous: { icon: '/room-icons/fam.png', descKey: 'descFamous', accent: CATEGORY_ACCENT.famous },
    islam: { icon: '/room-icons/isl.png', descKey: 'descIslam', accent: CATEGORY_ACCENT.islam },
    food: { icon: '/room-icons/food.png', descKey: 'descFood', accent: CATEGORY_ACCENT.food },
    images: { icon: '/room-icons/picture.png', descKey: 'descPictureQ', accent: CATEGORY_ACCENT.images },
  };
  readonly typeInfo: Record<QuestionType, { icon: string; descKey: keyof UiStrings; accent: string }> = {
    mcq: { icon: '/room-icons/text.png', descKey: 'descTextQ', accent: TYPE_ACCENT.mcq },
    image_mcq: { icon: '/room-icons/picture.png', descKey: 'descPictureQ', accent: TYPE_ACCENT.image_mcq },
  };
  readonly pips = [1, 2, 3];
  readonly difficultyLevel: Record<string, number> = { easy: 1, medium: 2, hard: 3 };
  readonly confetti = Array.from({ length: 14 }, (_, i) => i);
  readonly reduceMotion =
    typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  readonly scoringInfo: Record<ScoringMode, { descKey: keyof UiStrings; accent: string }> = {
    standard: { descKey: 'descScoringStandard', accent: SCORING_ACCENT.standard },
    timed: { descKey: 'descScoringTimed', accent: SCORING_ACCENT.timed },
  };
  readonly powerUpBlocked = computed(() =>
    this.powerUpSlots().some((slot) => !!slot && this.ent.powerUpLocked(slot)),
  );
  readonly resetPrompt = signal(false);
  readonly rematching = signal(false);
  readonly copied = signal(false);
  readonly imagePhase = signal<ImagePhase>('idle');
  readonly activeImageUrl = signal<string | null>(null);
  /** Ticks so answersOpen() / timer gate stay in sync with server time. */
  readonly clock = signal(0);
  private readonly promptText = computed(() => this.room()?.currentQuestion?.prompt ?? null);
  private configSynced = false;
  private promptObserver: ResizeObserver | null = null;
  private promptStage: Element | null = null;
  private promptFitScheduled = false;

  private code = '';
  /** Tracks which question index has already been sent to reveal (prevents double-fire). */
  private revealedForIndex = -1;
  private lastHandledReveal = -1;
  private lastFlyReveal = -1;
  private lastImageQuestionKey = '';
  private imageTimerIds: ReturnType<typeof setTimeout>[] = [];
  /** Handle returned by setTimeout so we can cancel stale reveal-advance callbacks. */
  private revealTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private knownRematchReady = new Set<string>();

  readonly answersOpen = computed(() => {
    this.clock();
    const q = this.room()?.currentQuestion;
    if (!q) return true;
    return this.serverTime.nowMs() >= (q.answerOpensAt ?? 0);
  });

  readonly players = computed<RoomPlayer[]>(() =>
    Object.values(this.room()?.players ?? {}),
  );

  readonly answeredPlayers = computed(() => {
    const r = this.room();
    if (!r || r.currentIndex < 0) return [] as RoomPlayer[];
    const opensAt = r.currentQuestion?.answerOpensAt ?? 0;
    const bucket = r.answers[String(r.currentIndex)] ?? {};
    return Object.entries(bucket)
      .filter(([, ans]) => ans.answeredAt >= opensAt)
      .map(([id]) => r.players[id])
      .filter((p): p is RoomPlayer => !!p);
  });

  readonly choicesByIndex = computed(() => {
    const r = this.room();
    const out: Record<number, RoomPlayer[]> = { 0: [], 1: [], 2: [], 3: [] };
    if (!r || r.currentIndex < 0) return out;
    const opensAt = r.currentQuestion?.answerOpensAt ?? 0;
    const bucket = r.answers[String(r.currentIndex)] ?? {};
    for (const [playerId, ans] of Object.entries(bucket)) {
      if (ans.answeredAt < opensAt) continue;
      const player = r.players[playerId];
      if (!player) continue;
      const choice = Number(ans.choice);
      if (choice >= 0 && choice <= 3) {
        out[choice] = [...(out[choice] ?? []), player];
      }
    }
    return out;
  });

  readonly rematchReadyPlayers = computed(() => {
    const r = this.room();
    if (!r) return [] as RoomPlayer[];
    return Object.keys(r.rematchReady ?? {})
      .filter((id) => r.rematchReady[id])
      .map((id) => r.players[id])
      .filter((p): p is RoomPlayer => !!p);
  });

  readonly needsCategories = computed(() =>
    this.selectedTypes().includes('mcq'),
  );
  readonly effectiveLength = computed(() =>
    this.customMode() ? this.customLength() : this.length(),
  );
  readonly customLengthValid = computed(
    () => !this.customMode() || isValidRoundLength(this.customLength()),
  );
  readonly canRematch = computed(
    () =>
      this.selectedTypes().length > 0 &&
      (!this.needsCategories() || this.selectedCats().length > 0) &&
      this.customLengthValid() &&
      this.rematchReadyPlayers().length > 0,
  );

  constructor() {
    afterRenderEffect(() => {
      const prompt = this.promptText();
      const block = this.promptBlock()?.nativeElement;
      if (!block || prompt == null) return;
      const stage = block.closest('.qstage');
      if (stage && this.promptStage !== stage) {
        this.promptObserver?.disconnect();
        this.promptObserver = new ResizeObserver(() => this.schedulePromptFit());
        this.promptObserver.observe(stage);
        this.promptStage = stage;
      }
      this.schedulePromptFit();
    });

    // The finished round may have been configured while Pro was active, so the
    // rematch form has to be re-clamped once the entitlement resolves.
    effect(() => {
      const pro = this.ent.isPro();
      if (!pro) untracked(() => this.dropLockedSelections());
    });
    effect(() => {
      const r = this.room();
      if (!r || r.code !== this.code) {
        untracked(() => this.clearBoostEffects());
        this.boostState = null;
        return;
      }
      untracked(() => this.syncBoostEffects(r));

      if (r.phase === 'finished' && !this.configSynced) {
        this.configSynced = true;
        const cats =
          r.config.categories.length > 0
            ? [...r.config.categories]
            : [...this.categoryMemory()];
        this.selectedCats.set(
          r.config.questionTypes.includes('mcq') ? cats : [],
        );
        if (cats.length > 0) this.categoryMemory.set(cats);
        this.selectedTypes.set([...r.config.questionTypes]);
        const normalized = normalizeRoundLength(r.config.roundLength);
        const lengthIsPreset = (ROUND_LENGTH_PRESETS as readonly number[]).includes(
          normalized,
        );
        if (lengthIsPreset) {
          this.customMode.set(false);
          this.length.set(normalized);
        } else {
          this.customMode.set(true);
          this.customLength.set(normalized);
        }
        this.scoringMode.set(r.config.scoringMode === 'standard' ? 'standard' : 'timed');
        this.questionSeconds.set(clampQuestionSeconds(r.config.questionSeconds ?? 15));
        this.powerUpSlots.set([...r.config.powerUpSlots] as PowerUpSlots);
        this.knownRematchReady = new Set(
          Object.keys(r.rematchReady ?? {}).filter((id) => r.rematchReady[id]),
        );
        // Seeding above copies the finished round's config verbatim; re-clamp so
        // a lapsed or signed-out host cannot carry Pro settings into a rematch.
        if (!this.ent.isPro()) this.dropLockedSelections();
      }
      if (r.phase === 'finished') {
        const readyIds = Object.keys(r.rematchReady ?? {}).filter(
          (id) => r.rematchReady[id],
        );
        for (const id of readyIds) {
          if (!this.knownRematchReady.has(id)) {
            this.knownRematchReady.add(id);
            this.playRevengeOptInSfx();
          }
        }
      }
      if (r.phase !== 'finished') {
        this.configSynced = false;
        this.knownRematchReady.clear();
      }

      if (
        this.rooms.hosting() &&
        r.phase === 'reveal' &&
        this.lastHandledReveal !== r.currentIndex
      ) {
        this.lastHandledReveal = r.currentIndex;
        if (this.lastFlyReveal !== r.currentIndex) {
          this.lastFlyReveal = r.currentIndex;
          this.playCorrectSfx();
          queueMicrotask(() => this.flyScores(r.lastScoreDeltas ?? {}));
        }
        // Cancel any stale timeout from a previous question before scheduling.
        if (this.revealTimeoutId != null) {
          clearTimeout(this.revealTimeoutId);
        }
        const advanceForIndex = r.currentIndex;
        this.revealTimeoutId = setTimeout(() => {
          this.revealTimeoutId = null;
          void this.advanceFromReveal(advanceForIndex);
        }, REVEAL_MS);
      }

      this.syncImagePresentation(r);
    });

    interval(200)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.clock.set(this.serverTime.nowMs());
        if (!this.rooms.hosting()) return;
        const r = this.room();
        if (r?.phase !== 'question') return;
        // Already sent reveal for this question — don't fire again.
        if (this.revealedForIndex === r.currentIndex) return;
        const playerCount = Object.keys(r.players).length;
        if (playerCount === 0) return;
        const opensAt = r.currentQuestion?.answerOpensAt ?? 0;
        const qKey = String(r.currentIndex);
        const bucket = r.answers[qKey] ?? {};
        const settled = questionSettled(
          Object.keys(r.players).map((id) => ({
            hasAnswer:
              bucket[id] != null && bucket[id].answeredAt >= opensAt,
            blankLocked: r.powerUps?.[id]?.locked?.[qKey]?.blank === true,
          })),
        );
        if (settled) {
          void this.onQuestionExpired();
        }
      });
  }

  private schedulePromptFit(): void {
    if (this.promptFitScheduled) return;
    this.promptFitScheduled = true;
    requestAnimationFrame(() => {
      this.promptFitScheduled = false;
      const block = this.promptBlock()?.nativeElement;
      const prompt = block?.querySelector('.prompt') as HTMLElement | null;
      if (!block || !prompt) return;
      const rootPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      fitFont(prompt, 1.25 * rootPx, block);
    });
  }

  private syncImagePresentation(r: {
    phase: string;
    currentQuestion: {
      id: string;
      index: number;
      imageUrl?: string | null;
      answerOpensAt: number;
    } | null;
  }): void {
    const q = r.currentQuestion;
    const live = r.phase === 'question' || r.phase === 'reveal';
    if (!live || !q?.imageUrl) {
      this.clearImagePresentation();
      return;
    }

    const key = `${q.id}:${q.index}`;
    if (key === this.lastImageQuestionKey) return;
    this.lastImageQuestionKey = key;
    this.beginImagePresentation(q.imageUrl, q.answerOpensAt);
  }

  private beginImagePresentation(url: string, answerOpensAt: number): void {
    this.clearImageTimers();
    this.activeImageUrl.set(url);
    try {
      const warm = new Image();
      warm.src = url;
    } catch {
      /* ignore */
    }

    const now = this.serverTime.nowMs();
    const reduceMotion =
      typeof matchMedia === 'function' &&
      matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (now >= answerOpensAt || reduceMotion) {
      this.imagePhase.set('docked');
      return;
    }

    const remaining = answerOpensAt - now;
    const holdMs = Math.max(0, remaining - IMAGE_SLIDE_MS);
    this.imagePhase.set('preview');

    this.imageTimerIds.push(
      setTimeout(() => {
        this.imagePhase.set('sliding');
        this.imageTimerIds.push(
          setTimeout(() => {
            this.imagePhase.set('docked');
          }, IMAGE_SLIDE_MS),
        );
      }, holdMs),
    );
  }

  private clearImagePresentation(): void {
    this.clearImageTimers();
    this.lastImageQuestionKey = '';
    this.imagePhase.set('idle');
    this.activeImageUrl.set(null);
  }

  private clearImageTimers(): void {
    for (const id of this.imageTimerIds) clearTimeout(id);
    this.imageTimerIds = [];
  }

  ngOnInit(): void {
    this.code = this.route.snapshot.paramMap.get('code') ?? '';
    void this.rooms.watchRoom(this.code).catch(() => {
      this.rooms.room.set(null);
    });
  }

  ngOnDestroy(): void {
    this.clearBoostEffects();
    this.promptObserver?.disconnect();
    this.promptObserver = null;
    this.promptStage = null;
    // Implicit teardown (back nav, tab close) must NOT delete the room — a real
    // tab close arms the host onDisconnect marker; expired/abandoned rooms are
    // reaped lazily + by the sweep. Explicit exit uses goHome().
    this.clearImageTimers();
    this.rooms.stopWatching();
  }

  private clearBoostEffects(): void {
    clearTimeout(this.boostBatchTimer);
    this.boostBatchTimer = undefined;
    this.nextBoostPulse.set(0);
    this.currentBoostIgnition.set(false);
    this.boostAudio?.pause();
    this.boostAudio = null;
  }

  private syncBoostEffects(room: RoomState): void {
    const next = nextQuestionMultiplier(room);
    const round = room.roundId ?? '';
    const before = this.boostState;
    this.boostState = { round, index: room.currentIndex, next };
    // First snapshot on refresh restores state silently.
    if (!before || before.round !== round || before.index !== room.currentIndex ||
        (room.phase !== 'question' && room.phase !== 'reveal')) {
      this.clearBoostEffects();
      this.currentBoostIgnition.set(!!before && before.round === round &&
        before.index !== room.currentIndex && room.phase === 'question' &&
        (room.currentQuestion?.multiplier ?? 1) > 1 && !document.hidden);
      return;
    }
    if (next <= before.next || document.hidden || this.boostBatchTimer != null) return;
    // A short fixed window groups simultaneous uses without delaying a busy room indefinitely.
    this.boostBatchTimer = setTimeout(() => {
      this.boostBatchTimer = undefined;
      const latest = this.room();
      if (!latest || latest.roundId !== round || latest.currentIndex !== room.currentIndex ||
          document.hidden || (latest.phase !== 'question' && latest.phase !== 'reveal')) return;
      this.nextBoostPulse.update((n) => n + 1);
      this.playBoostSound(latest, before.next === 1);
    }, 250);
  }

  private playBoostSound(room: RoomState, first: boolean): void {
    const endsAt = room.currentQuestion?.endsAt;
    if (room.phase !== 'question' || (endsAt != null && endsAt - this.serverTime.nowMs() < 5000)) return;
    this.boostAudio?.pause();
    const audio = new Audio(first ? '/sounds/double_it_sound.mp3' : '/sounds/double_it_+1.mp3');
    audio.volume = 0.32;
    audio.loop = false;
    this.boostAudio = audio;
    const start = () => {
      if (this.boostAudio !== audio || document.hidden) return;
      if (first && Number.isFinite(audio.duration) && audio.duration > 3) {
        audio.currentTime = audio.duration - 3;
      }
      void audio.play().catch(() => { /* Visual feedback remains authoritative. */ });
    };
    if (first && audio.readyState < 1) audio.addEventListener('loadedmetadata', start, { once: true });
    else start();
  }

  async goHome(): Promise<void> {
    await this.rooms.leaveHostedRoom(this.code);
    await this.router.navigateByUrl('/');
  }

  async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.code);
      this.copied.set(true);
      this.snack.success(this.lang.t().copied);
      window.setTimeout(() => this.copied.set(false), 1500);
    } catch {
      /* ignore */
    }
  }

  categoryLabel(cat: string): string {
    const key = cat as CategoryId;
    return this.lang.t()[key] ?? cat;
  }

  categoryDesc(cat: CategoryId): string {
    return this.lang.t()[this.categoryInfo[cat].descKey];
  }

  difficultyLabel(diff: string): string {
    const key = diff as 'easy' | 'medium' | 'hard';
    return this.lang.t()[key] ?? diff;
  }

  cycleSlot(index: number, direction: number): void {
    const dir: 1 | -1 = direction < 0 ? -1 : 1;
    this.slotSlide.set({ index, dir });
    const next = [...this.powerUpSlots()] as PowerUpSlots;
    next[index] = cyclePowerUpSlot(next[index], dir);
    this.powerUpSlots.set(next);
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

  isWeeklyCategory(cat: CategoryId): boolean {
    return cat === this.ent.freeThisWeek();
  }

  isProCategory(cat: CategoryId): boolean {
    return (PRO_CATEGORIES as readonly CategoryId[]).includes(cat);
  }

  proAlt(locked: boolean): string {
    return locked ? this.lang.t().proLocked : this.lang.t().proName;
  }

  /** Strips Pro-only picks from the rematch form. Mirrors the create-round page. */
  private dropLockedSelections(): void {
    const cats = this.selectedCats().filter((c) => !this.ent.categoryLocked(c));
    if (cats.length !== this.selectedCats().length) {
      this.selectedCats.set(
        cats.length > 0 || !this.needsCategories() ? cats : [...FREE_CATEGORIES],
      );
    }
    const memory = this.categoryMemory().filter((c) => !this.ent.categoryLocked(c));
    if (memory.length !== this.categoryMemory().length) {
      this.categoryMemory.set(memory.length > 0 ? memory : [...FREE_CATEGORIES]);
    }
    const types = this.selectedTypes().filter((t) => !this.ent.questionTypeLocked(t));
    if (types.length !== this.selectedTypes().length) {
      this.selectedTypes.set(types.length > 0 ? types : ['mcq']);
    }
    if (this.ent.scoringModeLocked(this.scoringMode())) this.scoringMode.set('standard');
    if (this.customMode()) this.customMode.set(false);
    if (this.ent.roundLengthLocked(this.length())) this.length.set(FREE_MAX_ROUND_LENGTH);
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

  toggleCategory(cat: CategoryId): void {
    if (!this.needsCategories()) return;
    if (this.ent.categoryLocked(cat)) {
      this.upgrade.show();
      return;
    }
    const cur = this.selectedCats();
    const next = cur.includes(cat)
      ? cur.filter((c) => c !== cat)
      : [...cur, cat];
    this.selectedCats.set(next);
    if (next.length > 0) this.categoryMemory.set([...next]);
  }

  toggleType(t: QuestionType): void {
    if (this.ent.questionTypeLocked(t)) {
      this.upgrade.show();
      return;
    }
    const cur = this.selectedTypes();
    const turningOff = cur.includes(t);
    const next = turningOff ? cur.filter((x) => x !== t) : [...cur, t];

    if (t === 'mcq') {
      if (turningOff) {
        const cats = this.selectedCats();
        if (cats.length > 0) this.categoryMemory.set([...cats]);
        this.selectedCats.set([]);
      } else {
        const mem = this.categoryMemory();
        const restored = mem.length > 0 ? [...mem] : [...CATEGORIES];
        this.selectedCats.set(restored.filter((c) => !this.ent.categoryLocked(c)));
      }
    }

    this.selectedTypes.set(next);
  }

  async onQuestionExpired(): Promise<void> {
    if (!this.rooms.hosting()) return;
    const r = this.room();
    if (r?.phase !== 'question') return;
    // Prevent double-reveal: only fire once per question index.
    if (this.revealedForIndex === r.currentIndex) return;
    this.revealedForIndex = r.currentIndex;
    try {
      await this.rooms.reveal(this.code);
    } catch {
      // If reveal failed, allow retry.
      this.revealedForIndex = -1;
    }
  }

  private async advanceFromReveal(forIndex: number): Promise<void> {
    if (!this.rooms.hosting()) return;
    const r = this.room();
    // Only advance if still in reveal phase for the expected question index.
    if (r?.phase !== 'reveal' || r.currentIndex !== forIndex) return;
    await this.rooms.nextAfterReveal(this.code);
  }

  async end(): Promise<void> {
    if (!this.rooms.hosting()) return;
    await this.rooms.endGame(this.code);
  }

  async rematch(): Promise<void> {
    if (!this.rooms.hosting() || !this.canRematch() || this.rematching()) return;
    if (this.powerUpBlocked()) {
      this.resetPrompt.set(true);
      return;
    }
    this.rematching.set(true);
    try {
      const room = this.room();
      const nextConfig: RoomConfig = {
        categories: this.selectedCats(),
        questionTypes: this.selectedTypes(),
        roundLength: normalizeRoundLength(this.effectiveLength()),
        language: room?.config.language ?? this.lang.lang(),
        scoringMode: this.scoringMode(),
        questionSeconds: clampQuestionSeconds(this.questionSeconds()),
        powerUpSlots: this.powerUpSlots(),
      };
      // Reset local reveal/fly guards for the new round.
      this.lastHandledReveal = -1;
      this.lastFlyReveal = -1;
      this.revealedForIndex = -1;
      if (this.revealTimeoutId != null) {
        clearTimeout(this.revealTimeoutId);
        this.revealTimeoutId = null;
      }
      await this.rooms.rematch(this.code, nextConfig);
    } catch (e) {
      console.error(e);
      let msg = this.lang.t().startFailed;
      if (e instanceof Error) {
        if (e.message === 'NOT_HOST') msg = this.lang.t().alreadyHostingOtherTab;
        else if (e.message === 'NO_QUESTIONS') msg = this.lang.t().noQuestions;
        else if (e.message === 'DOUBLE_IT_UPDATE_REQUIRED') msg = this.lang.t().doubleItUpdateRequired;
        else if (e.message === 'NO_PLAYERS') msg = this.lang.t().minPlayers;
      }
      this.snack.error(msg);
    } finally {
      this.rematching.set(false);
    }
  }

  confirmReset(): void {
    this.resetPrompt.set(false);
    this.powerUpSlots.set([...EMPTY_POWER_UP_SLOTS]);
    void this.rematch();
  }

  private playCorrectSfx(): void {
    this.boostAudio?.pause();
    this.boostAudio = null;
    try {
      const audio = new Audio('/sounds/correct_answer.mp3');
      void audio.play().catch(() => {
        /* Autoplay may be blocked until a host gesture. */
      });
    } catch {
      /* Ignore audio failures. */
    }
  }

  private playRevengeOptInSfx(): void {
    try {
      const audio = new Audio('/sounds/revenge_opt_in.mp3');
      void audio.play().catch(() => {
        /* Autoplay may be blocked until a host gesture. */
      });
    } catch {
      /* Ignore audio failures. */
    }
  }

  private flyScores(deltas: Record<string, number>): void {
    const root = this.tvRoot()?.nativeElement;
    const strip = this.answeredStrip()?.nativeElement;
    if (!root || !strip) return;

    for (const [playerId, delta] of Object.entries(deltas)) {
      if (!delta || delta <= 0) continue;
      const chip = strip.querySelector(`[data-chip-id="${playerId}"]`) as HTMLElement | null;
      const row = root.querySelector(`[data-player-id="${playerId}"]`) as HTMLElement | null;
      if (!chip || !row) continue;

      const from = chip.getBoundingClientRect();
      const to = row.getBoundingClientRect();
      const el = document.createElement('div');
      el.textContent = `+${delta}`;
      el.style.cssText = `
        position: fixed;
        left: ${from.left + from.width / 2}px;
        top: ${from.top + from.height / 2}px;
        transform: translate(-50%, -50%);
        z-index: 50;
        padding: 0.1rem 0.5rem;
        border: 3px solid #1a1530;
        border-radius: 10px;
        background: #a3e635;
        color: #1a1530;
        font-family: var(--display, sans-serif);
        font-size: 1.3rem;
        pointer-events: none;
        transition: left 0.85s cubic-bezier(.2,.8,.2,1), top 0.85s cubic-bezier(.2,.8,.2,1), opacity 0.85s ease, transform 0.85s ease;
      `;
      root.appendChild(el);
      requestAnimationFrame(() => {
        el.style.left = `${to.right - 24}px`;
        el.style.top = `${to.top + to.height / 2}px`;
        el.style.opacity = '0';
        el.style.transform = 'translate(-50%, -50%) scale(0.6)';
      });
      window.setTimeout(() => el.remove(), 900);
    }
  }
}
