import { Component, OnDestroy, effect, inject, signal, untracked } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
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
    <div class="q-page stage">
      <header>
        <a routerLink="/" class="back">← {{ lang.t().home }}</a>
        <app-settings-chips />
      </header>

      @if (auth.user()) {
        <section class="hero">
          <img class="badge" src="/brand/pro_badge.png" alt="" />
          @if (ent.isPro()) {
            <h1>{{ lang.t().unlockedTitle }}</h1>
            <p>{{ lang.t().unlockedBody }}</p>
            <a routerLink="/create" class="q-btn q-btn-outline">{{ lang.t().createRound }}</a>
          } @else if (gaveUp()) {
            <h1>{{ lang.t().unlockSlowTitle }}</h1>
            <p>{{ lang.t().unlockSlowBody }}</p>
            <button type="button" class="q-btn q-btn-outline" (click)="retry()">
              {{ lang.t().upgradeRestore }}
            </button>
          } @else {
            <h1 class="wait">{{ lang.t().unlockingTitle }}</h1>
            <p>{{ lang.t().unlockingBody }}</p>
          }
        </section>
      }
    </div>
  `,
  styles: `
    .stage {
      display: grid;
      grid-template-rows: auto 1fr;
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .back {
      font-weight: 800;
      font-size: 0.88rem;
      color: var(--q-muted);
    }
    .back:hover {
      color: var(--q-navy);
    }
    .hero {
      display: grid;
      place-content: center;
      justify-items: center;
      text-align: center;
      gap: 0.75rem;
    }
    .badge {
      width: 112px;
      height: 112px;
      animation: medal-pop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    }
    h1 {
      margin: 0;
      max-width: 18rem;
      font-size: clamp(1.5rem, 3vw, 2rem);
      font-weight: 900;
      color: var(--q-navy);
    }
    .wait {
      animation: pulse 1.4s ease-in-out infinite;
    }
    p {
      margin: 0;
      max-width: 26rem;
      color: var(--q-muted);
      font-weight: 700;
      line-height: 1.4;
    }
    .q-btn {
      margin-top: 0.35rem;
    }
    @keyframes pulse {
      50% {
        opacity: 0.45;
      }
    }
    @keyframes medal-pop {
      from {
        opacity: 0;
        transform: scale(0.3);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .wait,
      .badge {
        animation: none;
      }
    }
  `,
})
export class UnlockedPage implements OnDestroy {
  readonly lang = inject(LanguageService);
  readonly auth = inject(AuthService);
  readonly ent = inject(EntitlementService);
  private readonly snack = inject(SnackbarService);
  private readonly router = inject(Router);

  readonly gaveUp = signal(false);
  private timer: number | null = null;
  private attempts = 0;
  /** Stops a second poll from starting while the first is already running. */
  private watching = false;

  constructor() {
    // Poll only after auth has settled on a real user. A signed-out visit used
    // to spin for a minute against a missing uid.
    effect(() => {
      const ready = this.auth.ready();
      const signedIn = this.auth.user() !== null;
      if (!ready) return;
      if (!signedIn) {
        untracked(() => {
          this.stop();
          void this.router.navigate(['/login'], {
            queryParams: { returnUrl: '/unlocked' },
            replaceUrl: true,
          });
        });
        return;
      }
      untracked(() => void this.watchPurchase());
    });
  }

  ngOnDestroy(): void {
    this.stop();
  }

  async retry(): Promise<void> {
    this.attempts = 0;
    this.gaveUp.set(false);
    if (!(await this.ent.refresh())) {
      this.gaveUp.set(true);
      this.snack.error(this.lang.t().proNotFound);
    }
  }

  private async watchPurchase(): Promise<void> {
    if (this.watching || this.ent.isPro()) return;
    this.watching = true;
    this.attempts = 0;
    this.gaveUp.set(false);
    const active = await this.ent.refresh();
    // Signed out (or destroyed) while the lookup was in flight.
    if (!this.watching || !this.auth.user()) return;
    if (active) {
      this.watching = false;
      return;
    }
    this.schedule();
  }

  private schedule(): void {
    this.clearTimer();
    this.timer = window.setTimeout(async () => {
      this.timer = null;
      if (!this.auth.user()) {
        this.watching = false;
        return;
      }
      if (await this.ent.refresh()) {
        this.watching = false;
        return;
      }
      if (++this.attempts >= POLL_ATTEMPTS) {
        this.gaveUp.set(true);
        this.watching = false;
        return;
      }
      this.schedule();
    }, POLL_MS);
  }

  private stop(): void {
    this.watching = false;
    this.clearTimer();
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      window.clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
