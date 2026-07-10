import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { interval } from 'rxjs';
import { REVEAL_MS } from '../../../data/questions/types';
import { GameRoomService } from '../../core/game-room.service';
import { LanguageService } from '../../core/language.service';
import type { RoomPlayer } from '../../core/room.models';
import { AnswerGrid } from '../../shared/answer-grid';
import { Leaderboard } from '../../shared/leaderboard';
import { TimerRing } from '../../shared/timer-ring';

@Component({
  selector: 'app-play',
  imports: [RouterLink, AnswerGrid, Leaderboard, TimerRing],
  template: `
    <div class="tv">
      @if (room(); as r) {
        @if (r.phase === 'finished') {
          <section class="final">
            <div class="brand">
              <h1>{{ lang.t().finalLeaderboard }}</h1>
              <div class="q-brand-line"></div>
            </div>
            <app-leaderboard
              [title]="lang.t().leaderboard"
              [players]="players()"
            />
            <div class="final-actions">
              <a routerLink="/" class="q-btn q-btn-outline">{{ lang.t().home }}</a>
              <a routerLink="/create" class="q-btn q-btn-outline">{{ lang.t().playAgain }}</a>
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
              @if (r.phase === 'prepare') {
                <div class="prepare">
                  <p class="progress">
                    {{ lang.t().question }} {{ Math.max(r.currentIndex, 0) + 1 }}
                    {{ lang.t().of }} {{ r.totalQuestions }}
                  </p>
                  <h1>{{ lang.t().getReady }}</h1>
                  <p class="sub">{{ lang.t().preparing }}</p>
                  <div class="big-count">{{ prepareSecs() }}</div>
                </div>
              } @else if (r.currentQuestion; as q) {
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
                  } @else {
                    <span class="reveal-badge">{{ lang.t().correct }}</span>
                  }
                </header>

                <h1 class="prompt">{{ q.prompt }}</h1>

                @if (q.imageUrl) {
                  <img class="q-image" [src]="q.imageUrl" alt="" />
                }

                <app-answer-grid
                  [options]="q.options"
                  [revealed]="r.phase === 'reveal'"
                  [correctIndex]="r.correctIndex"
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
    }
    .layout {
      display: grid;
      grid-template-columns: minmax(240px, 28%) 1fr;
      gap: 1rem;
      min-height: calc(100dvh - 1.5rem);
      align-items: stretch;
    }
    .board {
      height: 100%;
    }
    .stage {
      position: relative;
      display: grid;
      align-content: start;
      gap: 1rem;
      border: 2px solid var(--q-border);
      border-radius: 28px;
      padding: clamp(1rem, 2vw, 1.75rem);
      min-height: 100%;
    }
    .meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
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
    .prompt {
      margin: 0;
      font-size: clamp(1.7rem, 3.8vw, 2.8rem);
      line-height: 1.15;
      font-weight: 900;
    }
    .q-image {
      width: min(100%, 560px);
      max-height: 260px;
      object-fit: contain;
      border-radius: 20px;
      background: #0f172a;
    }
    .reveal-badge {
      font-weight: 900;
      color: var(--q-purple);
      background: #f5f3ff;
      padding: 0.55rem 0.9rem;
      border-radius: 999px;
    }
    .prepare {
      min-height: 60vh;
      display: grid;
      place-content: center;
      justify-items: center;
      text-align: center;
      gap: 0.5rem;
    }
    .prepare h1 {
      margin: 0;
      font-size: clamp(2.4rem, 6vw, 4rem);
      font-weight: 900;
    }
    .sub {
      margin: 0;
      color: var(--q-muted);
      font-weight: 700;
      font-size: 1.2rem;
    }
    .big-count {
      margin-top: 0.75rem;
      width: 7rem;
      height: 7rem;
      border-radius: 50%;
      display: grid;
      place-items: center;
      font-size: 3rem;
      font-weight: 900;
      color: var(--q-blue);
      border: 4px solid var(--q-blue);
      background: #e0f2fe;
    }
    .end {
      position: absolute;
      right: 0.75rem;
      bottom: 0.5rem;
      font-size: 0.9rem;
    }
    .final {
      max-width: 560px;
      margin: 3rem auto;
      display: grid;
      gap: 1.25rem;
    }
    .brand h1 {
      margin: 0;
      font-weight: 900;
    }
    .final-actions {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .waiting {
      font-weight: 800;
      color: var(--q-muted);
      padding: 2rem;
    }
    @media (max-width: 960px) {
      .layout {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class PlayPage implements OnInit, OnDestroy {
  readonly lang = inject(LanguageService);
  readonly rooms = inject(GameRoomService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly room = this.rooms.room;
  readonly Math = Math;
  readonly prepareSecs = signal(5);

  private code = '';
  private revealing = false;
  private advancing = false;
  private lastHandledPrepare = -1;
  private lastHandledReveal = -1;

  readonly players = computed<RoomPlayer[]>(() =>
    Object.values(this.room()?.players ?? {}),
  );

  constructor() {
    effect(() => {
      const r = this.room();
      if (!r || r.code !== this.code) return;

      if (r.phase === 'reveal' && this.lastHandledReveal !== r.currentIndex) {
        this.lastHandledReveal = r.currentIndex;
        window.setTimeout(() => {
          void this.advanceFromReveal();
        }, REVEAL_MS);
      }
    });

    interval(200)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const r = this.room();
        if (r?.phase === 'prepare' && r.prepareEndsAt) {
          const left = Math.max(0, Math.ceil((r.prepareEndsAt - Date.now()) / 1000));
          this.prepareSecs.set(left);
          if (left <= 0 && this.lastHandledPrepare !== r.currentIndex && !this.advancing) {
            this.lastHandledPrepare = r.currentIndex;
            void this.advanceFromPrepare();
          }
        }
      });
  }

  ngOnInit(): void {
    this.code = this.route.snapshot.paramMap.get('code') ?? '';
    void this.rooms.watchRoom(this.code).catch(() => {
      this.rooms.room.set(null);
    });
  }

  ngOnDestroy(): void {
    this.rooms.stopWatching();
  }

  categoryLabel(cat: string): string {
    const key = cat as 'geography' | 'biology' | 'gaming' | 'history';
    return this.lang.t()[key] ?? cat;
  }

  difficultyLabel(diff: string): string {
    const key = diff as 'easy' | 'medium' | 'hard';
    return this.lang.t()[key] ?? diff;
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

  private async advanceFromPrepare(): Promise<void> {
    if (this.advancing) return;
    this.advancing = true;
    try {
      await this.rooms.startPreparedQuestion(this.code);
    } finally {
      this.advancing = false;
    }
  }

  private async advanceFromReveal(): Promise<void> {
    if (this.room()?.phase !== 'reveal') return;
    await this.rooms.nextAfterReveal(this.code);
  }

  async end(): Promise<void> {
    await this.rooms.endGame(this.code);
  }
}
