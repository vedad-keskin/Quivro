import { Component, inject } from '@angular/core';
import { LanguageService } from '../core/language.service';
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
  `,
})
export class SettingsChips {
  readonly lang = inject(LanguageService);
  readonly theme = inject(ThemeService);
}
