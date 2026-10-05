import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { EntitlementService } from '../core/entitlement.service';
import { PRO_PERKS, PRO_PRICE } from '../core/entitlements';
import { LanguageService } from '../core/language.service';
import { SnackbarService } from '../core/snackbar.service';
import { UpgradeDialogService } from './upgrade-dialog.service';

/** Global overlay, opened from anywhere a locked control is clicked. */
@Component({
  selector: 'app-upgrade-dialog',
  imports: [],
  template: `
    @if (dialog.open()) {
      <div class="q-show modal-backdrop" (click)="dialog.close()">
        <div
          class="modal card"
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
            <h2 class="show-title">{{ lang.t().upgradeTitle }}</h2>
            <p class="blurb">{{ lang.t().upgradeBlurb }}</p>

            <ul class="perks">
              @for (p of perks; track p.key) {
                <li>
                  <span class="perk-mark" [style.--accent]="p.accent" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="13" height="13"><path d="M5 12.5 L10 17.5 L19 7" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" /></svg>
                  </span>
                  {{ lang.t()[p.key] }}
                </li>
              }
            </ul>

            @if (auth.user()) {
              <button type="button" class="go buy" [disabled]="busy()" (click)="buy()">
                {{ lang.t().upgradeBuy }} {{ price }}
              </button>
            } @else {
              <button type="button" class="go buy" [disabled]="busy()" (click)="signIn()">
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
    .modal-backdrop {
      backdrop-filter: blur(3px);
    }
    .card {
      gap: 0;
      padding: 0 0 0.85rem;
      overflow: visible;
    }
    .banner-wrap {
      overflow: hidden;
      border-bottom: 3px solid var(--ink);
      border-radius: 15px 15px 0 0;
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
      top: 0.55rem;
      right: 0.6rem;
      z-index: 2;
      width: 32px;
      height: 32px;
      display: grid;
      place-items: center;
      border: 3px solid var(--ink);
      border-radius: 9px;
      background: var(--q-card);
      color: var(--q-navy);
      font-size: 1.3rem;
      font-weight: 900;
      line-height: 1;
      cursor: pointer;
      box-shadow: 0 3px 0 var(--ink);
      transition: transform 0.1s ease, box-shadow 0.1s ease;
    }
    .x:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 0 var(--ink);
    }
    .x:active {
      transform: translateY(3px);
      box-shadow: 0 0 0 var(--ink);
    }
    .x:focus-visible {
      outline: 3px solid var(--q-blue);
      outline-offset: 2px;
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
      font-size: 1.7rem;
    }
    .blurb {
      margin: 0;
      color: var(--q-muted);
      font-weight: 700;
      line-height: 1.35;
    }
    .perks {
      margin: 0.35rem 0 0.6rem;
    }
    .buy {
      margin-top: 0.25rem;
      font-size: 1.3rem;
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
    .restore:disabled {
      opacity: 0.6;
      cursor: default;
    }
    .powered {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      gap: 0.45rem;
      margin-top: 0.1rem;
      white-space: nowrap;
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
  readonly perks = PRO_PERKS;
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
