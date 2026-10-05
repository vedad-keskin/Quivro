import { Component, effect, inject, signal, untracked } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { EntitlementService } from '../../core/entitlement.service';
import { PRO_PERKS } from '../../core/entitlements';
import { LanguageService } from '../../core/language.service';
import { SnackbarService } from '../../core/snackbar.service';
import { UpgradeDialogService } from '../../shared/upgrade-dialog.service';
import { SettingsChips } from '../../shared/settings-chips';
import { SignOutConfirm } from '../../shared/sign-out-confirm';
import { StudioFooter } from '../../shared/studio-footer';

/** Signed-in account as a player card: photo, name, and Pro perks. */
@Component({
  selector: 'app-profile',
  imports: [RouterLink, SettingsChips, SignOutConfirm, StudioFooter],
  template: `
    <div class="q-page q-show profile">
      <header>
        <a routerLink="/" class="back">← {{ lang.t().home }}</a>
        <app-settings-chips />
      </header>

      @if (auth.user(); as user) {
        <section class="hero">
          <div class="stage card spotlight">
            <img
              class="pro-sticker"
              [class.off]="!ent.isPro()"
              src="/brand/pro_badge.png"
              alt=""
            />
            <div class="ring" [class.pro]="ent.isPro()">
              @if (user.photoURL) {
                <img [src]="user.photoURL" alt="" />
              } @else {
                <span class="fallback">{{ initial(user.displayName || user.email) }}</span>
              }
            </div>
            <h1 class="show-title">{{ user.displayName || lang.t().account }}</h1>
            @if (user.email) {
              <p class="email">{{ user.email }}</p>
            }
            <span class="tier" [class.pro]="ent.isPro()">
              {{ ent.isPro() ? lang.t().proName : lang.t().freePlan }}
            </span>
            <p class="meta">
              @if (user.metadata.creationTime; as created) {
                {{ lang.t().memberSince }} {{ formatDate(created) }}
              }
              @if (ent.isPro() && ent.purchaseDate(); as purchased) {
                <span>· {{ lang.t().purchasedOn }} {{ formatDate(purchased) }}</span>
              }
            </p>
          </div>

          <div class="stage perks-card">
            <h2 class="perks-title">{{ lang.t().proName }}</h2>
            <ul class="perks">
              @for (p of perks; track p.key) {
                <li>
                  <span class="perk-mark" [class.off]="!ent.isPro()" [style.--accent]="p.accent" aria-hidden="true">
                    @if (ent.isPro()) {
                      <svg viewBox="0 0 24 24" width="13" height="13"><path d="M5 12.5 L10 17.5 L19 7" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" /></svg>
                    } @else {
                      <svg viewBox="0 0 24 24" width="12" height="12"><rect x="5" y="11" width="14" height="9" rx="2" fill="currentColor" /><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" /></svg>
                    }
                  </span>
                  {{ lang.t()[p.key] }}
                </li>
              }
            </ul>
            @if (!ent.isPro()) {
              <p class="blurb">{{ lang.t().upgradeBlurb }}</p>
              <button type="button" class="go" (click)="openUpgrade()">
                {{ lang.t().upgradeTitle }}
              </button>
            }
          </div>

          <div class="actions">
            <button type="button" class="key-btn" (click)="restore()">
              {{ lang.t().upgradeRestore }}
            </button>
            <button type="button" class="key-btn danger" (click)="confirmOpen.set(true)">
              {{ lang.t().signOut }}
            </button>
          </div>
        </section>
      }

      <app-sign-out-confirm
        [open]="confirmOpen()"
        (cancelled)="confirmOpen.set(false)"
        (confirmed)="signOut()"
      />
      <app-studio-footer />
    </div>
  `,
  styles: `
    .profile {
      display: grid;
      grid-template-rows: auto 1fr auto;
      gap: 1rem;
    }
    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .hero {
      width: min(460px, 100%);
      margin: 0 auto;
      display: grid;
      align-content: center;
      gap: 1.6rem;
      padding: 1rem 0 2rem;
      text-align: center;
    }
    .card {
      display: grid;
      justify-items: center;
      gap: 0.35rem;
      padding: 1.8rem 1.4rem 1.4rem;
    }
    .pro-sticker {
      position: absolute;
      top: -26px;
      right: -22px;
      width: 84px;
      height: 84px;
      transform: rotate(12deg);
      pointer-events: none;
    }
    .pro-sticker.off {
      filter: grayscale(1);
      opacity: 0.45;
    }
    .ring {
      width: 112px;
      height: 112px;
      margin-bottom: 0.5rem;
      padding: 5px;
      border: 3px solid var(--ink);
      border-radius: 50%;
      background: var(--bulb);
      box-shadow: var(--hit);
    }
    .ring.pro {
      background: linear-gradient(135deg, #ffe08a, #f5a300);
      box-shadow:
        var(--hit),
        0 0 22px color-mix(in srgb, #f5c542 70%, transparent);
    }
    .ring img,
    .fallback {
      width: 100%;
      height: 100%;
      border: 3px solid var(--ink);
      border-radius: 50%;
      object-fit: cover;
    }
    .fallback {
      display: grid;
      place-items: center;
      background: var(--q-card);
      color: var(--q-navy);
      font-family: var(--display);
      font-size: 2.4rem;
    }
    h1 {
      font-size: clamp(1.7rem, 4vw, 2.2rem);
    }
    .email,
    .meta,
    .blurb {
      margin: 0;
      color: var(--q-muted);
      font-weight: 700;
    }
    .email {
      font-size: 0.92rem;
    }
    .meta {
      font-size: 0.8rem;
    }
    .tier {
      margin: 0.5rem 0 0.2rem;
      padding: 0.25rem 0.75rem;
      border: 3px solid var(--ink);
      border-radius: 10px;
      background: var(--q-track);
      color: var(--q-navy);
      font-family: var(--display);
      letter-spacing: 0.05em;
      text-transform: uppercase;
      box-shadow: 2px 2px 0 var(--ink);
      transform: rotate(-2deg);
    }
    .tier.pro {
      background: var(--bulb);
      color: #1a1530;
    }
    .perks-card {
      display: grid;
      gap: 0.9rem;
      text-align: left;
    }
    .perks-title {
      margin: 0;
      font-family: var(--display);
      font-weight: 400;
      font-size: 1.2rem;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--q-navy);
    }
    .blurb {
      font-size: 0.88rem;
      line-height: 1.4;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 0.8rem;
    }
    @media (prefers-reduced-motion: reduce) {
      .tier {
        transform: none;
      }
    }
  `,
})
export class ProfilePage {
  readonly auth = inject(AuthService);
  readonly ent = inject(EntitlementService);
  readonly lang = inject(LanguageService);
  private readonly snack = inject(SnackbarService);
  private readonly upgrade = inject(UpgradeDialogService);
  private readonly router = inject(Router);

  readonly perks = PRO_PERKS;
  readonly confirmOpen = signal(false);

  constructor() {
    effect(() => {
      const ready = this.auth.ready();
      const uid = this.auth.uid();
      if (!ready) return;
      if (uid) {
        this.sawUser = true;
        return;
      }
      untracked(() => {
        if (this.sawUser) {
          void this.router.navigateByUrl('/');
          return;
        }
        void this.router.navigate(['/login'], {
          queryParams: { returnUrl: '/profile' },
          replaceUrl: true,
        });
      });
    });
  }

  /** True after this page has shown a signed-in user, so sign-out goes home. */
  private sawUser = false;

  initial(value: string | null | undefined): string {
    return (value || '?')[0].toUpperCase();
  }

  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  }

  openUpgrade(): void {
    this.upgrade.show();
  }

  async restore(): Promise<void> {
    if (await this.ent.refresh()) this.snack.success(this.lang.t().proRestored);
    else this.snack.error(this.lang.t().proNotFound);
  }

  async signOut(): Promise<void> {
    this.confirmOpen.set(false);
    await this.auth.signOut();
    void this.router.navigateByUrl('/');
  }
}
