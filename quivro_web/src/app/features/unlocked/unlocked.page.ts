import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EntitlementService } from '../../core/entitlement.service';
import { LanguageService } from '../../core/language.service';
import { SnackbarService } from '../../core/snackbar.service';
import { SettingsChips } from '../../shared/settings-chips';

const POLL_MS = 2000;
const POLL_ATTEMPTS = 30;

/**
 * Where Lemon Squeezy sends the buyer after checkout. The webhook usually lands
 * before the redirect does, but polling covers the case where it does not.
 */
@Component({
  selector: 'app-unlocked',
  imports: [RouterLink, SettingsChips],
  template: `
    <div class="q-page">
      <header class="top">
        <a routerLink="/" class="q-btn q-btn-ghost">← {{ lang.t().home }}</a>
        <app-settings-chips />
      </header>

      <div class="panel">
        @if (ent.isPro()) {
          <span class="emoji">🎉</span>
          <h1>{{ lang.t().unlockedTitle }}</h1>
          <p>{{ lang.t().unlockedBody }}</p>
          <a routerLink="/create" class="q-btn q-btn-outline">{{ lang.t().createRound }}</a>
        } @else if (gaveUp()) {
          <span class="emoji">⏳</span>
          <h1>{{ lang.t().unlockSlowTitle }}</h1>
          <p>{{ lang.t().unlockSlowBody }}</p>
          <button type="button" class="q-btn q-btn-outline" (click)="retry()">
            {{ lang.t().upgradeRestore }}
          </button>
        } @else {
          <span class="emoji spin">⏳</span>
          <h1>{{ lang.t().unlockingTitle }}</h1>
          <p>{{ lang.t().unlockingBody }}</p>
        }
      </div>
    </div>
  `,
  styles: `
    .top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
    }
    .panel {
      max-width: 480px;
      margin: 3rem auto 0;
      padding: 2rem 1.5rem;
      display: grid;
      gap: 0.85rem;
      justify-items: center;
      text-align: center;
      border: 2px solid transparent;
      border-radius: 24px;
      background:
        linear-gradient(var(--q-card), var(--q-card)) padding-box,
        var(--q-gradient) border-box;
      box-shadow: var(--q-shadow);
    }
    .emoji {
      font-size: 2.75rem;
      line-height: 1;
    }
    .spin {
      animation: pulse 1.4s ease-in-out infinite;
    }
    @keyframes pulse {
      50% {
        opacity: 0.35;
      }
    }
    h1 {
      margin: 0;
      font-size: clamp(1.5rem, 3vw, 2rem);
      font-weight: 900;
      color: var(--q-navy);
    }
    p {
      margin: 0;
      color: var(--q-muted);
      font-weight: 700;
      line-height: 1.4;
    }
    .q-btn {
      margin-top: 0.5rem;
    }
    @media (prefers-reduced-motion: reduce) {
      .spin {
        animation: none;
      }
    }
  `,
})
export class UnlockedPage implements OnInit, OnDestroy {
  readonly lang = inject(LanguageService);
  readonly ent = inject(EntitlementService);
  private readonly snack = inject(SnackbarService);

  readonly gaveUp = signal(false);
  private timer: number | null = null;
  private attempts = 0;

  ngOnInit(): void {
    this.poll();
  }

  ngOnDestroy(): void {
    if (this.timer !== null) window.clearTimeout(this.timer);
  }

  async retry(): Promise<void> {
    this.attempts = 0;
    this.gaveUp.set(false);
    if (!(await this.ent.refresh())) {
      this.gaveUp.set(true);
      this.snack.error(this.lang.t().proNotFound);
    }
  }

  private poll(): void {
    this.timer = window.setTimeout(async () => {
      if (await this.ent.refresh()) return;
      if (++this.attempts >= POLL_ATTEMPTS) {
        this.gaveUp.set(true);
        return;
      }
      this.poll();
    }, POLL_MS);
  }
}
