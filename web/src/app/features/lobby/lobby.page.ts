import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { GameRoomService } from '../../core/game-room.service';
import { LanguageService } from '../../core/language.service';
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
          <section class="q-card main">
            <p class="label">{{ lang.t().joinCode }}</p>
            <div class="code-row">
              <h1 class="code">{{ r.code }}</h1>
              <button type="button" class="q-btn q-btn-secondary" (click)="copy()">
                {{ copied() ? lang.t().copied : lang.t().copyCode }}
              </button>
            </div>

            @if (rooms.usingLocalFallback()) {
              <p class="badge">{{ lang.t().localRoom }}</p>
            }

            <p class="waiting">{{ lang.t().waitingPlayers }}</p>

            <div class="actions">
              <button type="button" class="q-btn q-btn-secondary" (click)="addTests()">
                {{ lang.t().addTestPlayers }}
              </button>
              <button
                type="button"
                class="q-btn q-btn-primary"
                [disabled]="playerList().length === 0 || starting()"
                (click)="start()"
              >
                {{ lang.t().start }}
              </button>
            </div>
          </section>

          <aside class="q-card side">
            <h2>{{ lang.t().players }} ({{ playerList().length }})</h2>
            <ul>
              @for (p of playerList(); track p.id) {
                <li>
                  <span class="dot" [style.background]="p.color"></span>
                  {{ p.name }}
                  @if (p.isBot) {
                    <span class="bot">bot</span>
                  }
                </li>
              } @empty {
                <li class="empty">{{ lang.t().noPlayersYet }}</li>
              }
            </ul>
          </aside>
        </div>
      } @else {
        <p class="q-card">{{ lang.t().roomNotFound }}</p>
      }
    </div>
  `,
  styles: `
    .top {
      display: flex;
      justify-content: space-between;
      margin-bottom: 1.25rem;
    }
    .layout {
      display: grid;
      grid-template-columns: 1.4fr 0.8fr;
      gap: 1.25rem;
      align-items: start;
    }
    .label {
      margin: 0;
      color: var(--q-muted);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
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
    }
    .code-row {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      align-items: center;
      margin-bottom: 1rem;
    }
    .waiting {
      font-size: 1.2rem;
      font-weight: 700;
      color: var(--q-muted);
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-top: 1.5rem;
    }
    .badge {
      display: inline-block;
      padding: 0.35rem 0.75rem;
      border-radius: 999px;
      background: #fff7ed;
      color: #c2410c;
      font-weight: 700;
      font-size: 0.9rem;
    }
    .side h2 {
      margin: 0 0 0.75rem;
    }
    ul {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 0.5rem;
    }
    li {
      display: flex;
      align-items: center;
      gap: 0.55rem;
      font-weight: 700;
      padding: 0.5rem 0.35rem;
      border-radius: 12px;
      background: var(--q-surface);
    }
    .dot {
      width: 0.75rem;
      height: 0.75rem;
      border-radius: 50%;
    }
    .bot {
      margin-left: auto;
      font-size: 0.75rem;
      color: var(--q-muted);
      text-transform: uppercase;
    }
    .empty {
      color: var(--q-muted);
      background: transparent;
    }
    @media (max-width: 860px) {
      .layout {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class LobbyPage implements OnInit, OnDestroy {
  readonly lang = inject(LanguageService);
  readonly rooms = inject(GameRoomService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly room = this.rooms.room;
  readonly copied = signal(false);
  readonly starting = signal(false);

  readonly playerList = computed(() =>
    Object.values(this.room()?.players ?? {}).sort((a, b) => a.joinedAt - b.joinedAt),
  );

  private code = '';

  ngOnInit(): void {
    this.code = this.route.snapshot.paramMap.get('code') ?? '';
    void this.rooms.watchRoom(this.code);
  }

  ngOnDestroy(): void {
    // keep watching into play; play page will re-watch
  }

  async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.code);
      this.copied.set(true);
      window.setTimeout(() => this.copied.set(false), 1500);
    } catch {
      /* ignore */
    }
  }

  async addTests(): Promise<void> {
    await this.rooms.addTestPlayers(this.code);
  }

  async start(): Promise<void> {
    if (this.playerList().length === 0) {
      alert(this.lang.t().minPlayers);
      return;
    }
    this.starting.set(true);
    try {
      await this.rooms.startGame(this.code);
      await this.router.navigate(['/play', this.code]);
    } catch {
      alert(this.lang.t().minPlayers);
    } finally {
      this.starting.set(false);
    }
  }
}
