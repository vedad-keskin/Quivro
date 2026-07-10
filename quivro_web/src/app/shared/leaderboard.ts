import { Component, input } from '@angular/core';
import { avatarColor, avatarEmoji, type RoomPlayer } from '../core/room.models';

@Component({
  selector: 'app-leaderboard',
  template: `
    <aside class="board">
      <h2>{{ title() }}</h2>
      <div class="q-brand-line"></div>
      <ol>
        @for (player of ranked(); track player.id; let i = $index) {
          <li [attr.data-player-id]="player.id">
            <span class="rank">{{ i + 1 }}</span>
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
        } @empty {
          <li class="empty">—</li>
        }
      </ol>
    </aside>
  `,
  styles: `
    .board {
      min-width: 220px;
      height: 100%;
      border: 2px solid var(--q-border);
      border-radius: 28px;
      padding: 1.15rem;
      background: #fff;
    }
    h2 {
      margin: 0;
      font-size: 1.2rem;
      font-weight: 900;
    }
    .q-brand-line {
      margin: 0.45rem 0 0.9rem;
    }
    ol {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 0.55rem;
    }
    li {
      display: grid;
      grid-template-columns: 1.4rem 2rem 1fr auto auto;
      align-items: center;
      gap: 0.45rem;
      padding: 0.55rem 0.4rem;
      border-radius: 14px;
      background: var(--q-surface);
    }
    .rank {
      font-weight: 900;
      color: var(--q-muted);
    }
    .avatar {
      width: 1.9rem;
      height: 1.9rem;
      border-radius: 50%;
      display: grid;
      place-items: center;
      font-size: 0.95rem;
    }
    .name {
      font-weight: 800;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }
    .wins {
      font-size: 0.7rem;
      font-weight: 900;
      color: var(--q-purple);
      background: #f5f3ff;
      padding: 0.1rem 0.35rem;
      border-radius: 999px;
    }
    .score {
      font-weight: 900;
    }
    .delta {
      color: #65a30d;
      font-weight: 900;
      font-size: 0.85rem;
    }
    .empty {
      color: var(--q-muted);
      background: transparent;
    }
  `,
})
export class Leaderboard {
  readonly title = input('Leaderboard');
  readonly players = input<RoomPlayer[]>([]);
  readonly deltas = input<Record<string, number> | undefined>(undefined);

  readonly avatarColor = avatarColor;
  readonly avatarEmoji = avatarEmoji;

  ranked(): RoomPlayer[] {
    return [...this.players()].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  }
}
