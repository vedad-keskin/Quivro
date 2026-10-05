import { Component, HostListener, inject, input, output } from '@angular/core';
import { EntitlementService } from '../core/entitlement.service';
import { LanguageService } from '../core/language.service';

/** Asks before signing out. Used by the account menu and the profile page. */
@Component({
  selector: 'app-sign-out-confirm',
  template: `
    @if (open()) {
      <div class="q-show modal-backdrop" (click)="cancelled.emit()">
        <div
          class="modal"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="sign-out-title"
          (click)="$event.stopPropagation()"
        >
          <h2 id="sign-out-title" class="show-title">{{ lang.t().signOutConfirmTitle }}</h2>
          <p class="body">{{ lang.t().signOutConfirmBody }}</p>
          @if (ent.isPro()) {
            <p class="note">{{ lang.t().signOutConfirmProWarning }}</p>
          }
          <div class="modal-actions">
            <button type="button" class="key-btn" (click)="cancelled.emit()">
              {{ lang.t().cancel }}
            </button>
            <button type="button" class="go go-sm go-danger" (click)="confirmed.emit()">
              {{ lang.t().signOut }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    h2 {
      font-size: 1.6rem;
    }
    .body {
      margin: 0;
      color: var(--q-muted);
      font-weight: 700;
      line-height: 1.4;
    }
    .note {
      margin: 0;
      padding: 0.55rem 0.75rem;
      border: 3px solid var(--ink);
      border-radius: 12px;
      background: var(--bulb);
      color: #1a1530;
      font-weight: 800;
      font-size: 0.88rem;
      transform: rotate(-1deg);
    }
  `,
})
export class SignOutConfirm {
  readonly lang = inject(LanguageService);
  readonly ent = inject(EntitlementService);
  readonly open = input(false);
  readonly cancelled = output<void>();
  readonly confirmed = output<void>();

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open()) this.cancelled.emit();
  }
}
