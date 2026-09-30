import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { EntitlementService } from '../core/entitlement.service';
import { PRO_PRICE } from '../core/entitlements';
import { LanguageService } from '../core/language.service';
import { SnackbarService } from '../core/snackbar.service';
import { UpgradeDialogService } from './upgrade-dialog.service';

/** Global overlay, opened from anywhere a locked control is clicked. */
@Component({
  selector: 'app-upgrade-dialog',
  imports: [],
  template: `
    @if (dialog.open()) {
      <div class="backdrop" (click)="dialog.close()">
        <div
          class="card"
          role="dialog"
          aria-modal="true"
          (click)="$event.stopPropagation()"
        >
          <button type="button" class="x" [attr.aria-label]="lang.t().close" (click)="dialog.close()">
            ×
          </button>
          <span class="pro-badge">
            <img src="/brand/pro_badge.png" width="88" height="88" alt="" />
          </span>
          <div class="banner-wrap">
            <img class="banner" src="/brand/pro_banner.png" alt="" />
          </div>
          <div class="body">
            <h2>{{ lang.t().upgradeTitle }}</h2>
            <p class="blurb">{{ lang.t().upgradeBlurb }}</p>

            <ul class="perks">
              <li>{{ lang.t().perkCategories }}</li>
              <li>{{ lang.t().perkScoring }}</li>
              <li>{{ lang.t().perkPowerUps }}</li>
              <li>{{ lang.t().perkImages }}</li>
              <li>{{ lang.t().perkLength }}</li>
            </ul>

            @if (auth.user()) {
              <button type="button" class="q-btn q-btn-outline buy" [disabled]="busy()" (click)="buy()">
                {{ lang.t().upgradeBuy }} {{ price }}
              </button>
            } @else {
              <button type="button" class="q-btn q-btn-outline buy" [disabled]="busy()" (click)="signIn()">
                {{ lang.t().upgradeSignInFirst }}
              </button>
            }

            <button type="button" class="restore" [disabled]="busy()" (click)="restore()">
              {{ lang.t().upgradeRestore }}
            </button>

            <a
              class="powered"
              href="https://www.lemonsqueezy.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>{{ lang.t().paymentsBy }}</span>
              <img src="/brand/lemon_squeezy.png" alt="Lemon Squeezy" />
            </a>
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    .backdrop {
      position: fixed;
      inset: 0;
      z-index: 200;
      display: grid;
      place-items: center;
      padding: 1rem;
      background: rgba(6, 12, 32, 0.55);
      backdrop-filter: blur(3px);
    }
    .card {
      position: relative;
      overflow: visible;
      width: min(420px, 100%);
      display: grid;
      padding: 0 0 0.85rem;
      border: 2px solid transparent;
      border-radius: 24px;
      background:
        linear-gradient(var(--q-card), var(--q-card)) padding-box,
        var(--q-gradient) border-box;
      box-shadow: var(--q-shadow);
    }
    .banner-wrap {
      overflow: hidden;
      border-radius: 22px 22px 0 0;
    }
    .banner {
      display: block;
      width: 100%;
      height: auto;
    }
    .body {
      display: grid;
      gap: 0.55rem;
      padding: 1.1rem 1.35rem 0;
    }
    .x {
      position: absolute;
      top: 0.45rem;
      right: 0.55rem;
      z-index: 2;
      width: 28px;
      height: 28px;
      display: grid;
      place-items: center;
      border: none;
      border-radius: 999px;
      background: rgba(8, 12, 28, 0.55);
      color: #fff;
      font-size: 1.25rem;
      line-height: 1;
      cursor: pointer;
    }
    .pro-badge {
      position: absolute;
      bottom: -28px;
      right: -16px;
      z-index: 2;
      display: inline-grid;
      width: 88px;
      height: 88px;
      pointer-events: none;
      transform: rotate(12deg);
      transform-origin: center;
      animation: pro-pop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    }
    .pro-badge img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
    }
    @keyframes pro-pop {
      from {
        opacity: 0;
        transform: scale(0.3) rotate(-20deg);
      }
      to {
        opacity: 1;
        transform: scale(1) rotate(12deg);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .pro-badge {
        animation: none;
      }
    }
    h2 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 900;
      color: var(--q-navy);
    }
    .blurb {
      margin: 0;
      color: var(--q-muted);
      font-weight: 700;
      line-height: 1.35;
    }
    .perks {
      margin: 0.35rem 0 0.5rem;
      padding: 0;
      list-style: none;
      display: grid;
      gap: 0.4rem;
    }
    .perks li {
      display: flex;
      gap: 0.5rem;
      font-weight: 800;
      color: var(--q-navy);
      line-height: 1.3;
    }
    .perks li::before {
      content: '✓';
      color: var(--q-blue);
      font-weight: 900;
      flex-shrink: 0;
    }
    .buy {
      width: 100%;
      margin-top: 0.25rem;
    }
    .restore {
      border: none;
      background: none;
      color: var(--q-muted);
      font-weight: 800;
      font-size: 0.85rem;
      cursor: pointer;
      padding: 0.35rem;
    }
    .restore:hover:not(:disabled) {
      color: var(--q-blue);
    }
    .restore:disabled,
    .buy:disabled {
      opacity: 0.6;
      cursor: default;
    }
    .powered {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.3rem;
      margin-top: 0.1rem;
      color: var(--q-muted);
      font-size: 0.7rem;
      font-weight: 700;
      text-decoration: none;
    }
    .powered img {
      height: 32px;
      width: auto;
      display: block;
      filter: invert(1) hue-rotate(180deg);
    }
    :host-context(html[data-theme='dark']) .powered img {
      filter: none;
      mix-blend-mode: screen;
    }
  `,
})
export class UpgradeDialog {
  readonly dialog = inject(UpgradeDialogService);
  readonly lang = inject(LanguageService);
  readonly auth = inject(AuthService);
  private readonly ent = inject(EntitlementService);
  private readonly router = inject(Router);
  private readonly snack = inject(SnackbarService);

  readonly price = PRO_PRICE;
  readonly busy = signal(false);

  signIn(): void {
    this.goToLogin();
  }

  buy(): void {
    if (!this.ent.openCheckout()) {
      this.snack.error(this.lang.t().upgradeNotReady);
    }
  }

  async restore(): Promise<void> {
    this.busy.set(true);
    try {
      if (!this.auth.user()) {
        this.goToLogin();
        return;
      }
      if (await this.ent.refresh()) {
        this.snack.success(this.lang.t().proRestored);
        this.dialog.close();
      } else {
        this.snack.error(this.lang.t().proNotFound);
      }
    } finally {
      this.busy.set(false);
    }
  }

  /** Close first so the upgrade card does not sit on top of the login page. */
  private goToLogin(): void {
    const returnUrl = this.router.url;
    this.dialog.close();
    void this.router.navigate(['/login'], {
      queryParams: { returnUrl, resume: 'upgrade' },
    });
  }
}
