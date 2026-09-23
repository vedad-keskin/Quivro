import { Component, inject } from '@angular/core';
import { AuthService } from '../core/auth.service';
import { FirebaseService } from '../core/firebase.service';
import { LanguageService } from '../core/language.service';
import { SnackbarService } from '../core/snackbar.service';
import { ThemeService } from '../core/theme.service';

/** Mobile-styled language + day/night chips (tap-to-toggle, no sheet). */
@Component({
  selector: 'app-settings-chips',
  imports: [],
  template: `
    <div class="chips">
      <button
        type="button"
        class="chip"
        (click)="lang.toggle()"
        [attr.aria-label]="lang.t().language"
      >
        <img
          class="flag"
          [src]="lang.lang() === 'en' ? '/flags/en.png' : '/flags/bs.png'"
          width="21"
          height="14"
          alt=""
        />
        <span class="label">{{ lang.lang() === 'en' ? 'EN' : 'BS' }}</span>
      </button>

      <button
        type="button"
        class="chip"
        (click)="theme.toggle()"
        [attr.aria-label]="
          theme.theme() === 'dark' ? lang.t().themeNight : lang.t().themeDay
        "
      >
        @if (theme.theme() === 'dark') {
          <svg
            class="icon moon"
            viewBox="0 0 24 24"
            width="15"
            height="15"
            aria-hidden="true"
          >
            <path
              fill="currentColor"
              d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
            />
          </svg>
        } @else {
          <svg
            class="icon sun"
            viewBox="0 0 24 24"
            width="15"
            height="15"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="4" />
            <path
              d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
            />
          </svg>
        }
        <span class="label">{{
          theme.theme() === 'dark' ? lang.t().themeNight : lang.t().themeDay
        }}</span>
      </button>

      @if (firebase.configured && auth.ready()) {
        @if (auth.user(); as user) {
          <button
            type="button"
            class="chip"
            (click)="auth.signOut()"
            [attr.aria-label]="lang.t().signOut"
            [title]="lang.t().signedInAs + ' ' + (user.email ?? '')"
          >
            @if (user.photoURL) {
              <img class="avatar" [src]="user.photoURL" width="18" height="18" alt="" />
            }
            <span class="label">{{ firstName(user.displayName) }}</span>
          </button>
        } @else {
          <button
            type="button"
            class="chip"
            (click)="signIn()"
            [attr.aria-label]="lang.t().signIn"
          >
            <svg class="icon" viewBox="0 0 48 48" width="15" height="15" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M45.1 24.5c0-1.6-.1-3.2-.4-4.7H24v8.9h11.8c-.5 2.7-2 5.1-4.4 6.7v5.5h7.1c4.2-3.8 6.6-9.5 6.6-16.4z"
              />
              <path
                fill="#34A853"
                d="M24 46c5.9 0 10.9-2 14.5-5.3l-7.1-5.5c-2 1.3-4.5 2.1-7.4 2.1-5.7 0-10.5-3.8-12.2-9H4.5v5.7C8.1 41.3 15.5 46 24 46z"
              />
              <path
                fill="#FBBC05"
                d="M11.8 28.3c-.4-1.3-.7-2.7-.7-4.3s.3-3 .7-4.3v-5.7H4.5A22 22 0 0 0 2 24c0 3.6.9 6.9 2.5 9.9l7.3-5.6z"
              />
              <path
                fill="#EA4335"
                d="M24 10.8c3.2 0 6.1 1.1 8.4 3.3l6.3-6.3C34.9 4.2 29.9 2 24 2 15.5 2 8.1 6.7 4.5 13.7l7.3 5.7c1.7-5.2 6.5-9 12.2-9z"
              />
            </svg>
            <span class="label">{{ lang.t().signIn }}</span>
          </button>
        }
      }
    </div>
  `,
  styles: `
    .chips {
      display: inline-flex;
      align-items: center;
      gap: 10px;
    }
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      border: 2px solid var(--q-border);
      background: var(--q-card);
      color: var(--q-navy);
      border-radius: 999px;
      padding: 0.4rem 0.75rem;
      font-size: 0.8125rem;
      font-weight: 800;
      cursor: pointer;
      transition:
        background-color 0.3s ease,
        border-color 0.3s ease,
        color 0.3s ease;
    }
    .chip:hover {
      border-color: var(--q-blue);
    }
    .flag {
      width: 21px;
      height: 14px;
      border-radius: 3px;
      object-fit: cover;
      flex-shrink: 0;
    }
    .label {
      letter-spacing: 0.02em;
      line-height: 1;
    }
    .icon {
      flex-shrink: 0;
      display: block;
      overflow: visible;
      width: 15px;
      height: 15px;
    }
    .icon.sun {
      color: #f59e0b;
    }
    .icon.moon {
      color: #93c5fd;
    }
    .avatar {
      width: 18px;
      height: 18px;
      border-radius: 999px;
      object-fit: cover;
      flex-shrink: 0;
    }
  `,
})
export class SettingsChips {
  readonly lang = inject(LanguageService);
  readonly theme = inject(ThemeService);
  readonly auth = inject(AuthService);
  readonly firebase = inject(FirebaseService);
  private readonly snack = inject(SnackbarService);

  firstName(displayName: string | null): string {
    return displayName?.trim().split(/\s+/)[0] || this.lang.t().signOut;
  }

  async signIn(): Promise<void> {
    if ((await this.auth.signIn()) === 'failed') {
      this.snack.error(this.lang.t().signInFailed);
    }
  }
}
