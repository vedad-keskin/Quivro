import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CATEGORIES } from '../../../data/questions/types';
import { GameRoomService } from '../../core/game-room.service';
import { LanguageService } from '../../core/language.service';
import { LangToggle } from '../../shared/lang-toggle';

@Component({
  selector: 'app-test-mode',
  imports: [RouterLink, LangToggle],
  template: `
    <div class="q-page">
      <header class="top">
        <a routerLink="/" class="q-btn q-btn-ghost">← {{ lang.t().back }}</a>
        <app-lang-toggle />
      </header>

      <div class="q-card panel">
        <h1>{{ lang.t().testMode }}</h1>
        <p class="q-muted">
          Creates a 15-question room with all categories, adds test players, and opens the lobby.
        </p>
        @if (!rooms.isLive) {
          <p class="warn">{{ lang.t().firebaseMissing }}</p>
        }
        <button
          type="button"
          class="q-btn q-btn-primary"
          [disabled]="busy()"
          (click)="launch()"
        >
          {{ lang.t().testMode }}
        </button>
      </div>
    </div>
  `,
  styles: `
    .top {
      display: flex;
      justify-content: space-between;
      margin-bottom: 1.25rem;
    }
    .panel {
      max-width: 560px;
      margin: 0 auto;
      display: grid;
      gap: 1rem;
    }
    h1 {
      margin: 0;
    }
    .warn {
      color: #c2410c;
      font-weight: 700;
    }
  `,
})
export class TestModePage {
  readonly lang = inject(LanguageService);
  readonly rooms = inject(GameRoomService);
  private readonly router = inject(Router);
  readonly busy = signal(false);

  async launch(): Promise<void> {
    this.busy.set(true);
    try {
      const code = await this.rooms.createRoom({
        categories: [...CATEGORIES],
        roundLength: 15,
        language: this.lang.lang(),
      });
      await this.rooms.addTestPlayers(code);
      await this.router.navigate(['/lobby', code]);
    } catch (e) {
      console.error(e);
      alert(this.lang.t().createFailed);
    } finally {
      this.busy.set(false);
    }
  }
}
