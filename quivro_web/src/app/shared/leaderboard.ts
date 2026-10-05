import { Component, computed, effect, input, signal } from '@angular/core';
import {
  avatarColor,
  avatarEmoji,
  rankMoves,
  rankPlayers,
  type RoomPlayer,
} from '../core/room.models';

@Component({
  selector: 'app-leaderboard',
  template: `
    <aside class="board">
      <h2>{{ title() }}</h2>

      @if (ranked().length === 0) {
        <p class="empty">—</p>
      } @else {
        @if (showPodium() && podium().length > 0) {
          <div class="podium" [attr.data-count]="podium().length">
            @for (slot of podiumSlots(); track slot.player.id) {
              <div class="spot place-{{ slot.place }}" [attr.data-player-id]="slot.player.id">
                @if (slot.place === 1) {
                  <svg class="crown" viewBox="0 0 32 22" aria-hidden="true">
                    <path d="M3 19 L1.5 5 L9.5 11 L16 2 L22.5 11 L30.5 5 L29 19 Z" />
                  </svg>
                }
                <span class="avatar" [style.background]="avatarColor(slot.player.avatar)">{{
                  avatarEmoji(slot.player.avatar)
                }}</span>
                <span class="p-name">
                  {{ slot.player.name }}
                  @if (slot.player.wins > 0) {
                    <span class="wins">{{ slot.player.wins }}W</span>
                  }
                </span>
                <div class="block">
                  <span class="lcd">{{ slot.player.score }}</span>
                  <span class="place">{{ slot.place }}</span>
                </div>
                @if (deltas()?.[slot.player.id]; as d) {
                  @if (d > 0) {
                    <span class="delta">+{{ d }}</span>
                  }
                }
                @if (moveLabel(slot.player.id); as m) {
                  <span class="move" [class.down]="m.down">{{ m.text }}</span>
                }
              </div>
            }
          </div>
        }

        @if (listPlayers().length > 0) {
          <ol [class.hiding]="podiumOnly()">
            @for (player of listPlayers(); track player.id; let i = $index) {
              <li [attr.data-player-id]="player.id">
                <span class="rank">{{ listRankOffset() + i + 1 }}</span>
                <span class="avatar" [style.background]="avatarColor(player.avatar)">{{
                  avatarEmoji(player.avatar)
                }}</span>
                <span class="name">
                  {{ player.name }}
                  @if (player.wins > 0) {
                    <span class="wins">{{ player.wins }}W</span>
                  }
                </span>
                @if (moveLabel(player.id); as m) {
                  <span class="move inline" [class.down]="m.down">{{ m.text }}</span>
                }
                @if (deltas()?.[player.id]; as d) {
                  @if (d > 0) {
                    <span class="delta inline">+{{ d }}</span>
                  }
                }
                <span class="lcd">{{ player.score }}</span>
              </li>
            }
          </ol>
        }
      }
    </aside>
  `,
  styles: `
    .board {
      min-width: 220px;
      height: 100%;
      display: flex;
      flex-direction: column;
      min-height: 0;
      padding: clamp(1rem, 1.6vw, 1.3rem);
      border: 3px solid var(--ink);
      border-radius: 20px;
      background: var(--q-card);
      box-shadow: 6px 6px 0 var(--ink);
    }
    h2 {
      margin: 0 0 0.9rem;
      font-family: var(--display);
      font-weight: 400;
      font-size: clamp(1.25rem, 2vw, 1.6rem);
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--q-navy);
    }
    .empty {
      margin: 0;
      color: var(--q-muted);
      font-weight: 700;
    }

    /* Podium */
    .podium {
      display: grid;
      grid-template-columns: 1fr 1.1fr 1fr;
      align-items: end;
      gap: 0.45rem;
      width: 100%;
      max-width: 34rem;
      margin: 0.6rem auto 1rem;
    }
    .podium[data-count='1'] {
      grid-template-columns: minmax(0, 11rem);
      justify-content: center;
    }
    .podium[data-count='2'] {
      grid-template-columns: 1.1fr 1fr;
    }
    .spot {
      position: relative;
      min-width: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.3rem;
      text-align: center;
    }
    .crown {
      width: 34px;
      height: 24px;
      margin-bottom: -0.3rem;
      fill: var(--bulb);
      stroke: var(--ink);
      stroke-width: 2.4;
      stroke-linejoin: round;
      filter: drop-shadow(0 0 6px color-mix(in srgb, var(--bulb) 70%, transparent));
    }
    .spot .avatar {
      width: clamp(2.6rem, 4.2vw, 3.3rem);
      height: clamp(2.6rem, 4.2vw, 3.3rem);
      font-size: clamp(1.2rem, 2vw, 1.55rem);
    }
    .place-1 .avatar {
      width: clamp(3rem, 4.8vw, 3.8rem);
      height: clamp(3rem, 4.8vw, 3.8rem);
      font-size: clamp(1.35rem, 2.3vw, 1.8rem);
    }
    .p-name {
      max-width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.25rem;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      font-family: var(--display);
      font-size: clamp(0.85rem, 1.3vw, 1.05rem);
      color: var(--q-navy);
    }
    .block {
      --tone: #cfd6e4;
      width: 100%;
      display: grid;
      justify-items: center;
      align-content: start;
      gap: 0.2rem;
      padding: 0.45rem 0.3rem 0.3rem;
      border: 3px solid var(--ink);
      border-bottom-width: 5px;
      border-radius: 12px 12px 6px 6px;
      background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.35), transparent 45%),
        var(--tone);
      box-shadow: 4px 0 0 var(--ink);
      transform-origin: bottom;
      animation: rise 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    }
    .place-1 .block {
      --tone: var(--bulb);
      min-height: clamp(6.5rem, 12vh, 8.5rem);
    }
    .place-2 .block {
      min-height: clamp(5rem, 9vh, 6.5rem);
      animation-delay: 0.08s;
    }
    .place-3 .block {
      --tone: #e0a066;
      min-height: clamp(4rem, 7vh, 5.2rem);
      animation-delay: 0.16s;
    }
    @keyframes rise {
      from {
        transform: scaleY(0.2);
        opacity: 0;
      }
    }
    .place {
      font-family: var(--display);
      font-size: clamp(1.8rem, 3vw, 2.6rem);
      line-height: 1;
      color: #1a1530;
      text-shadow: 2px 2px 0 rgba(255, 255, 255, 0.55);
    }

    /* Shared bits */
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
    .lcd {
      min-width: 2.6rem;
      padding: 0.15rem 0.5rem;
      border: 2px solid var(--ink);
      border-radius: 8px;
      background: var(--lcd);
      box-shadow: inset 0 3px 0 rgba(0, 0, 0, 0.5);
      color: var(--bulb);
      font-family: var(--display);
      font-size: clamp(1.05rem, 1.7vw, 1.35rem);
      line-height: 1.1;
      text-align: center;
      text-shadow: 0 0 10px color-mix(in srgb, var(--bulb) 55%, transparent);
    }
    .wins {
      flex-shrink: 0;
      padding: 0.05rem 0.35rem;
      border: 2px solid var(--ink);
      border-radius: 6px;
      background: var(--q-purple);
      color: #fff;
      font-family: 'Nunito', sans-serif;
      font-size: 0.68rem;
      font-weight: 900;
    }
    .delta {
      position: absolute;
      top: 0;
      right: -4px;
      padding: 0.1rem 0.4rem;
      border: 2px solid var(--ink);
      border-radius: 8px;
      background: var(--q-lime);
      color: #1a1530;
      font-weight: 900;
      font-size: 0.85rem;
      box-shadow: 2px 2px 0 var(--ink);
      transform: rotate(8deg);
      animation: pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .move {
      position: absolute;
      top: 0;
      left: -4px;
      color: #16a34a;
      font-weight: 900;
      font-size: 0.85rem;
      animation: pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .move.down {
      color: #e11d48;
    }
    .delta.inline,
    .move.inline {
      position: static;
    }
    .delta.inline {
      transform: rotate(-4deg);
    }
    @keyframes pop {
      from {
        opacity: 0;
        transform: scale(0.4);
      }
    }

    /* Rows */
    ol {
      list-style: none;
      margin: 0;
      padding: 0 0.3rem 0.3rem 0;
      display: grid;
      align-content: start;
      gap: 0.6rem;
      flex: 1;
      min-height: 0;
      max-height: 40rem;
      overflow: auto;
      opacity: 1;
      transition: opacity 0.2s ease;
    }
    ol.hiding {
      height: 0;
      max-height: 0;
      opacity: 0;
      margin: 0;
      gap: 0;
      overflow: hidden;
      pointer-events: none;
      flex: 0 0 auto;
    }
    li {
      display: flex;
      align-items: center;
      gap: 0.55rem;
      padding: 0.45rem 0.55rem;
      border: 3px solid var(--ink);
      border-radius: 12px;
      background: var(--q-card);
      box-shadow: 0 3px 0 var(--ink);
    }
    .rank {
      flex-shrink: 0;
      width: 1.9rem;
      height: 1.9rem;
      display: grid;
      place-items: center;
      border: 2px solid var(--ink);
      border-radius: 8px;
      background: var(--q-track);
      color: var(--q-navy);
      font-family: var(--display);
      font-size: 1.05rem;
    }
    .name {
      flex: 1;
      min-width: 0;
      display: flex;
      align-items: center;
      gap: 0.35rem;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      font-family: var(--display);
      font-size: clamp(1rem, 1.5vw, 1.2rem);
      color: var(--q-navy);
    }

    @media (prefers-reduced-motion: reduce) {
      .block,
      .delta,
      .move {
        animation: none;
      }
      ol {
        transition: none;
      }
    }

    /* Compact when a picture is docked under the board. */
    :host-context(.board-col.with-image) {
      display: block;
      height: auto;
      overflow: visible;
    }
    :host-context(.board-col.with-image) .board {
      height: auto;
      padding: clamp(0.65rem, 1vw, 0.9rem);
    }
    :host-context(.board-col.with-image) h2 {
      margin-bottom: 0.4rem;
      font-size: clamp(1rem, 1.5vw, 1.2rem);
    }
    :host-context(.board-col.with-image) .podium {
      margin: 0.3rem 0 0;
    }
    :host-context(.board-col.with-image) .crown {
      width: 24px;
      height: 17px;
    }
    :host-context(.board-col.with-image) .spot .avatar {
      width: 2rem;
      height: 2rem;
      font-size: 0.95rem;
    }
    :host-context(.board-col.with-image) .p-name {
      font-size: 0.75rem;
    }
    :host-context(.board-col.with-image) .block {
      min-height: 0;
      padding: 0.25rem 0.2rem 0.2rem;
    }
    :host-context(.board-col.with-image) .place {
      font-size: 1.2rem;
    }
    :host-context(.board-col.with-image) .lcd {
      font-size: 0.9rem;
    }
  `,
})
export class Leaderboard {
  readonly title = input('Leaderboard');
  readonly players = input<RoomPlayer[]>([]);
  readonly deltas = input<Record<string, number> | undefined>(undefined);
  readonly showPodium = input(true);
  /** When true, show only the top-3 podium (no ranked list below). */
  readonly podiumOnly = input(false);

  readonly avatarColor = avatarColor;
  readonly avatarEmoji = avatarEmoji;

  readonly ranked = computed(() => rankPlayers(this.players()));
  /** Places moved at the last scoring reveal, per player id. */
  readonly moves = signal<Record<string, number>>({});
  private prevOrder: string[] = [];
  private lastDeltaKey = '';

  constructor() {
    // Room snapshots arrive often; only a new set of score deltas means a reveal.
    effect(() => {
      const order = this.ranked().map((p) => p.id);
      const key = JSON.stringify(this.deltas() ?? {});
      if (key !== this.lastDeltaKey) {
        this.lastDeltaKey = key;
        this.moves.set(rankMoves(this.prevOrder, order));
      }
      this.prevOrder = order;
    });
  }

  moveLabel(id: string): { text: string; down: boolean } | null {
    const m = this.moves()[id] ?? 0;
    if (m === 0) return null;
    return { text: (m > 0 ? '▲' : '▼') + Math.abs(m), down: m < 0 };
  }

  readonly podium = computed(() => {
    if (!this.showPodium()) return [] as RoomPlayer[];
    return this.ranked().slice(0, 3);
  });

  /** Players below the podium; kept in DOM when podiumOnly so the list can fade out. */
  readonly listPlayers = computed(() => {
    const all = this.ranked();
    if (!this.showPodium() || this.podium().length === 0) return all;
    return all.slice(3);
  });

  readonly listRankOffset = computed(() => {
    if (!this.showPodium() || this.podium().length === 0) return 0;
    return 3;
  });

  /** Classic order: 2nd | 1st | 3rd when 3 players; adapts for 1–2. */
  readonly podiumSlots = computed(() => {
    const top = this.podium();
    if (top.length === 0) return [] as { place: 1 | 2 | 3; player: RoomPlayer }[];
    if (top.length === 1) {
      return [{ place: 1 as const, player: top[0] }];
    }
    if (top.length === 2) {
      return [
        { place: 1 as const, player: top[0] },
        { place: 2 as const, player: top[1] },
      ];
    }
    return [
      { place: 2 as const, player: top[1] },
      { place: 1 as const, player: top[0] },
      { place: 3 as const, player: top[2] },
    ];
  });
}
