import { Component, effect, inject, signal, untracked } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { EntitlementService } from '../../core/entitlement.service';
import { LanguageService } from '../../core/language.service';
import { SnackbarService } from '../../core/snackbar.service';
import { SettingsChips } from '../../shared/settings-chips';
import { StudioFooter } from '../../shared/studio-footer';
import { UpgradeDialogService } from '../../shared/upgrade-dialog.service';

/** Full-page Google sign-in. Replaces the old modal. */
@Component({
  selector: 'app-login',
  imports: [RouterLink, SettingsChips, StudioFooter],
  template: `
    <div class="q-page login">
      <header>
        <app-settings-chips />
      </header>

      @if (auth.ready() && !auth.user()) {
        <section class="hero">
          <div class="brand">
            <img class="logo" src="/logo/logo.png" alt="Quivro" />
            <div class="q-brand-line"></div>
          </div>
          <h1>{{ claiming ? lang.t().claimTitle : lang.t().loginTitle }}</h1>
          <p class="copy">{{ claiming ? lang.t().claimBody : lang.t().loginSubtitle }}</p>

          <button
            type="button"
            class="q-btn q-btn-outline google"
            [disabled]="busy()"
            (click)="signInGoogle()"
          >
            <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true">
              <path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-3.2-.4-4.7H24v8.9h11.8c-.5 2.7-2 5.1-4.4 6.7v5.5h7.1c4.2-3.8 6.6-9.5 6.6-16.4z"/>
              <path fill="#34A853" d="M24 46c5.9 0 10.9-2 14.5-5.3l-7.1-5.5c-2 1.3-4.5 2.1-7.4 2.1-5.7 0-10.5-3.8-12.2-9H4.5v5.7C8.1 41.3 15.5 46 24 46z"/>
              <path fill="#FBBC05" d="M11.8 28.3c-.4-1.3-.7-2.7-.7-4.3s.3-3 .7-4.3v-5.7H4.5A22 22 0 0 0 2 24c0 3.6.9 6.9 2.5 9.9l7.3-5.6z"/>
              <path fill="#EA4335" d="M24 10.8c3.2 0 6.1 1.1 8.4 3.3l6.3-6.3C34.9 4.2 29.9 2 24 2 15.5 2 8.1 6.7 4.5 13.7l7.3 5.7c1.7-5.2 6.5-9 12.2-9z"/>
            </svg>
            {{ lang.t().loginGoogle }}
          </button>

          <p class="legal">
            <a routerLink="/terms">{{ lang.t().terms }}</a>
            <span aria-hidden="true">·</span>
            <a routerLink="/privacy">{{ lang.t().privacy }}</a>
          </p>
        </section>
      }

      <app-studio-footer />
    </div>
  `,
  styles: `
    .login {
      display: grid;
      grid-template-rows: auto 1fr auto;
      gap: 1rem;
    }
    header {
      display: flex;
      justify-content: flex-end;
    }
    .hero {
      display: grid;
      place-content: center;
      justify-items: center;
      text-align: center;
      gap: 0.85rem;
    }
    .brand {
      display: grid;
      justify-items: center;
    }
    .logo {
      width: min(240px, 68vw);
      display: block;
    }
    :host-context(html[data-theme='dark']) .logo {
      filter: invert(1) hue-rotate(180deg) brightness(1.08) saturate(1.05);
    }
    h1 {
      margin: 0.35rem 0 0;
      font-size: clamp(1.35rem, 3vw, 1.75rem);
      font-weight: 900;
      color: var(--q-navy);
      max-width: 18rem;
    }
    .copy {
      margin: 0;
      max-width: 26rem;
      color: var(--q-muted);
      font-weight: 700;
      font-size: 0.95rem;
      line-height: 1.4;
    }
    .google {
      display: inline-flex;
      align-items: center;
      gap: 0.55rem;
      margin-top: 0.35rem;
    }
    .google svg {
      flex-shrink: 0;
    }
    .legal {
      margin: 0.15rem 0 0;
      display: flex;
      gap: 0.45rem;
      color: var(--q-muted);
      font-size: 0.75rem;
      font-weight: 700;
    }
    .legal a {
      text-decoration: underline;
      text-underline-offset: 2px;
    }
    .legal a:hover {
      color: var(--q-navy);
    }
  `,
})
export class LoginPage {
  readonly auth = inject(AuthService);
  readonly lang = inject(LanguageService);
  private readonly ent = inject(EntitlementService);
  private readonly snack = inject(SnackbarService);
  private readonly upgrade = inject(UpgradeDialogService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly busy = signal(false);
  /** Set while this page itself is signing in, so the redirect effect does not race it. */
  private signingIn = false;

  readonly returnUrl = safeReturn(this.route.snapshot.queryParamMap.get('returnUrl'));
  readonly claiming = this.returnUrl.startsWith('/unlocked');
  private readonly resumeUpgrade = this.route.snapshot.queryParamMap.get('resume') === 'upgrade';

  constructor() {
    effect(() => {
      if (!this.auth.ready() || !this.auth.user()) return;
      untracked(() => {
        if (this.signingIn) return;
        void this.router.navigateByUrl(this.returnUrl);
      });
    });
  }

  async signInGoogle(): Promise<void> {
    this.signingIn = true;
    this.busy.set(true);
    try {
      const result = await this.auth.signIn();
      if (result === 'failed') {
        this.snack.error(this.lang.t().signInFailed);
        return;
      }
      if (result !== 'ok') return;
      const pro = await this.ent.refresh();
      if (pro) this.snack.success(this.lang.t().proRestored);
      else if (this.resumeUpgrade) this.upgrade.show();
      await this.router.navigateByUrl(this.returnUrl);
    } finally {
      this.signingIn = false;
      this.busy.set(false);
    }
  }
}

function safeReturn(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/login')) return '/';
  return raw;
}
