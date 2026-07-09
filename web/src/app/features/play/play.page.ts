import {
  Component,
  computed,
  effect,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { GameRoomService } from '../../core/game-room.service';
import { LanguageService } from '../../core/language.service';
import type { RoomPlayer } from '../../core/room.models';
import { AnswerGrid } from '../../shared/answer-grid';
import { Leaderboard } from '../../shared/leaderboard';
import { TimerRing } from '../../shared/timer-ring';

@Component({
  selector: 'app-play',
  imports: [FormsModule, RouterLink, AnswerGrid, Leaderboard, TimerRing],
  template: `
    <div class="q-page play">
      @if (room(); as r) {
        @if (r.phase === 'finished') {
          <section class="final q-card">
            <h1>{{ lang.t().finalLeaderboard }}</h1>
            <app-leaderboard
              [title]="lang.t().leaderboard"
              [players]="players()"
            />
            <div class="final-actions">
              <a routerLink="/" class="q-btn q-btn-primary">{{ lang.t().home }}</a>
              <a routerLink="/create" class="q-btn q-btn-secondary">{{ lang.t().playAgain }}</a>
            </div>
          </section>
        } @else if (r.currentQuestion; as q) {
          <div class="layout">
            <section class="stage">
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
                    (expired)="onExpired()"
                  />
                } @else {
                  <span class="reveal-badge">{{ lang.t().reveal }}</span>
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

              <div class="host-bar">
                @if (r.phase === 'question') {
                  <button type="button" class="q-btn q-btn-secondary" (click)="reveal()">
                    {{ lang.t().reveal }}
                  </button>
                }
                @if (r.phase === 'reveal') {
                  <button type="button" class="q-btn q-btn-primary" (click)="next()">
                    {{ lang.t().next }}
                  </button>
                }
                <button type="button" class="q-btn q-btn-ghost" (click)="end()">
                  {{ lang.t().endGame }}
                </button>
              </div>

              <div class="test-pad q-card">
                <div class="pad-top">
                  <label class="q-label">{{ lang.t().answerAs }}</label>
                  <select class="q-select" [(ngModel)]="selectedPlayerId">
                    <option value="">{{ lang.t().selectPlayer }}</option>
                    @for (p of players(); track p.id) {
                      <option [value]="p.id">{{ p.name }}</option>
                    }
                  </select>
                  <label class="bots">
                    <input type="checkbox" [(ngModel)]="autoBots" (ngModelChange)="maybeRunBots()" />
                    {{ lang.t().autoBots }}
                  </label>
                </div>
                <app-answer-grid
                  [options]="q.options"
                  [disabled]="r.phase !== 'question' || !selectedPlayerId"
                  (pick)="answer($event)"
                />
              </div>
            </section>

            <app-leaderboard
              [title]="lang.t().leaderboard"
              [players]="players()"
              [deltas]="r.lastScoreDeltas"
            />
          </div>
        } @else {
          <p class="q-card">{{ lang.t().waitingPlayers }}</p>
        }
      } @else {
        <p class="q-card">{{ lang.t().roomNotFound }}</p>
      }
    </div>
  `,
  styles: `
    .layout {
      display: grid;
      grid-template-columns: 1fr 260px;
      gap: 1.25rem;
      align-items: start;
    }
    .stage {
      display: grid;
      gap: 1rem;
    }
    .meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
    }
    .progress {
      margin: 0;
      font-weight: 800;
      font-size: 1.1rem;
    }
    .diff {
      margin: 0.2rem 0 0;
      color: var(--q-muted);
      font-weight: 700;
    }
    .prompt {
      margin: 0;
      font-size: clamp(1.5rem, 3.5vw, 2.4rem);
      line-height: 1.2;
    }
    .q-image {
      width: min(100%, 520px);
      max-height: 240px;
      object-fit: contain;
      border-radius: 18px;
      background: #0f172a;
      justify-self: start;
    }
    .host-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 0.65rem;
    }
    .test-pad {
      margin-top: 0.5rem;
      display: grid;
      gap: 0.85rem;
      border-style: dashed;
    }
    .pad-top {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      align-items: end;
    }
    .pad-top .q-select {
      max-width: 16rem;
    }
    .bots {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-weight: 700;
      color: var(--q-muted);
    }
    .reveal-badge {
      font-weight: 800;
      color: var(--q-purple);
      background: #f5f3ff;
      padding: 0.55rem 0.9rem;
      border-radius: 999px;
    }
    .final {
      max-width: 520px;
      margin: 2rem auto;
      display: grid;
      gap: 1rem;
    }
    .final-actions {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
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

  readonly room = this.rooms.room;
  selectedPlayerId = '';
  autoBots = false;

  private code = '';
  private revealing = false;
  private botsStartedFor = -1;

  readonly players = computed<RoomPlayer[]>(() =>
    Object.values(this.room()?.players ?? {}),
  );

  constructor() {
    effect(() => {
      const r = this.room();
      if (r?.phase === 'question' && this.autoBots && r.currentIndex !== this.botsStartedFor) {
        this.botsStartedFor = r.currentIndex;
        void this.rooms.runBots(this.code);
      }
    });
  }

  ngOnInit(): void {
    this.code = this.route.snapshot.paramMap.get('code') ?? '';
    void this.rooms.watchRoom(this.code);
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

  async onExpired(): Promise<void> {
    if (this.room()?.phase === 'question') {
      await this.reveal();
    }
  }

  async reveal(): Promise<void> {
    if (this.revealing || this.room()?.phase !== 'question') return;
    this.revealing = true;
    try {
      await this.rooms.reveal(this.code);
    } finally {
      this.revealing = false;
    }
  }

  async next(): Promise<void> {
    await this.rooms.nextQuestion(this.code);
  }

  async end(): Promise<void> {
    await this.rooms.endGame(this.code);
  }

  async answer(choice: number): Promise<void> {
    if (!this.selectedPlayerId) return;
    await this.rooms.submitAnswer(this.code, this.selectedPlayerId, choice);
  }

  maybeRunBots(): void {
    const r = this.room();
    if (this.autoBots && r?.phase === 'question') {
      this.botsStartedFor = r.currentIndex;
      void this.rooms.runBots(this.code);
    }
  }
}
