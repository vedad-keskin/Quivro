import { Component, inject, signal } from '@angular/core';
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

          <span class="badge">{{ lang.t().proName }}</span>
          <h2>{{ lang.t().upgradeTitle }}</h2>
          <p class="blurb">{{ lang.t().upgradeBlurb }}</p>

          <ul class="perks">
            <li>{{ lang.t().perkCategories }}</li>
            <li>{{ lang.t().perkImages }}</li>
            <li>{{ lang.t().perkLength }}</li>
            <li>{{ lang.t().perkScoring }}</li>
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
      width: min(420px, 100%);
      display: grid;
      gap: 0.6rem;
      padding: 1.6rem 1.5rem 1.35rem;
      border: 2px solid transparent;
      border-radius: 24px;
      background:
        linear-gradient(var(--q-card), var(--q-card)) padding-box,
        var(--q-gradient) border-box;
      box-shadow: var(--q-shadow);
    }
    .x {
      position: absolute;
      top: 0.6rem;
      right: 0.85rem;
      border: none;
      background: none;
      color: var(--q-muted);
      font-size: 1.6rem;
      line-height: 1;
      cursor: pointer;
    }
    .badge {
      justify-self: start;
      padding: 0.22rem 0.6rem;
      border-radius: 999px;
      background: var(--q-gradient);
      color: #fff;
      font-size: 0.7rem;
      font-weight: 900;
      letter-spacing: 0.08em;
      text-transform: uppercase;
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
  `,
})
export class UpgradeDialog {
  readonly dialog = inject(UpgradeDialogService);
  readonly lang = inject(LanguageService);
  readonly auth = inject(AuthService);
  private readonly ent = inject(EntitlementService);
  private readonly snack = inject(SnackbarService);

  readonly price = PRO_PRICE;
  readonly busy = signal(false);

  async signIn(): Promise<void> {
    this.busy.set(true);
    try {
      const result = await this.auth.signIn();
      if (result === 'failed') {
        this.snack.error(this.lang.t().signInFailed);
        return;
      }
      // A returning customer may already own Pro on this account.
      if (result === 'ok' && (await this.ent.refresh())) {
        this.snack.success(this.lang.t().proRestored);
        this.dialog.close();
      }
    } finally {
      this.busy.set(false);
    }
  }

  buy(): void {
    if (!this.ent.openCheckout()) {
      this.snack.error(this.lang.t().upgradeNotReady);
    }
  }

  async restore(): Promise<void> {
    this.busy.set(true);
    try {
      if (!this.auth.user() && (await this.auth.signIn()) !== 'ok') return;
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
}
