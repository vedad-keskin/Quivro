import { Component, input } from '@angular/core';
import type { RoomPlayer } from '../core/room.models';

@Component({
  selector: 'app-leaderboard',
  template: `
    <aside class="board q-card">
      <h2>{{ title() }}</h2>
      <ol>
        @for (player of ranked(); track player.id; let i = $index) {
          <li>
            <span class="rank">{{ i + 1 }}</span>
            <span class="dot" [style.background]="player.color"></span>
            <span class="name">{{ player.name }}</span>
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
    }
    h2 {
      margin: 0 0 0.75rem;
      font-size: 1.1rem;
    }
    ol {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 0.5rem;
    }
    li {
      display: grid;
      grid-template-columns: 1.5rem 0.75rem 1fr auto auto;
      align-items: center;
      gap: 0.5rem;
      padding: 0.45rem 0.35rem;
      border-radius: 12px;
      background: var(--q-surface);
    }
    .rank {
      font-weight: 800;
      color: var(--q-muted);
    }
    .dot {
      width: 0.75rem;
      height: 0.75rem;
      border-radius: 50%;
    }
    .name {
      font-weight: 700;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .score {
      font-weight: 800;
    }
    .delta {
      color: var(--q-lime);
      font-weight: 800;
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

  ranked(): RoomPlayer[] {
    return [...this.players()].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  }
}
