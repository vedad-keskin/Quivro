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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { interval } from 'rxjs';
import {
  CATEGORIES,
  QUESTION_SECONDS_PRESETS,
  QUESTION_TYPES,
  REVEAL_MS,
  ROUND_LENGTH_PRESETS,
  type CategoryId,
  type QuestionType,
} from '../../../data/questions/types';
import { GameRoomService } from '../../core/game-room.service';
import { LanguageService } from '../../core/language.service';
import { normalizeRoundLength } from '../../core/round-generator.service';
import {
  avatarColor,
  avatarEmoji,
  clampQuestionSeconds,
  type RoomConfig,
  type RoomPlayer,
  type ScoringMode,
} from '../../core/room.models';
import { SnackbarService } from '../../core/snackbar.service';
import { AnswerGrid } from '../../shared/answer-grid';
import { Leaderboard } from '../../shared/leaderboard';
import { TimerRing } from '../../shared/timer-ring';

@Component({
  selector: 'app-play',
  imports: [AnswerGrid, Leaderboard, TimerRing],
  template: `
    <div class="tv" #tvRoot>
      @if (room(); as r) {
        @if (r.phase === 'finished') {
          <section class="final">
            <div class="brand">
              <h1>{{ lang.t().finalLeaderboard }}</h1>
              <div class="q-brand-line"></div>
            </div>
            @if (r.lastWinner; as w) {
              <p class="winner-banner">
                {{ lang.t().lastWinner }}:
                <span class="avatar" [style.background]="avatarColor(w.avatar)">{{
                  avatarEmoji(w.avatar)
                }}</span>
                <strong>{{ w.name }}</strong>
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

              <section>
                <label class="q-label">{{ lang.t().categories }}</label>
                <div class="setting-chips">
                  @for (cat of categories; track cat) {
                    <button
                      type="button"
                      class="q-chip"
                      [class.active]="selectedCats().includes(cat)"
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
                      [class.active]="roundLength() === n"
                      (click)="roundLength.set(n)"
                    >
                      {{ n }}
                    </button>
                  }
                </div>
              </section>

              <div class="final-actions">
                <button type="button" class="q-btn q-btn-outline" (click)="goHome()">
                  {{ lang.t().home }}
                </button>
                <button
                  type="button"
                  class="q-btn q-btn-outline start-rematch"
                  [disabled]="!canRematch() || rematching()"
                  (click)="rematch()"
                >
                  {{ lang.t().startRematch }}
                </button>
              </div>
            </div>
          </section>
        } @else {
          <div class="layout">
            <app-leaderboard
              class="board"
              [title]="lang.t().leaderboard"
              [players]="players()"
              [deltas]="r.lastScoreDeltas"
            />

            <section class="stage">
              @if (r.currentQuestion; as q) {
                <header class="meta">
                  <div>
                    <p class="progress">
                      {{ lang.t().question }} {{ q.index + 1 }} {{ lang.t().of }} {{ q.total }}
                    </p>
                    <p class="diff">
                      {{ categoryLabel(q.category) }} · {{ difficultyLabel(q.difficulty) }}
                    </p>
                  </div>
                  @if (r.phase === 'question') {
                    <app-timer-ring
                      [endsAt]="q.endsAt"
                      [durationMs]="q.durationMs"
                      (expired)="onQuestionExpired()"
                    />
                  } @else if (r.phase === 'reveal') {
                    <span class="reveal-badge">{{ lang.t().correct }}</span>
                  }
                </header>

                <div class="prompt-block">
                  <h1 class="prompt">{{ q.prompt }}</h1>
                  @if (q.imageUrl) {
                    <img class="q-image" [src]="q.imageUrl" alt="" />
                  }
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
              } @else {
                <p class="waiting">{{ lang.t().waitingPlayers }}</p>
              }

              <button type="button" class="end q-btn q-btn-ghost" (click)="end()">
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
      background: #fff;
      padding: clamp(0.75rem, 1.5vw, 1.25rem);
      position: relative;
      overflow: hidden;
    }
    .layout {
      display: grid;
      grid-template-columns: minmax(240px, 28%) 1fr;
      gap: 1rem;
      height: calc(100dvh - 1.5rem);
      min-height: calc(100dvh - 1.5rem);
      align-items: stretch;
    }
    .board {
      height: 100%;
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
    .q-image {
      width: min(100%, 560px);
      max-height: 220px;
      object-fit: contain;
      border-radius: 20px;
      background: #0f172a;
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
      background: #f5f3ff;
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
    .rematch-hub {
      display: grid;
      gap: 1rem;
      padding: 1.1rem 1.2rem;
      border: 2px solid var(--q-border);
      border-radius: 22px;
      background: #f8fafc;
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
      .board {
        height: auto;
      }
      .stage {
        height: auto;
        min-height: min(72dvh, 720px);
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

  readonly room = this.rooms.room;
  readonly avatarColor = avatarColor;
  readonly avatarEmoji = avatarEmoji;
  readonly answeredStrip = viewChild<ElementRef<HTMLElement>>('answeredStrip');
  readonly tvRoot = viewChild<ElementRef<HTMLElement>>('tvRoot');

  readonly categories = CATEGORIES;
  readonly questionTypes = QUESTION_TYPES;
  readonly presets = ROUND_LENGTH_PRESETS;
  readonly timerPresets = QUESTION_SECONDS_PRESETS;
  readonly selectedCats = signal<CategoryId[]>([...CATEGORIES]);
  readonly selectedTypes = signal<QuestionType[]>([...QUESTION_TYPES]);
  readonly roundLength = signal(10);
  readonly scoringMode = signal<ScoringMode>('timed');
  readonly questionSeconds = signal(15);
  readonly rematching = signal(false);
  readonly copied = signal(false);
  private configSynced = false;

  private code = '';
  private revealing = false;
  private lastHandledReveal = -1;
  private lastFlyReveal = -1;
  private knownRematchReady = new Set<string>();
  private readonly onPageHide = () => {
    void this.rooms.leaveHostedRoom(this.code);
  };

  readonly players = computed<RoomPlayer[]>(() =>
    Object.values(this.room()?.players ?? {}),
  );

  readonly answeredPlayers = computed(() => {
    const r = this.room();
    if (!r || r.currentIndex < 0) return [] as RoomPlayer[];
    const bucket = r.answers[String(r.currentIndex)] ?? {};
    return Object.keys(bucket)
      .map((id) => r.players[id])
      .filter((p): p is RoomPlayer => !!p);
  });

  readonly choicesByIndex = computed(() => {
    const r = this.room();
    const out: Record<number, RoomPlayer[]> = { 0: [], 1: [], 2: [], 3: [] };
    if (!r || r.currentIndex < 0) return out;
    const bucket = r.answers[String(r.currentIndex)] ?? {};
    for (const [playerId, ans] of Object.entries(bucket)) {
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

  readonly canRematch = computed(
    () =>
      this.selectedCats().length > 0 &&
      this.selectedTypes().length > 0 &&
      this.rematchReadyPlayers().length > 0,
  );

  constructor() {
    effect(() => {
      const r = this.room();
      if (!r || r.code !== this.code) return;

      if (r.phase === 'finished' && !this.configSynced) {
        this.configSynced = true;
        this.selectedCats.set([...r.config.categories]);
        this.selectedTypes.set([...r.config.questionTypes]);
        this.roundLength.set(normalizeRoundLength(r.config.roundLength));
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

      if (r.phase === 'reveal' && this.lastHandledReveal !== r.currentIndex) {
        this.lastHandledReveal = r.currentIndex;
        if (this.lastFlyReveal !== r.currentIndex) {
          this.lastFlyReveal = r.currentIndex;
          this.playCorrectSfx();
          queueMicrotask(() => this.flyScores(r.lastScoreDeltas ?? {}));
        }
        window.setTimeout(() => {
          void this.advanceFromReveal();
        }, REVEAL_MS);
      }
    });

    interval(250)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const r = this.room();
        if (r?.phase !== 'question' || this.revealing) return;
        const playerCount = Object.keys(r.players).length;
        if (playerCount === 0) return;
        const answered = Object.keys(r.answers[String(r.currentIndex)] ?? {}).length;
        if (answered >= playerCount) {
          void this.onQuestionExpired();
        }
      });
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

  toggleCategory(cat: CategoryId): void {
    const cur = this.selectedCats();
    this.selectedCats.set(
      cur.includes(cat) ? cur.filter((c) => c !== cat) : [...cur, cat],
    );
  }

  toggleType(t: QuestionType): void {
    const cur = this.selectedTypes();
    this.selectedTypes.set(
      cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t],
    );
  }

  async onQuestionExpired(): Promise<void> {
    if (this.revealing || this.room()?.phase !== 'question') return;
    this.revealing = true;
    try {
      await this.rooms.reveal(this.code);
    } finally {
      this.revealing = false;
    }
  }

  private async advanceFromReveal(): Promise<void> {
    if (this.room()?.phase !== 'reveal') return;
    await this.rooms.nextAfterReveal(this.code);
  }

  async end(): Promise<void> {
    await this.rooms.endGame(this.code);
  }

  async rematch(): Promise<void> {
    if (!this.canRematch() || this.rematching()) return;
    this.rematching.set(true);
    try {
      const room = this.room();
      const nextConfig: RoomConfig = {
        categories: this.selectedCats(),
        questionTypes: this.selectedTypes(),
        roundLength: normalizeRoundLength(this.roundLength()),
        language: room?.config.language ?? this.lang.lang(),
        scoringMode: this.scoringMode(),
        questionSeconds: clampQuestionSeconds(this.questionSeconds()),
      };
      // Reset local reveal/fly guards for the new round.
      this.lastHandledReveal = -1;
      this.lastFlyReveal = -1;
      this.revealing = false;
      this.configSynced = false;
      await this.rooms.rematch(this.code, nextConfig);
    } catch (e) {
      console.error(e);
      let msg = this.lang.t().startFailed;
      if (e instanceof Error) {
        if (e.message === 'NO_QUESTIONS') msg = this.lang.t().noQuestions;
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
