import { Component, OnDestroy, effect, inject, signal, untracked } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { EntitlementService } from '../../core/entitlement.service';
import { LanguageService } from '../../core/language.service';
import { SnackbarService } from '../../core/snackbar.service';
import { SettingsChips } from '../../shared/settings-chips';
import { StudioFooter } from '../../shared/studio-footer';

const POLL_MS = 2000;
const POLL_ATTEMPTS = 30;

/**
 * Where Lemon Squeezy sends the buyer after checkout. The webhook usually lands
 * before the redirect does, but polling covers the case where it does not.
 */
@Component({
  selector: 'app-unlocked',
  imports: [RouterLink, SettingsChips, StudioFooter],
  template: `
    <div class="q-page q-show unlock">
      <header>
        <a routerLink="/" class="back">← {{ lang.t().home }}</a>
        <app-settings-chips />
      </header>

      @if (auth.user()) {
        <section class="hero">
          <div class="stage spotlight">
            <span class="spark s1" aria-hidden="true"></span>
            <span class="spark s2" aria-hidden="true"></span>
            <span class="spark s3" aria-hidden="true"></span>
            <img class="badge" src="/brand/pro_badge.png" alt="" />
            @if (ent.isPro()) {
              <h1 class="show-title">{{ lang.t().unlockedTitle }}</h1>
              <p>{{ lang.t().unlockedBody }}</p>
            } @else if (gaveUp()) {
              <h1 class="show-title">{{ lang.t().unlockSlowTitle }}</h1>
              <p>{{ lang.t().unlockSlowBody }}</p>
            } @else {
              <h1 class="show-title wait">{{ lang.t().unlockingTitle }}</h1>
              <p>{{ lang.t().unlockingBody }}</p>
            }
          </div>
          @if (ent.isPro()) {
            <a routerLink="/create" class="go start">
              {{ lang.t().createRound }}
              <span class="go-arrow" aria-hidden="true">▶</span>
            </a>
          } @else if (gaveUp()) {
            <button type="button" class="key-btn" (click)="retry()">
              {{ lang.t().upgradeRestore }}
            </button>
          }
        </section>
      }

      <app-studio-footer />
    </div>
  `,
  styles: `
    .unlock {
      display: grid;
      grid-template-rows: auto 1fr auto;
      gap: 1rem;
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .hero {
      display: grid;
      place-content: center;
      justify-items: center;
      text-align: center;
      gap: 1.1rem;
    }
    .spotlight {
      width: min(420px, 100%);
      display: grid;
      justify-items: center;
      gap: 0.7rem;
      padding: 2.4rem 1.5rem 1.8rem;
    }
    .badge {
      width: 112px;
      height: 112px;
      animation: medal-pop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    }
    .show-title {
      font-size: clamp(1.8rem, 4vw, 2.4rem);
      max-width: 18rem;
    }
    p {
      margin: 0;
      max-width: 26rem;
      color: var(--q-muted);
      font-weight: 700;
      line-height: 1.4;
    }
    .start {
      width: min(420px, 100%);
    }
    .wait {
      animation: pulse 1.4s ease-in-out infinite;
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
