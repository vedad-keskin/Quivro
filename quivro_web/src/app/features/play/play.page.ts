import {
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
  type PowerUpSlots,
  type RoomConfig,
  type RoomPlayer,
  type ScoringMode,
} from '../../core/room.models';
import { ServerTimeService } from '../../core/server-time.service';
import { SnackbarService } from '../../core/snackbar.service';
import { AnswerGrid } from '../../shared/answer-grid';
import { Leaderboard } from '../../shared/leaderboard';
import { TimerRing } from '../../shared/timer-ring';
import { UpgradeDialogService } from '../../shared/upgrade-dialog.service';

type ImagePhase = 'idle' | 'preview' | 'sliding' | 'docked';

@Component({
  selector: 'app-play',
  imports: [AnswerGrid, FormsModule, Leaderboard, TimerRing],
  template: `
    <div class="tv" #tvRoot>
      @if (room(); as r) {
        @if (!rooms.hosting()) {
          <p class="spectator-banner">{{ lang.t().alreadyHostingOtherTab }}</p>
        }
        @if (r.phase === 'finished') {
          <section class="final">
            <div class="brand">
              <h1>{{ lang.t().finalLeaderboard }}</h1>
              <div class="q-brand-line"></div>
            </div>
            @if (r.lastWinners.length === 1) {
              <p class="winner-banner">
                {{ lang.t().lastWinner }}:
                <span
                  class="avatar"
                  [style.background]="avatarColor(r.lastWinners[0].avatar)"
                  >{{ avatarEmoji(r.lastWinners[0].avatar) }}</span
                >
                <strong>{{ r.lastWinners[0].name }}</strong>
              </p>
            } @else if (r.lastWinners.length > 1) {
              <p class="winner-banner co-winners">
                {{ lang.t().roundTieWinners }}:
                @for (w of r.lastWinners; track w.playerId) {
                  <span class="co-winner">
                    <span class="avatar" [style.background]="avatarColor(w.avatar)">{{
                      avatarEmoji(w.avatar)
                    }}</span>
                    <strong>{{ w.name }}</strong>
                  </span>
                }
              </p>
            }
            <app-leaderboard
              [title]="lang.t().leaderboard"
              [players]="players()"
            />

            <div class="rematch-hub">
              <h2>{{ lang.t().rematchSettings }}</h2>

              <div class="join-code-block">
                <p class="label">{{ lang.t().joinCode }}</p>
                <div class="code-row">
                  <h3 class="code">{{ r.code }}</h3>
                  <button type="button" class="q-btn q-btn-outline" (click)="copy()">
                    {{ copied() ? lang.t().copied : lang.t().copyCode }}
                  </button>
                </div>
              </div>

              <div class="ready-block">
                <p class="ready-label">
                  {{ lang.t().readyForRematch }} ({{ rematchReadyPlayers().length }})
                </p>
                <div class="ready-chips">
                  @for (p of rematchReadyPlayers(); track p.id) {
                    <span
                      class="chip"
                      [style.background]="avatarColor(p.avatar)"
                      [title]="p.name"
                    >
                      {{ avatarEmoji(p.avatar) }}
                    </span>
                  } @empty {
                    <span class="ready-empty">{{ lang.t().waitingPlayers }}</span>
                  }
                </div>
              </div>

              <div class="pair">
                <section class="group">
                  <label class="q-label">{{ lang.t().questionTypes }}</label>
                  <div class="tokens">
                    @for (t of questionTypes; track t) {
                      <button
                        type="button"
                        class="token cat"
                        [class.on]="selectedTypes().includes(t)"
                        [class.locked]="ent.questionTypeLocked(t)"
                        [attr.aria-pressed]="selectedTypes().includes(t)"
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
                  @if (selectedTypes().length === 0) {
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
                      [class.on]="selectedCats().includes(cat)"
                      [class.locked]="ent.categoryLocked(cat)"
                      [disabled]="!needsCategories()"
                      [attr.aria-pressed]="selectedCats().includes(cat)"
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
                @if (needsCategories() && selectedCats().length === 0) {
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

              <div class="final-actions">
                <button type="button" class="q-btn q-btn-outline" (click)="goHome()">
                  {{ lang.t().home }}
                </button>
                <button
                  type="button"
                  class="q-btn q-btn-outline start-rematch"
                  [disabled]="!rooms.hosting() || !canRematch() || rematching()"
                  (click)="rematch()"
                >
                  {{ lang.t().startRematch }}
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
              class="stage"
              [class.previewing]="imagePhase() === 'preview' || imagePhase() === 'sliding'"
            >
              @if (r.currentQuestion; as q) {
                <header class="meta">
                  <div>
                    <p class="progress">
                      {{ lang.t().question }} {{ q.index + 1 }} {{ lang.t().of }} {{ q.total }}
                    </p>
                    @if (imagePhase() !== 'preview' && imagePhase() !== 'sliding') {
                      <p class="diff">
                        @if (q.imageUrl) {
                          {{ lang.t().imageMcq }}
                        } @else {
                          {{ categoryLabel(q.category) }} · {{ difficultyLabel(q.difficulty) }}
                        }
                      </p>
                    }
                  </div>
                  @if (r.phase === 'question' && answersOpen()) {
                    <app-timer-ring
                      [endsAt]="q.endsAt"
                      [durationMs]="q.durationMs"
                      (expired)="onQuestionExpired()"
                    />
                  } @else if (r.phase === 'reveal') {
                    <span class="reveal-badge">{{ lang.t().correct }}</span>
                  }
                </header>

                <div
                  class="prompt-block"
                  [class.dimmed]="imagePhase() === 'preview' || imagePhase() === 'sliding'"
                >
                  <h1 class="prompt">{{ q.prompt }}</h1>
                </div>

                <div class="answered-row">
                  <span class="answered-label">{{ lang.t().answered }}</span>
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
                class="end q-btn q-btn-ghost"
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
    .tv {
      min-height: 100dvh;
      background: var(--q-bg);
      padding: clamp(0.75rem, 1.5vw, 1.25rem);
      position: relative;
      overflow: hidden;
    }
    .spectator-banner {
      margin: 0 0 0.75rem;
      padding: 0.75rem 1rem;
      border-radius: 14px;
      background: var(--q-chip-warm);
      border: 2px solid #fdba74;
      color: var(--q-navy);
      font-weight: 800;
      line-height: 1.35;
      position: relative;
      z-index: 5;
    }
    .layout {
      display: grid;
      grid-template-columns: minmax(280px, 32%) 1fr;
      gap: 1rem;
      height: calc(100dvh - 1.5rem);
      min-height: calc(100dvh - 1.5rem);
      align-items: stretch;
    }
    .board-col {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      height: 100%;
      min-height: 0;
    }
    .board {
      flex: 1 1 auto;
      min-height: 0;
      height: auto;
      transition:
        flex-basis 0.45s cubic-bezier(0.22, 1, 0.36, 1),
        flex-grow 0.45s cubic-bezier(0.22, 1, 0.36, 1);
    }
    .board-col.with-image .board {
      flex: 0 0 auto;
      min-height: auto;
      height: auto;
      overflow: visible;
    }
    .image-dock {
      flex: 0 0 auto;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid var(--q-border);
      border-radius: 28px;
      padding: 0.45rem;
      background: var(--q-surface);
      min-height: 0;
      max-height: 0;
      opacity: 0;
      overflow: hidden;
      pointer-events: none;
      transform: translateY(12px) scale(0.96);
      transition:
        flex 0.45s cubic-bezier(0.22, 1, 0.36, 1),
        max-height 0.45s cubic-bezier(0.22, 1, 0.36, 1),
        opacity 0.4s cubic-bezier(0.22, 1, 0.36, 1),
        transform 0.45s cubic-bezier(0.22, 1, 0.36, 1),
        box-shadow 0.35s ease,
        border-color 0.35s ease;
    }
    .image-dock.visible {
      pointer-events: auto;
      opacity: 1;
      max-height: 100%;
      transform: translateY(0) scale(1);
    }
    .board-col.with-image .image-dock {
      flex: 1 1 0;
      min-height: 0;
    }
    .image-dock.receiving {
      border-color: #94a3b8;
      box-shadow: 0 0 0 3px rgba(148, 163, 184, 0.25);
    }
    .image-dock.receiving .dock-image {
      opacity: 0;
    }
    .image-dock.seated {
      border-color: var(--q-border);
      animation: dock-settle 0.4s cubic-bezier(0.22, 1, 0.36, 1);
    }
    .image-dock.seated .dock-image {
      opacity: 1;
    }
    .dock-image {
      width: auto;
      height: auto;
      max-width: 100%;
      max-height: 100%;
      aspect-ratio: 3 / 4;
      object-fit: contain;
      object-position: center top;
      border-radius: 22px;
      display: block;
      transition: opacity 0.2s ease;
    }
    @keyframes dock-settle {
      0% {
        transform: scale(0.98);
        box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.28);
      }
      100% {
        transform: scale(1);
        box-shadow: none;
      }
    }
    .stage {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      border: 2px solid var(--q-border);
      border-radius: 28px;
      padding: clamp(1rem, 2vw, 1.75rem);
      padding-bottom: 3rem;
      height: 100%;
      min-height: 100%;
      overflow: hidden;
    }
    .stage.previewing .answered-row,
    .stage.previewing app-answer-grid {
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
      background: color-mix(in srgb, var(--q-bg) 94%, transparent);
      animation: preview-in 0.35s ease;
    }
    .image-preview-overlay.sliding {
      animation: preview-to-dock 0.45s cubic-bezier(0.22, 1, 0.36, 1) forwards;
    }
    .preview-hint {
      margin: 0;
      font-weight: 900;
      font-size: clamp(1.05rem, 1.8vw, 1.35rem);
      color: var(--q-muted);
      letter-spacing: 0.02em;
    }
    .preview-image {
      height: min(78vh, 720px);
      width: auto;
      max-width: min(100%, 540px);
      aspect-ratio: 3 / 4;
      object-fit: cover;
      object-position: center top;
      border-radius: 28px;
      background: #0f172a;
      box-shadow: 0 24px 60px rgba(15, 23, 42, 0.28);
    }
    @keyframes preview-in {
      from {
        opacity: 0;
        transform: scale(0.96);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
    @keyframes preview-to-dock {
      to {
        opacity: 0;
        transform: translate(-30vw, 22vh) scale(0.48);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .image-preview-overlay,
      .image-preview-overlay.sliding,
      .image-dock.seated {
        animation: none;
      }
      .board,
      .image-dock,
      .dock-image {
        transition: none;
      }
    }
    .meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      flex-shrink: 0;
    }
    .progress {
      margin: 0;
      font-weight: 900;
      font-size: clamp(1.1rem, 2vw, 1.4rem);
    }
    .diff {
      margin: 0.2rem 0 0;
      color: var(--q-muted);
      font-weight: 700;
      text-transform: capitalize;
    }
    .prompt-block {
      flex-shrink: 0;
      display: grid;
      gap: 0.85rem;
      padding: 0.15rem 0 0.25rem;
    }
    .prompt {
      margin: 0;
      max-width: 42ch;
      font-size: clamp(1.9rem, 4.2vw, 3.1rem);
      line-height: 1.15;
      font-weight: 900;
    }
    .answered-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.65rem;
      flex-shrink: 0;
      min-height: 2.2rem;
    }
    .answered-label {
      font-weight: 800;
      color: var(--q-muted);
      font-size: 0.9rem;
    }
    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      min-height: 2.2rem;
    }
    .chip {
      width: 2.2rem;
      height: 2.2rem;
      border-radius: 50%;
      display: grid;
      place-items: center;
      font-size: 1rem;
      box-shadow: 0 4px 10px rgba(15, 23, 42, 0.12);
      outline: 3px solid transparent;
      transition: outline-color 0.2s ease, box-shadow 0.2s ease;
    }
    .chip.correct {
      outline-color: #84cc16;
    }
    .reveal-badge {
      box-sizing: border-box;
      width: 4.5rem;
      height: 4.5rem;
      display: grid;
      place-items: center;
      text-align: center;
      font-weight: 900;
      font-size: 0.9rem;
      line-height: 1.1;
      color: var(--q-purple);
      background: var(--q-chip-purple);
      border: 3px solid var(--q-purple);
      border-radius: 50%;
      animation: fade-in 0.35s ease;
    }
    @keyframes fade-in {
      from {
        opacity: 0.5;
      }
      to {
        opacity: 1;
      }
    }
    .end {
      position: absolute;
      right: 0.75rem;
      bottom: 0.5rem;
      font-size: 0.9rem;
    }
    .final {
      max-width: 960px;
      margin: 2rem auto;
      display: grid;
      gap: 1.25rem;
    }
    .brand h1 {
      margin: 0;
      font-weight: 900;
    }
    .winner-banner {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 700;
      color: var(--q-muted);
      margin: 0;
    }
    .winner-banner .avatar {
      width: 2rem;
      height: 2rem;
      border-radius: 50%;
      display: grid;
      place-items: center;
    }
    .tie-banner {
      margin: 0;
      font-weight: 800;
      color: var(--q-purple);
    }
    .co-winners {
      flex-wrap: wrap;
    }
    .co-winner {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
    }
    .rematch-hub {
      display: grid;
      gap: 1rem;
      padding: 1.1rem 1.2rem;
      border: 2px solid var(--q-border);
      border-radius: 22px;
      background: var(--q-surface);
    }
    .rematch-hub h2 {
      margin: 0;
      font-size: 1.15rem;
      font-weight: 900;
    }
    .join-code-block .label {
      margin: 0;
      color: var(--q-muted);
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-size: 0.85rem;
    }
    .code-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      align-items: center;
    }
    .code {
      margin: 0.25rem 0 0;
      font-size: clamp(2rem, 6vw, 3.25rem);
      letter-spacing: 0.18em;
      background: var(--q-gradient);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      line-height: 1.1;
      font-weight: 900;
    }
    .ready-block {
      display: grid;
      gap: 0.45rem;
    }
    .ready-label {
      margin: 0;
      font-weight: 800;
      color: var(--q-muted);
      font-size: 0.95rem;
    }
    .ready-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      min-height: 2.2rem;
      align-items: center;
    }
    .ready-empty {
      font-weight: 700;
      color: var(--q-muted);
      font-size: 0.9rem;
    }
    .rematch-hub .group {
      background: var(--q-card);
      border: 2px solid var(--q-border);
      border-radius: 24px;
      padding: 1rem 1.1rem 1.15rem;
    }
    .rematch-hub .pair {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      align-items: stretch;
    }
    .rematch-hub .tokens {
      display: grid;
      gap: 0.85rem 0.35rem;
      justify-items: center;
    }
    .rematch-hub .tokens-cats {
      grid-template-columns: repeat(3, minmax(0, 1fr));
      padding-top: 1.75rem;
      gap: 1.15rem 0.65rem;
    }
    .rematch-hub .token.cat {
      flex-direction: row;
      align-items: center;
      gap: 0.45rem;
      text-align: left;
    }
    .rematch-hub .cat-copy {
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
    .rematch-hub .cat-copy strong {
      font-size: 0.82rem;
      font-weight: 900;
      line-height: 1.15;
      color: var(--q-navy);
    }
    .rematch-hub .cat-copy span {
      font-size: 0.72rem;
      font-weight: 700;
      line-height: 1.25;
      color: var(--q-muted);
    }
    .rematch-hub .token.locked .cat-copy,
    .rematch-hub .slot-copy.locked,
    .rematch-hub .slot-copy.empty {
      border: 2px solid var(--q-border);
      background: var(--q-card);
    }
    .rematch-hub .corner-badge {
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
    .rematch-hub .token:hover .corner-badge,
    .rematch-hub .token:focus-visible .corner-badge,
    .rematch-hub .pill:hover .corner-badge,
    .rematch-hub .pill:focus-visible .corner-badge,
    .rematch-hub .slot-reel:hover .corner-badge,
    .rematch-hub .slot-reel:has(:focus-visible) .corner-badge {
      transform: translate(8px, -12px) rotate(20deg);
    }
    .rematch-hub .pair .tokens {
      grid-template-columns: 1fr;
      padding-top: 1.75rem;
    }
    .rematch-hub .token {
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
    .rematch-hub .token.on {
      opacity: 1;
    }
    .rematch-hub .token:focus-visible,
    .rematch-hub .pill:focus-visible,
    .rematch-hub .slot-nudge:focus-visible {
      outline: 2px solid var(--q-blue);
      outline-offset: 2px;
    }
    .rematch-hub .token-icon {
      position: relative;
      width: 96px;
      height: 96px;
      border-radius: 28px;
      border: 4px solid transparent;
      display: grid;
      place-items: center;
      flex-shrink: 0;
    }
    .rematch-hub .token.on .token-icon {
      background:
        linear-gradient(var(--q-card), var(--q-card)) padding-box,
        var(--q-gradient) border-box;
      box-shadow:
        0 0 0 4px color-mix(in srgb, #7b3ff2 32%, transparent),
        0 10px 24px color-mix(in srgb, #2f7cf6 42%, transparent);
    }
    .rematch-hub .token-icon .art {
      width: 88px;
      height: 88px;
      object-fit: contain;
      display: block;
    }
    .rematch-hub .token.locked .art {
      filter: grayscale(1);
    }
    .rematch-hub .meter-head {
      display: flex;
      align-items: center;
      gap: 0.55rem;
      margin-bottom: 0.65rem;
    }
    .rematch-hub .meter-head img {
      width: 88px;
      height: 88px;
      object-fit: contain;
    }
    .rematch-hub .meter-head .q-label {
      margin: 0;
    }
    .rematch-hub .pills {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      padding-top: 2.4rem;
    }
    .rematch-hub .pill {
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
    .rematch-hub .pill.active {
      opacity: 1;
      border-color: transparent;
      color: #fff;
      background: var(--q-gradient);
    }
    .rematch-hub .pill.locked {
      opacity: 0.42;
    }
    .rematch-hub .pill .corner-badge {
      top: -58px;
      right: -4px;
    }
    .rematch-hub .hint {
      margin: 0.65rem 0 0;
      color: var(--q-muted);
      font-weight: 700;
      font-size: 0.82rem;
    }
    .rematch-hub .warn {
      color: #db2777;
    }
    .rematch-hub .round {
      position: relative;
    }
    .rematch-hub .custom-input {
      position: absolute;
      top: 0.85rem;
      right: 1rem;
      width: 5.25rem;
      margin: 0;
      padding: 0.4rem 0.55rem;
    }
    .rematch-hub .cats-disabled {
      opacity: 0.45;
    }
    .rematch-hub .cats-disabled .token {
      pointer-events: none;
    }
    .rematch-hub .power-slots {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 1rem;
      margin-top: 0.35rem;
      padding-top: 1.75rem;
    }
    .rematch-hub .slot-reel {
      position: relative;
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 0.65rem;
      flex: 1;
      min-width: 0;
    }
    .rematch-hub .slot-reel:has(.corner-badge) {
      z-index: 1;
    }
    .rematch-hub .slot-switch {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.35rem;
      flex-shrink: 0;
    }
    .rematch-hub .slot-nudge {
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
    .rematch-hub .arrow {
      display: block;
    }
    .rematch-hub .arrow.up {
      transform: rotate(90deg);
    }
    .rematch-hub .arrow.down {
      transform: rotate(-90deg);
    }
    .rematch-hub .slot-copy {
      position: relative;
      flex: 1;
      min-width: 0;
    }
    .rematch-hub .slot-reel .corner-badge {
      pointer-events: auto;
      opacity: 1;
      filter: none;
      z-index: 2;
      top: -58px;
      right: -4px;
    }
    .rematch-hub .power-slot {
      width: 88px;
      height: 88px;
      border-radius: 999px;
      border: 2px dashed var(--q-border);
      background: color-mix(in srgb, var(--q-bg) 55%, var(--q-card));
      display: grid;
      place-items: center;
      overflow: hidden;
    }
    .rematch-hub .power-slot.filled {
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
    .rematch-hub .power-slot img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .rematch-hub .power-slot.locked img {
      filter: grayscale(1);
    }
    .rematch-hub .slot-plus {
      font-size: 1.7rem;
      font-weight: 800;
      line-height: 1;
      color: var(--q-muted);
    }
    .rematch-hub .power-slot.from-up img,
    .rematch-hub .power-slot.from-up .slot-plus {
      animation: slot-from-up 0.22s ease;
    }
    .rematch-hub .power-slot.from-down img,
    .rematch-hub .power-slot.from-down .slot-plus {
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
      .rematch-hub .tokens-cats,
      .rematch-hub .pair {
        grid-template-columns: 1fr;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .rematch-hub .corner-badge {
        transition: none;
      }
      .rematch-hub .token:hover .corner-badge,
      .rematch-hub .token:focus-visible .corner-badge,
      .rematch-hub .pill:hover .corner-badge,
      .rematch-hub .pill:focus-visible .corner-badge,
      .rematch-hub .slot-reel:hover .corner-badge,
      .rematch-hub .slot-reel:has(:focus-visible) .corner-badge {
        transform: rotate(12deg);
      }
      .rematch-hub .power-slot.from-up img,
      .rematch-hub .power-slot.from-up .slot-plus,
      .rematch-hub .power-slot.from-down img,
      .rematch-hub .power-slot.from-down .slot-plus {
        animation: none;
      }
    }
    .final-actions {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .start-rematch {
      border-color: var(--q-lime);
    }
    .start-rematch:disabled {
      opacity: 0.55;
    }
    .waiting {
      font-weight: 800;
      color: var(--q-muted);
      padding: 2rem;
    }
    @media (max-width: 960px) {
      .layout {
        grid-template-columns: 1fr;
        height: auto;
        min-height: calc(100dvh - 1.5rem);
      }
      .board-col {
        height: auto;
      }
      .board {
        height: auto;
      }
      .board-col.with-image .board {
        flex: 0 0 auto;
      }
      .board-col.with-image .image-dock {
        flex: 0 0 auto;
        min-height: min(50vh, 420px);
      }
      .preview-image {
        height: min(68vh, 560px);
        max-width: min(100%, 420px);
      }
      .stage {
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
  readonly avatarColor = avatarColor;
  readonly avatarEmoji = avatarEmoji;
  readonly answeredStrip = viewChild<ElementRef<HTMLElement>>('answeredStrip');
  readonly tvRoot = viewChild<ElementRef<HTMLElement>>('tvRoot');

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
  readonly fiftyFiftyIcon = POWER_UP_CATALOG[0].icon;
  readonly slotSlide = signal<{ index: number; dir: 1 | -1 } | null>(null);
  readonly isQuestionTypeFree = isQuestionTypeFree;
  readonly isPowerUpFree = isPowerUpFree;
  readonly isRoundLengthFree = isRoundLengthFree;
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
  private configSynced = false;

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
    // The finished round may have been configured while Pro was active, so the
    // rematch form has to be re-clamped once the entitlement resolves.
    effect(() => {
      const pro = this.ent.isPro();
      if (!pro) untracked(() => this.dropLockedSelections());
    });
    effect(() => {
      const r = this.room();
      if (!r || r.code !== this.code) return;

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
        const bucket = r.answers[String(r.currentIndex)] ?? {};
        const answered = Object.values(bucket).filter(
          (a) => a.answeredAt >= opensAt,
        ).length;
        if (answered >= playerCount) {
          void this.onQuestionExpired();
        }
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
    // Implicit teardown (back nav, tab close) must NOT delete the room — a real
    // tab close arms the host onDisconnect marker; expired/abandoned rooms are
    // reaped lazily + by the sweep. Explicit exit uses goHome().
    this.clearImageTimers();
    this.rooms.stopWatching();
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
        font-weight: 900;
        font-size: 1.25rem;
        color: #65a30d;
        pointer-events: none;
        text-shadow: 0 2px 8px rgba(255,255,255,0.9);
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
