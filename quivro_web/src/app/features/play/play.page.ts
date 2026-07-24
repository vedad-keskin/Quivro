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
import { GameRoomService } from '../../core/game-room.service';
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
  IMAGE_SLIDE_MS,
  type RoomConfig,
  type RoomPlayer,
  type ScoringMode,
} from '../../core/room.models';
import { ServerTimeService } from '../../core/server-time.service';
import { SnackbarService } from '../../core/snackbar.service';
import { AnswerGrid } from '../../shared/answer-grid';
import { Leaderboard } from '../../shared/leaderboard';
import { TimerRing } from '../../shared/timer-ring';

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

              <section [class.cats-disabled]="!needsCategories()">
                <label class="q-label">{{ lang.t().categories }}</label>
                <div class="setting-chips">
                  @for (cat of categories; track cat) {
                    <button
                      type="button"
                      class="q-chip"
                      [class.active]="selectedCats().includes(cat)"
                      [disabled]="!needsCategories()"
                      (click)="toggleCategory(cat)"
                    >
                      {{ categoryLabel(cat) }}
                    </button>
                  }
                </div>
              </section>

              <section>
                <label class="q-label">{{ lang.t().questionTypes }}</label>
                <div class="setting-chips">
                  @for (t of questionTypes; track t) {
                    <button
                      type="button"
                      class="q-chip"
                      [class.active]="selectedTypes().includes(t)"
                      (click)="toggleType(t)"
                    >
                      {{ typeLabel(t) }}
                    </button>
                  }
                </div>
              </section>

              <section>
                <label class="q-label">{{ lang.t().scoringMode }}</label>
                <div class="setting-chips">
                  <button
                    type="button"
                    class="q-chip"
                    [class.active]="scoringMode() === 'standard'"
                    (click)="scoringMode.set('standard')"
                  >
                    {{ lang.t().scoringStandard }}
                  </button>
                  <button
                    type="button"
                    class="q-chip"
                    [class.active]="scoringMode() === 'timed'"
                    (click)="scoringMode.set('timed')"
                  >
                    {{ lang.t().scoringTimed }}
                  </button>
                </div>
              </section>

              <section>
                <label class="q-label">{{ lang.t().questionTime }}</label>
                <div class="setting-chips">
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
                <div class="setting-chips">
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
      max-width: 640px;
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
    .setting-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.35rem;
    }
    .hint {
      margin: 0.65rem 0 0;
      color: var(--q-muted);
      font-weight: 700;
    }
    .hint.warn {
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
  `,
})
export class PlayPage implements OnInit, OnDestroy {
  readonly lang = inject(LanguageService);
  readonly rooms = inject(GameRoomService);
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
  private readonly onPageHide = () => {
    void this.rooms.leaveHostedRoom(this.code);
  };

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
        this.knownRematchReady = new Set(
          Object.keys(r.rematchReady ?? {}).filter((id) => r.rematchReady[id]),
        );
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
    window.addEventListener('pagehide', this.onPageHide);
  }

  ngOnDestroy(): void {
    window.removeEventListener('pagehide', this.onPageHide);
    this.clearImageTimers();
    void this.rooms.leaveHostedRoom(this.code);
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

  difficultyLabel(diff: string): string {
    const key = diff as 'easy' | 'medium' | 'hard';
    return this.lang.t()[key] ?? diff;
  }

  typeLabel(t: QuestionType): string {
    return t === 'mcq' ? this.lang.t().mcq : this.lang.t().imageMcq;
  }

  pickPreset(n: number): void {
    this.customMode.set(false);
    this.length.set(n);
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
    const cur = this.selectedCats();
    const next = cur.includes(cat)
      ? cur.filter((c) => c !== cat)
      : [...cur, cat];
    this.selectedCats.set(next);
    if (next.length > 0) this.categoryMemory.set([...next]);
  }

  toggleType(t: QuestionType): void {
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
        this.selectedCats.set(mem.length > 0 ? [...mem] : [...CATEGORIES]);
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
      };
      // Reset local reveal/fly guards for the new round.
      this.lastHandledReveal = -1;
      this.lastFlyReveal = -1;
      this.revealedForIndex = -1;
      if (this.revealTimeoutId != null) {
        clearTimeout(this.revealTimeoutId);
        this.revealTimeoutId = null;
      }
      this.configSynced = false;
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
