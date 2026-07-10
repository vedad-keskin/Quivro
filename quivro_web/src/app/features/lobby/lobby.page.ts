import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { GameRoomService } from '../../core/game-room.service';
import { LanguageService } from '../../core/language.service';
import { avatarColor, avatarEmoji } from '../../core/room.models';
import { SnackbarService } from '../../core/snackbar.service';
import { LangToggle } from '../../shared/lang-toggle';

@Component({
  selector: 'app-lobby',
  imports: [RouterLink, LangToggle],
  template: `
    <div class="q-page lobby">
      <header class="top">
        <a routerLink="/" class="q-btn q-btn-ghost">← {{ lang.t().home }}</a>
        <app-lang-toggle />
      </header>

      @if (room(); as r) {
        <div class="layout">
          <section class="main">
            <p class="label">{{ lang.t().joinCode }}</p>
            <div class="code-row">
              <h1 class="code">{{ r.code }}</h1>
              <button type="button" class="q-btn q-btn-outline" (click)="copy()">
                {{ copied() ? lang.t().copied : lang.t().copyCode }}
              </button>
            </div>

            <p class="waiting">{{ lang.t().waitingPlayers }}</p>

            <button
              type="button"
              class="q-btn q-btn-outline start"
              [disabled]="playerList().length === 0 || starting()"
              (click)="start()"
            >
              {{ lang.t().start }}
            </button>
          </section>

          <aside class="side">
            <h2>{{ lang.t().players }} ({{ playerList().length }})</h2>
            <ul>
              @for (p of playerList(); track p.id) {
                <li>
                  <span class="avatar" [style.background]="avatarColor(p.avatar)">{{
                    avatarEmoji(p.avatar)
                  }}</span>
                  {{ p.name }}
                </li>
              } @empty {
                <li class="empty">{{ lang.t().noPlayersYet }}</li>
              }
            </ul>
          </aside>
        </div>
      } @else {
        <p class="empty-card">{{ lang.t().roomNotFound }}</p>
      }
    </div>
  `,
  styles: `
    .top {
      display: flex;
      justify-content: space-between;
      margin-bottom: 1.5rem;
    }
    .layout {
      display: grid;
      grid-template-columns: 1.5fr 0.85fr;
      gap: 1.5rem;
      align-items: start;
      max-width: 1100px;
      margin: 0 auto;
    }
    .mark {
      width: 56px;
      height: 56px;
      border-radius: 14px;
      margin-bottom: 0.75rem;
      box-shadow: 0 8px 20px rgba(47, 124, 246, 0.2);
    }
    .main,
    .side {
      border: 2px solid var(--q-border);
      border-radius: 24px;
      padding: 1.5rem;
      background: #fff;
    }
    .label {
      margin: 0;
      color: var(--q-muted);
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-size: 0.85rem;
    }
    .code {
      margin: 0.35rem 0 0;
      font-size: clamp(3rem, 10vw, 5.5rem);
      letter-spacing: 0.18em;
      background: var(--q-gradient);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      line-height: 1.1;
      font-weight: 900;
    }
    .code-row {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      align-items: center;
      margin-bottom: 1rem;
    }
    .waiting {
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--q-muted);
    }
    .start {
      margin-top: 1.25rem;
      min-width: 10rem;
    }
    .side h2 {
      margin: 0 0 0.85rem;
      font-weight: 900;
    }
    ul {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 0.55rem;
    }
    li {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      font-weight: 800;
      padding: 0.55rem 0.4rem;
      border-radius: 14px;
      background: var(--q-surface);
    }
    .avatar {
      width: 2rem;
      height: 2rem;
      border-radius: 50%;
      display: grid;
      place-items: center;
      font-size: 1rem;
      flex-shrink: 0;
    }
    .empty {
      color: var(--q-muted);
      background: transparent;
      font-weight: 700;
    }
    .empty-card {
      max-width: 480px;
      margin: 2rem auto;
      padding: 1.25rem;
      border: 2px solid var(--q-border);
      border-radius: 20px;
      font-weight: 700;
    }
    @media (max-width: 860px) {
      .layout {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class LobbyPage implements OnInit {
  readonly lang = inject(LanguageService);
  readonly rooms = inject(GameRoomService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snack = inject(SnackbarService);

  readonly room = this.rooms.room;
  readonly copied = signal(false);
  readonly starting = signal(false);
  readonly avatarColor = avatarColor;
  readonly avatarEmoji = avatarEmoji;

  readonly playerList = computed(() =>
    Object.values(this.room()?.players ?? {}).sort((a, b) => a.joinedAt - b.joinedAt),
  );

  private code = '';

  ngOnInit(): void {
    this.code = this.route.snapshot.paramMap.get('code') ?? '';
    void this.rooms.watchRoom(this.code).catch(() => {
      this.rooms.room.set(null);
    });
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

  async start(): Promise<void> {
    if (this.playerList().length === 0) {
      this.snack.error(this.lang.t().minPlayers);
      return;
    }
    this.starting.set(true);
    try {
      await this.rooms.startGame(this.code);
      await this.router.navigate(['/play', this.code]);
    } catch (e) {
      console.error(e);
      if (e instanceof Error && e.message === 'NO_PLAYERS') {
        this.snack.error(this.lang.t().minPlayers);
      } else if (e instanceof Error && e.message === 'FIREBASE_REQUIRED') {
        this.snack.error(this.lang.t().firebaseMissing);
      } else if (e instanceof Error && e.message === 'NO_QUESTIONS') {
        this.snack.error(this.lang.t().noQuestions);
      } else {
        this.snack.error(this.lang.t().startFailed);
      }
    } finally {
      this.starting.set(false);
    }
  }
}
