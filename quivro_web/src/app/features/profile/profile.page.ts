import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/auth.service';
import { EntitlementService } from '../../core/entitlement.service';
import { FirebaseService } from '../../core/firebase.service';
import { LanguageService } from '../../core/language.service';
import { SnackbarService } from '../../core/snackbar.service';
import { UpgradeDialogService } from '../../shared/upgrade-dialog.service';
import { SettingsChips } from '../../shared/settings-chips';
import { StudioFooter } from '../../shared/studio-footer';

const STAT_KEYS = ['gamesHosted', 'questionsPlayed'] as const;

/** Signed-in account: photo, name, email, and Pro. */
@Component({
  selector: 'app-profile',
  imports: [RouterLink, SettingsChips, StudioFooter],
  template: `
    <div class="q-page profile">
      <header>
        <a routerLink="/" class="back">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
               stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          {{ lang.t().home }}
        </a>
        <app-settings-chips />
      </header>

      @if (auth.user(); as user) {
        <section class="hero">
          <div class="ring">
            @if (user.photoURL) {
              <img [src]="user.photoURL" alt="" />
            } @else {
              <span class="fallback">{{ initial(user.displayName || user.email) }}</span>
            }
          </div>
          <h1>{{ user.displayName || lang.t().account }}</h1>
          @if (user.email) {
            <p class="email">{{ user.email }}</p>
          }

          @if (ent.isPro()) {
            <img class="badge" src="/brand/pro_badge.png" alt="" />
            <p class="tier">{{ lang.t().proName }}</p>
            @if (ent.purchaseDate(); as purchased) {
              <p class="when">{{ lang.t().purchasedOn }} {{ formatDate(purchased) }}</p>
            }
            @if (billingUrl) {
              <a class="manage" [href]="billingUrl" target="_blank" rel="noopener noreferrer">
                {{ lang.t().manageSubscription }}
              </a>
            }
          } @else {
            <p class="blurb">{{ lang.t().upgradeBlurb }}</p>
            <button type="button" class="q-btn q-btn-outline" (click)="openUpgrade()">
              {{ lang.t().upgradeTitle }}
            </button>
          }

          @if (stats().length) {
            <div class="stats">
              @for (stat of stats(); track stat.key) {
                <div>
                  <span class="stat-value">{{ stat.value }}</span>
                  <span class="stat-label">{{ stat.label }}</span>
                </div>
              }
            </div>
          }

          <div class="actions">
            <button type="button" class="text" (click)="restore()">
              {{ lang.t().upgradeRestore }}
            </button>
            <button type="button" class="text out" (click)="signOut()">
              {{ lang.t().signOut }}
            </button>
          </div>
        </section>
      }

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
    .back {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
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
      gap: 0.35rem;
      padding: 1rem 0 2rem;
    }
    .ring {
      width: 112px;
      height: 112px;
      margin-bottom: 0.65rem;
      padding: 3px;
      border-radius: 999px;
      background: var(--q-gradient);
    }
    .ring img,
    .fallback {
      width: 100%;
      height: 100%;
      border-radius: 999px;
      object-fit: cover;
    }
    .fallback {
      display: grid;
      place-items: center;
      background: var(--q-card);
      color: var(--q-navy);
      font-weight: 900;
      font-size: 2rem;
    }
    h1 {
      margin: 0;
      font-size: clamp(1.5rem, 3vw, 1.85rem);
      font-weight: 900;
      color: var(--q-navy);
    }
    .email,
    .when,
    .blurb {
      margin: 0;
      color: var(--q-muted);
      font-weight: 700;
    }
    .email {
      font-size: 0.92rem;
    }
    .badge {
      width: 72px;
      height: 72px;
      margin: 1.1rem 0 0.15rem;
    }
    .tier {
      margin: 0;
      font-weight: 900;
      font-size: 1.05rem;
      color: var(--q-navy);
    }
    .when {
      font-size: 0.82rem;
    }
    .manage {
      margin-top: 0.35rem;
      font-weight: 800;
      font-size: 0.82rem;
      color: var(--q-blue);
    }
    .manage:hover {
      text-decoration: underline;
    }
    .blurb {
      max-width: 22rem;
      margin-top: 0.85rem;
      font-size: 0.9rem;
      line-height: 1.4;
    }
    .q-btn {
      margin-top: 0.65rem;
    }
    .stats {
      display: flex;
      gap: 1.75rem;
      margin-top: 1.25rem;
    }
    .stats div {
      display: grid;
      gap: 0.1rem;
    }
    .stat-value {
      font-weight: 900;
      font-size: 1.35rem;
      color: var(--q-navy);
    }
    .stat-label {
      font-weight: 700;
      font-size: 0.72rem;
      color: var(--q-muted);
    }
    .actions {
      display: flex;
      gap: 1.25rem;
      margin-top: 1.5rem;
    }
    .text {
      border: none;
      background: none;
      padding: 0;
      font-weight: 800;
      font-size: 0.85rem;
      color: var(--q-blue);
      cursor: pointer;
    }
    .text.out {
      color: var(--q-muted);
    }
    .text:hover {
      text-decoration: underline;
    }
  `,
})
export class ProfilePage {
  readonly auth = inject(AuthService);
  readonly ent = inject(EntitlementService);
  readonly lang = inject(LanguageService);
  private readonly firebase = inject(FirebaseService);
  private readonly snack = inject(SnackbarService);
  private readonly upgrade = inject(UpgradeDialogService);
  private readonly router = inject(Router);

  readonly billingUrl = billingPortal();

  private readonly firestoreData = signal<Record<string, string | number> | null>(null);
  readonly stats = computed(() => {
    const data = this.firestoreData();
    if (!data) return [];
    const t = this.lang.t();
    return STAT_KEYS.flatMap((key) => {
      const value = data[key];
      if (typeof value !== 'string' && typeof value !== 'number') return [];
      return [{ key, value, label: t[key] }];
    });
  });

  constructor() {
    effect(() => {
      const ready = this.auth.ready();
      const uid = this.auth.uid();
      if (!ready) return;
      if (uid) {
        this.sawUser = true;
        untracked(() => void this.loadFirestoreData(uid));
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
    await this.auth.signOut();
    void this.router.navigateByUrl('/');
  }

  private async loadFirestoreData(uid: string): Promise<void> {
    this.firestoreData.set(null);
    if (!this.firebase.app) return;
    try {
      const { getFirestore, doc, getDoc } = await import('firebase/firestore');
      const snapshot = await getDoc(doc(getFirestore(this.firebase.app), 'users', uid));
      if (this.auth.uid() !== uid || !snapshot.exists()) return;
      const data = snapshot.data();
      const display: Record<string, string | number> = {};
      for (const key of STAT_KEYS) {
        const value = data[key];
        if (typeof value === 'string' || typeof value === 'number') display[key] = value;
      }
      if (Object.keys(display).length > 0) this.firestoreData.set(display);
    } catch {
      // No user doc or Firestore unavailable.
    }
  }
}

function billingPortal(): string | null {
  const slug = environment.lemonSqueezy.storeSlug;
  if (!slug || slug.includes('YOUR_')) return null;
  return `https://${slug}.lemonsqueezy.com/billing`;
}
