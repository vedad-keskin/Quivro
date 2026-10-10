import {
  Component,
  computed,
  effect,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EntitlementService } from '../../core/entitlement.service';
import { GameRoomService } from '../../core/game-room.service';
import { LanguageService } from '../../core/language.service';
import {
  avatarColor,
  avatarEmoji,
  POWER_UP_CATALOG,
  type PowerUpSlot,
} from '../../core/room.models';
import type { QuestionType } from '../../../data/questions/types';
import { SnackbarService } from '../../core/snackbar.service';
import { CATEGORY_ACCENT, SCORING_ACCENT, TYPE_ACCENT } from '../../shared/round-accents';
import { SettingsChips } from '../../shared/settings-chips';

@Component({
  selector: 'app-lobby',
  imports: [SettingsChips],
  template: `
    <div class="q-page q-show lobby">
      <header class="top">
        <button type="button" class="back" (click)="goBack()">← {{ lang.t().back }}</button>
        <app-settings-chips />
      </header>

      @if (room(); as r) {
        <div class="layout">
          <div class="col">
            <section class="stage spotlight code-stage">
              <img
                class="pro-sticker"
                [class.off]="!ent.isPro()"
                src="/brand/pro_badge.png"
                [alt]="ent.isPro() ? lang.t().hostedWithPro : lang.t().proLocked"
              />
              @if (!rooms.hosting()) {
                <p class="note">{{ lang.t().alreadyHostingOtherTab }}</p>
              }
              <p class="label">{{ lang.t().joinCode }}</p>
              <h1 class="digits" [attr.aria-label]="r.code">
                @for (ch of r.code.split(''); track $index) {
                  <span class="digit" aria-hidden="true">{{ ch }}</span>
                }
              </h1>
              <button type="button" class="key-btn" (click)="copy()">
                {{ copied() ? lang.t().copied : lang.t().copyCode }}
              </button>
              <p class="waiting">{{ lang.t().waitingPlayers }}</p>
            </section>

            <section>
              <h2 class="section-title">{{ lang.t().howToJoin }}</h2>
              <ol class="join">
                @for (key of joinSteps; track key) {
                  <li class="stage">
                    <span class="step">{{ $index + 1 }}</span>
                    {{ lang.t()[key] }}
                  </li>
                }
              </ol>
            </section>

            <section class="stage recap">
              <h2 class="section-title">{{ lang.t().roundRecap }}</h2>
              <ul class="cats">
                @for (t of r.config.questionTypes; track t) {
                  <li class="type" [style.--accent]="TYPE_ACCENT[t]">
                    <img [src]="typeInfo[t].icon" alt="" />{{ lang.t()[typeInfo[t].labelKey] }}
                  </li>
                }
                @for (cat of r.config.questionTypes.includes('mcq') ? r.config.categories : []; track cat) {
                  <li [style.--accent]="CATEGORY_ACCENT[cat]">{{ lang.t()[cat] }}</li>
                }
              </ul>
              <div class="facts">
                <div class="fact">
                  <strong>{{ r.config.roundLength }}</strong>
                  <span>{{ lang.t().questions }}</span>
                </div>
                <div class="fact">
                  <strong>{{ r.config.questionSeconds }}</strong>
                  <span>{{ lang.t().seconds }}</span>
                </div>
                <div class="fact">
                  <strong class="word" [style.--accent]="SCORING_ACCENT[r.config.scoringMode]">{{
                    r.config.scoringMode === 'timed' ? lang.t().scoringTimed : lang.t().scoringStandard
                  }}</strong>
                  <span>{{ lang.t().scoringMode }}</span>
                </div>
              </div>
              <div class="reels" [attr.aria-label]="lang.t().powerUps">
                <span class="reels-label">{{ lang.t().powerUps }}</span>
                @for (slot of r.config.powerUpSlots; track $index) {
                  <span class="reel">
                    @if (powerUpIcon(slot); as icon) {
                      <img [src]="icon" [alt]="powerUpLabel(slot)" />
                    } @else {
                      <span aria-hidden="true">–</span>
                    }
                  </span>
                }
              </div>
            </section>
          </div>

          <aside class="col">
            <section class="stage players">
              <header class="players-head">
                <h2 class="section-title">{{ lang.t().players }}</h2>
                <span class="count">{{ playerList().length }}</span>
                <span class="live"><i></i>{{ lang.t().live }}</span>
              </header>
              <ul class="cards">
                @for (p of playerList(); track p.id) {
                  <li class="card">
                    <span class="avatar" [style.background]="avatarColor(p.avatar)">{{
                      avatarEmoji(p.avatar)
                    }}</span>
                    <span class="name">{{ p.name }}</span>
                  </li>
                } @empty {
                  <li class="seat" aria-hidden="true"></li>
                  <li class="seat" aria-hidden="true"></li>
                  <li class="empty">{{ lang.t().noPlayersYet }}</li>
                }
              </ul>
            </section>

            <button
              type="button"
              class="go"
              [disabled]="!rooms.hosting() || playerList().length === 0 || starting()"
              (click)="start()"
            >
              {{ lang.t().start }} <span class="go-arrow">▶</span>
            </button>
            @if (rooms.hosting() && playerList().length === 0) {
              <p class="hint">{{ lang.t().minPlayers }}</p>
            }
          </aside>
        </div>
      } @else {
        <div class="stage missing">
          <h1 class="show-title">{{ lang.t().roomNotFound }}</h1>
        </div>
      }
    </div>
  `,
  styles: `
    .top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.8rem;
    }
    .layout {
      display: grid;
      grid-template-columns: 1.45fr 1fr;
      gap: 1.8rem;
      align-items: start;
      max-width: 1100px;
      margin: 0 auto 2rem;
    }
    .col {
      display: grid;
      gap: 1.8rem;
      min-width: 0;
    }
    .section-title {
      margin: 0;
      font-family: var(--display);
      font-weight: 400;
      font-size: 1.2rem;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--q-navy);
    }

    /* Code stage */
    .code-stage {
      display: grid;
      justify-items: center;
      gap: 0.9rem;
      padding: 2rem 1.2rem 1.6rem;
      text-align: center;
    }
    .pro-sticker {
      position: absolute;
      top: -34px;
      right: -26px;
      width: 104px;
      height: 104px;
      transform: rotate(12deg);
      pointer-events: none;
    }
    .pro-sticker.off {
      filter: grayscale(1);
      opacity: 0.45;
    }
    .note {
      margin: 0;
      max-width: 26rem;
      padding: 0.55rem 0.9rem;
      border: 3px solid var(--ink);
      border-radius: 10px;
      background: var(--bulb);
      color: #1a1530;
      font-weight: 900;
      line-height: 1.3;
      box-shadow: 2px 2px 0 var(--ink);
      transform: rotate(-1.5deg);
    }
    .label {
      margin: 0;
      color: var(--q-muted);
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      font-size: 0.85rem;
    }
    .waiting {
      margin: 0;
      color: var(--q-muted);
      font-weight: 800;
    }

    /* How to join */
    .join {
      margin: 0.9rem 0 0;
      padding: 0;
      list-style: none;
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 1.1rem;
    }
    .join li {
      padding: 1.3rem 0.9rem 0.9rem;
      font-weight: 800;
      color: var(--q-navy);
      line-height: 1.3;
    }
    .join li:nth-child(1) .step {
      background: var(--q-cyan);
    }
    .join li:nth-child(2) .step {
      background: var(--q-orange);
    }
    .join li:nth-child(3) .step {
      background: var(--q-pink);
    }

    /* Round recap */
    .recap {
      display: grid;
      gap: 1rem;
    }
    .cats {
      margin: 0;
      padding: 0;
      list-style: none;
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .cats li {
      padding: 0.3rem 0.7rem;
      border: 3px solid var(--ink);
      border-radius: 10px;
      background: var(--accent);
      color: #1a1530;
      font-size: 0.85rem;
      font-weight: 900;
      box-shadow: 2px 2px 0 var(--ink);
    }
    .cats li.type {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
    }
    .type img {
      width: 20px;
      height: 20px;
      object-fit: contain;
    }
    .facts {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 0.7rem;
    }
    .fact {
      display: grid;
      gap: 0.15rem;
      padding: 0.55rem 0.6rem;
      border: 3px solid var(--ink);
      border-radius: 12px;
      background: var(--lcd);
      box-shadow: inset 0 4px 0 rgba(0, 0, 0, 0.5);
      color: var(--bulb);
      text-align: center;
    }
    .fact strong {
      font-family: var(--display);
      font-weight: 400;
      font-size: 1.7rem;
      line-height: 1;
      text-shadow: 0 0 12px color-mix(in srgb, var(--bulb) 55%, transparent);
    }
    .fact strong.word {
      font-size: 1.15rem;
      line-height: 1.5;
      color: var(--accent, var(--bulb));
      text-shadow: none;
    }
    .fact span {
      font-size: 0.7rem;
      font-weight: 900;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      opacity: 0.85;
    }
    .reels {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.6rem;
    }
    .reels-label {
      margin-right: auto;
      font-weight: 900;
      color: var(--q-navy);
    }
    .reel {
      width: 52px;
      height: 52px;
      display: grid;
      place-items: center;
      border: 3px solid var(--ink);
      border-radius: 10px;
      background: linear-gradient(#fff, #e9e4f5);
      box-shadow: inset 0 3px 0 rgba(0, 0, 0, 0.18);
      color: #6b6485;
      font-family: var(--display);
      font-size: 1.5rem;
    }
    .reel img {
      width: 36px;
      height: 36px;
      object-fit: contain;
    }

    /* Players */
    .players {
      display: grid;
      gap: 1rem;
    }
    .players-head {
      display: flex;
      align-items: center;
      gap: 0.55rem;
    }
    .count {
      min-width: 2rem;
      padding: 0.1rem 0.5rem;
      border: 3px solid var(--ink);
      border-radius: 10px;
      background: var(--bulb);
      color: #1a1530;
      font-family: var(--display);
      font-size: 1.1rem;
      text-align: center;
      box-shadow: 2px 2px 0 var(--ink);
    }
    .live {
      margin-left: auto;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.75rem;
      font-weight: 900;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #e8435a;
    }
    .live i {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #e8435a;
      animation: live-pulse 1.4s ease-out infinite;
    }
    @keyframes live-pulse {
      0% {
        box-shadow: 0 0 0 0 rgba(232, 67, 90, 0.6);
      }
      100% {
        box-shadow: 0 0 0 10px rgba(232, 67, 90, 0);
      }
    }
    .cards {
      margin: 0;
      padding: 0;
      list-style: none;
      display: grid;
      gap: 0.75rem;
    }
    .card {
      display: flex;
      align-items: center;
      gap: 0.7rem;
      padding: 0.55rem 0.7rem;
      border: 3px solid var(--ink);
      border-radius: 14px;
      background: var(--q-card);
      box-shadow: 0 4px 0 var(--ink);
      transform: rotate(-0.8deg);
      animation: card-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .card:nth-child(even) {
      transform: rotate(0.8deg);
    }
    @keyframes card-pop {
      from {
        opacity: 0;
        transform: scale(0.6) rotate(-6deg);
      }
    }
    .avatar {
      width: 2.6rem;
      height: 2.6rem;
      flex-shrink: 0;
      display: grid;
      place-items: center;
      border: 3px solid var(--ink);
      border-radius: 50%;
      font-size: 1.2rem;
    }
    .name {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-family: var(--display);
      font-size: 1.2rem;
      color: var(--q-navy);
    }
    .seat {
      height: 3.6rem;
      border: 3px dashed color-mix(in srgb, var(--q-muted) 55%, transparent);
      border-radius: 14px;
    }
    .empty {
      color: var(--q-muted);
      font-weight: 800;
      line-height: 1.35;
    }
    .hint {
      margin: -0.9rem 0 0;
      color: var(--q-muted);
      font-weight: 700;
      font-size: 0.88rem;
      text-align: center;
    }

    .missing {
      max-width: 480px;
      margin: 2rem auto;
      text-align: center;
    }
    .missing h1 {
      font-size: 1.8rem;
    }

    @media (max-width: 860px) {
      .layout {
        grid-template-columns: 1fr;
      }
      .pro-sticker {
        right: -8px;
      }
    }
    @media (max-width: 560px) {
      .join {
        grid-template-columns: 1fr;
        gap: 1.4rem;
      }
      .pro-sticker {
        top: -24px;
        right: -12px;
        width: 72px;
        height: 72px;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .live i,
      .card {
        animation: none;
      }
    }
  `,
})
export class LobbyPage implements OnInit, OnDestroy {
  readonly lang = inject(LanguageService);
  readonly rooms = inject(GameRoomService);
  readonly ent = inject(EntitlementService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snack = inject(SnackbarService);

  readonly room = this.rooms.room;
  readonly copied = signal(false);
  readonly starting = signal(false);
  readonly avatarColor = avatarColor;
  readonly avatarEmoji = avatarEmoji;
  readonly joinSteps = ['joinStep1', 'joinStep2', 'joinStep3'] as const;
  readonly typeInfo: Record<QuestionType, { icon: string; labelKey: 'mcq' | 'imageMcq' }> = {
    mcq: { icon: '/room-icons/text.png', labelKey: 'mcq' },
    image_mcq: { icon: '/room-icons/picture.png', labelKey: 'imageMcq' },
  };
  readonly TYPE_ACCENT = TYPE_ACCENT;
  readonly CATEGORY_ACCENT = CATEGORY_ACCENT;
  readonly SCORING_ACCENT = SCORING_ACCENT;

  powerUpIcon(slot: PowerUpSlot): string | undefined {
    return POWER_UP_CATALOG.find((p) => p.id === slot)?.icon;
  }

  powerUpLabel(slot: PowerUpSlot): string {
    const item = POWER_UP_CATALOG.find((p) => p.id === slot);
    return item ? this.lang.t()[item.labelKey] : '';
  }

  readonly playerList = computed(() =>
    Object.values(this.room()?.players ?? {}).sort((a, b) => a.joinedAt - b.joinedAt),
  );

  private code = '';
  /** Skip room teardown when navigating lobby → play. */
  private keepRoomAlive = false;
  private knownPlayerIds = new Set<string>();
  private playersSeeded = false;

  constructor() {
    effect(() => {
      const r = this.room();
      if (!r || (this.code && r.code !== this.code)) return;
      const ids = Object.keys(r.players ?? {});
      if (!this.playersSeeded) {
        this.knownPlayerIds = new Set(ids);
        this.playersSeeded = true;
        return;
      }
      for (const id of ids) {
        if (!this.knownPlayerIds.has(id)) {
          this.knownPlayerIds.add(id);
          this.playJoinSfx();
        }
      }
      for (const id of [...this.knownPlayerIds]) {
        if (!ids.includes(id)) this.knownPlayerIds.delete(id);
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
    // Implicit teardown (back nav, tab close) must NOT delete the room — a real
    // tab close arms the host onDisconnect marker, and expired/abandoned rooms
    // are reaped lazily + by the sweep. Explicit exit uses goBack(). Just
    // detach this component's listener.
    if (!this.keepRoomAlive) {
      this.rooms.stopWatching();
    }
  }

  async goBack(): Promise<void> {
    await this.rooms.leaveHostedRoom(this.code);
    await this.router.navigateByUrl('/create');
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
    if (!this.rooms.hosting()) {
      this.snack.error(this.lang.t().alreadyHostingOtherTab);
      return;
    }
    if (this.playerList().length === 0) {
      this.snack.error(this.lang.t().minPlayers);
      return;
    }
    this.starting.set(true);
    try {
      await this.rooms.startGame(this.code, this.lang.lang());
      this.keepRoomAlive = true;
      await this.router.navigate(['/play', this.code]);
    } catch (e) {
      console.error(e);
      this.keepRoomAlive = false;
      if (e instanceof Error && e.message === 'NOT_HOST') {
        this.snack.error(this.lang.t().alreadyHostingOtherTab);
      } else if (e instanceof Error && e.message === 'DOUBLE_IT_UPDATE_REQUIRED') {
        this.snack.error(this.lang.t().doubleItUpdateRequired);
      } else if (e instanceof Error && e.message === 'NO_PLAYERS') {
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

  private playJoinSfx(): void {
    try {
      const audio = new Audio('/sounds/revenge_opt_in.mp3');
      void audio.play().catch(() => {
        /* Autoplay may be blocked until a host gesture. */
      });
    } catch {
      /* Ignore audio failures. */
    }
  }
}
