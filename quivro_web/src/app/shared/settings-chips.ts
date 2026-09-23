import { Component, ElementRef, HostListener, inject, signal, viewChild } from '@angular/core';
import { AuthService } from '../core/auth.service';
import { EntitlementService } from '../core/entitlement.service';
import { FirebaseService } from '../core/firebase.service';
import { LanguageService } from '../core/language.service';
import { SnackbarService } from '../core/snackbar.service';
import { ThemeService } from '../core/theme.service';
import { UpgradeDialogService } from './upgrade-dialog.service';

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
          <div class="account" #account>
            <button
              type="button"
              class="chip"
              (click)="toggleMenu()"
              [attr.aria-expanded]="menuOpen()"
              [attr.aria-haspopup]="'menu'"
              [attr.aria-label]="lang.t().account"
            >
              @if (user.photoURL) {
                <img class="avatar" [src]="user.photoURL" width="18" height="18" alt="" />
              }
              <span class="label">{{ firstName(user.displayName) }}</span>
              <span class="caret" aria-hidden="true"></span>
            </button>
            @if (menuOpen()) {
              <div class="menu" role="menu">
                @if (user.email) {
                  <p class="email">{{ user.email }}</p>
                }
                @if (ent.isPro()) {
                  <span class="pro">{{ lang.t().proName }}</span>
                } @else {
                  <button type="button" class="row" role="menuitem" (click)="unlock()">
                    {{ lang.t().upgradeTitle }}
                  </button>
                }
                <button type="button" class="row" role="menuitem" (click)="restore()">
                  {{ lang.t().upgradeRestore }}
                </button>
                <button type="button" class="row out" role="menuitem" (click)="signOut()">
                  {{ lang.t().signOut }}
                </button>
              </div>
            }
          </div>
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
    .caret {
      width: 0;
      height: 0;
      border-left: 4px solid transparent;
      border-right: 4px solid transparent;
      border-top: 5px solid currentColor;
      opacity: 0.65;
    }
    .account {
      position: relative;
    }
    .menu {
      position: absolute;
      top: calc(100% + 0.45rem);
      right: 0;
      z-index: 40;
      width: min(260px, 72vw);
      display: grid;
      gap: 0.35rem;
      padding: 0.75rem;
      text-align: left;
      border: 2px solid transparent;
      border-radius: 18px;
      background:
        linear-gradient(var(--q-card), var(--q-card)) padding-box,
        var(--q-gradient) border-box;
      box-shadow: var(--q-shadow);
    }
    .email {
      margin: 0 0.15rem 0.2rem;
      color: var(--q-muted);
      font-size: 0.75rem;
      font-weight: 700;
      line-height: 1.3;
      overflow-wrap: anywhere;
    }
    .pro {
      justify-self: start;
      margin: 0.1rem 0.15rem 0.25rem;
      padding: 0.18rem 0.55rem;
      border-radius: 999px;
      background: var(--q-gradient);
      color: #fff;
      font-size: 0.68rem;
      font-weight: 900;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    .row {
      border: none;
      background: none;
      color: var(--q-navy);
      text-align: left;
      font-weight: 800;
      font-size: 0.85rem;
      padding: 0.45rem 0.35rem;
      border-radius: 10px;
      cursor: pointer;
    }
    .row:hover {
      background: color-mix(in srgb, var(--q-blue) 12%, transparent);
    }
    .row.out {
      color: var(--q-muted);
    }
  `,
})
export class SettingsChips {
  readonly lang = inject(LanguageService);
  readonly theme = inject(ThemeService);
  readonly auth = inject(AuthService);
  readonly firebase = inject(FirebaseService);
  readonly ent = inject(EntitlementService);
  private readonly upgrade = inject(UpgradeDialogService);
  private readonly snack = inject(SnackbarService);
  private readonly account = viewChild<ElementRef<HTMLElement>>('account');

  readonly menuOpen = signal(false);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.menuOpen()) return;
    const root = this.account()?.nativeElement;
    if (!root?.contains(event.target as Node)) this.menuOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.menuOpen.set(false);
  }

  firstName(displayName: string | null): string {
    return displayName?.trim().split(/\s+/)[0] || this.lang.t().account;
  }

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  unlock(): void {
    this.menuOpen.set(false);
    this.upgrade.show();
  }

  async restore(): Promise<void> {
    this.menuOpen.set(false);
    if (await this.ent.refresh()) this.snack.success(this.lang.t().proRestored);
    else this.snack.error(this.lang.t().proNotFound);
  }

  async signOut(): Promise<void> {
    this.menuOpen.set(false);
    await this.auth.signOut();
  }

  async signIn(): Promise<void> {
    if ((await this.auth.signIn()) === 'failed') {
      this.snack.error(this.lang.t().signInFailed);
    }
  }
}
