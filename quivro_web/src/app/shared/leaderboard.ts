import { Component, computed, input } from '@angular/core';
import { avatarColor, avatarEmoji, rankPlayers, type RoomPlayer } from '../core/room.models';

@Component({
  selector: 'app-leaderboard',
  template: `
    <aside class="board">
      <h2>{{ title() }}</h2>
      <div class="q-brand-line"></div>

      @if (ranked().length === 0) {
        <p class="empty">—</p>
      } @else {
        @if (showPodium() && podium().length > 0) {
          <div class="podium" [attr.data-count]="podium().length">
            @for (slot of podiumSlots(); track slot.place) {
              <div
                class="podium-card place-{{ slot.place }}"
                [attr.data-player-id]="slot.player.id"
              >
                <span class="podium-rank">{{ slot.place }}</span>
                <span
                  class="avatar podium-avatar"
                  [style.background]="avatarColor(slot.player.avatar)"
                  >{{ avatarEmoji(slot.player.avatar) }}</span
                >
                <span class="podium-name">
                  {{ slot.player.name }}
                  @if (slot.player.wins > 0) {
                    <span class="wins">{{ slot.player.wins }}W</span>
                  }
                </span>
                <span class="podium-score">{{ slot.player.score }}</span>
                @if (deltas()?.[slot.player.id]; as d) {
                  @if (d > 0) {
                    <span class="delta">+{{ d }}</span>
                  }
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
                <span class="score">{{ player.score }}</span>
                @if (deltas()?.[player.id]; as d) {
                  @if (d > 0) {
                    <span class="delta">+{{ d }}</span>
                  }
                }
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
      border: 2px solid var(--q-border);
      border-radius: 28px;
      padding: clamp(1.15rem, 1.8vw, 1.45rem);
      background: var(--q-card);
      display: flex;
      flex-direction: column;
      min-height: 0;
    }
    h2 {
      margin: 0;
      font-size: clamp(1.25rem, 2vw, 1.55rem);
      font-weight: 900;
      color: var(--q-navy);
    }
    .q-brand-line {
      margin: 0.45rem 0 0.95rem;
    }
    .empty {
      margin: 0;
      color: var(--q-muted);
      font-weight: 700;
    }

    .podium {
      display: grid;
      grid-template-columns: 1fr 1.15fr 1fr;
      align-items: end;
      gap: 0.4rem;
      margin-bottom: 0.85rem;
    }
    .podium[data-count='1'] {
      grid-template-columns: 1fr;
      max-width: 12rem;
      margin-inline: auto;
    }
    .podium[data-count='2'] {
      grid-template-columns: 1.15fr 1fr;
    }

    .podium-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
      text-align: center;
      padding: 0.65rem 0.35rem 0.7rem;
      border-radius: 16px;
      border: 3px solid transparent;
      min-width: 0;
      animation: podiumIn 0.45s ease both;
    }
    .place-1 {
      background: var(--q-chip-gold);
      border-color: #eab308;
      padding-top: 0.95rem;
      padding-bottom: 0.9rem;
      z-index: 1;
    }
    .place-2 {
      background: var(--q-surface);
      border-color: #94a3b8;
      animation-delay: 0.06s;
    }
    .place-3 {
      background: var(--q-chip-warm);
      border-color: #d97706;
      animation-delay: 0.12s;
    }
    .podium-rank {
      font-weight: 900;
      font-size: clamp(1.35rem, 2.4vw, 1.85rem);
      line-height: 1;
      color: var(--q-navy);
    }
    .place-1 .podium-rank {
      font-size: clamp(1.55rem, 2.8vw, 2.15rem);
    }
    .podium-avatar {
      width: clamp(2.75rem, 4.5vw, 3.5rem);
      height: clamp(2.75rem, 4.5vw, 3.5rem);
      font-size: clamp(1.25rem, 2vw, 1.65rem);
    }
    .place-1 .podium-avatar {
      width: clamp(3.1rem, 5vw, 3.9rem);
      height: clamp(3.1rem, 5vw, 3.9rem);
      font-size: clamp(1.4rem, 2.3vw, 1.85rem);
    }
    .podium-name {
      font-weight: 800;
      font-size: clamp(0.85rem, 1.35vw, 1.05rem);
      color: var(--q-navy);
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.25rem;
      padding: 0 0.15rem;
    }
    .podium-score {
      font-weight: 900;
      font-size: clamp(1.35rem, 2.5vw, 1.85rem);
      color: var(--q-navy);
      line-height: 1.1;
    }
    .place-1 .podium-score {
      font-size: clamp(1.55rem, 2.9vw, 2.15rem);
    }

    @keyframes podiumIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    ol {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      align-content: start;
      gap: 0.65rem;
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
    @media (prefers-reduced-motion: reduce) {
      ol {
        transition: none;
      }
    }
    li {
      display: grid;
      grid-template-columns: 1.75rem 2.5rem 1fr auto auto;
      align-items: center;
      gap: 0.5rem;
      padding: 0.7rem 0.55rem;
      border-radius: 14px;
      background: var(--q-surface);
    }
    .rank {
      font-weight: 900;
      font-size: clamp(1.05rem, 1.6vw, 1.25rem);
      color: var(--q-navy);
      text-align: center;
    }
    .avatar {
      width: 2.4rem;
      height: 2.4rem;
      border-radius: 50%;
      display: grid;
      place-items: center;
      font-size: 1.15rem;
      flex-shrink: 0;
    }
    .name {
      font-weight: 800;
      font-size: clamp(1rem, 1.5vw, 1.2rem);
      color: var(--q-navy);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      display: flex;
      align-items: center;
      gap: 0.35rem;
      min-width: 0;
    }
    .wins {
      font-size: 0.75rem;
      font-weight: 900;
      color: var(--q-purple);
      background: var(--q-chip-purple);
      padding: 0.12rem 0.4rem;
      border-radius: 999px;
      flex-shrink: 0;
    }
    .score {
      font-weight: 900;
      font-size: clamp(1.1rem, 1.7vw, 1.35rem);
      color: var(--q-navy);
    }
    .delta {
      color: #65a30d;
      font-weight: 900;
      font-size: clamp(0.95rem, 1.4vw, 1.15rem);
    }

    /* Size to content when docked under an image — never clip the podium. */
    :host-context(.board-col.with-image) {
      display: block;
      height: auto;
      overflow: visible;
    }
    :host-context(.board-col.with-image) .board {
      height: auto;
      overflow: visible;
      padding: clamp(0.7rem, 1.1vw, 0.95rem);
    }
    :host-context(.board-col.with-image) h2 {
      font-size: clamp(1.05rem, 1.6vw, 1.25rem);
    }
    :host-context(.board-col.with-image) .q-brand-line {
      margin: 0.25rem 0 0.45rem;
    }
    :host-context(.board-col.with-image) .podium {
      margin-bottom: 0;
      gap: 0.25rem;
      align-items: end;
    }
    :host-context(.board-col.with-image) .podium-card {
      padding: 0.45rem 0.3rem 0.5rem;
      gap: 0.15rem;
    }
    :host-context(.board-col.with-image) .place-1 {
      padding-top: 0.55rem;
      padding-bottom: 0.55rem;
    }
    :host-context(.board-col.with-image) .podium-rank {
      font-size: 1.15rem;
    }
    :host-context(.board-col.with-image) .place-1 .podium-rank {
      font-size: 1.3rem;
    }
    :host-context(.board-col.with-image) .podium-avatar {
      width: 2.2rem;
      height: 2.2rem;
      font-size: 1.05rem;
    }
    :host-context(.board-col.with-image) .place-1 .podium-avatar {
      width: 2.45rem;
      height: 2.45rem;
      font-size: 1.15rem;
    }
    :host-context(.board-col.with-image) .podium-name {
      font-size: 0.75rem;
    }
    :host-context(.board-col.with-image) .podium-score {
      font-size: 0.95rem;
    }
    :host-context(.board-col.with-image) .place-1 .podium-score {
      font-size: 1.05rem;
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
