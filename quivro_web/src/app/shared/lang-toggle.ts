import { Component, inject } from '@angular/core';
import { LanguageService } from '../core/language.service';

@Component({
  selector: 'app-lang-toggle',
  imports: [],
  template: `
    <button
      type="button"
      class="lang-toggle"
      (click)="lang.toggle()"
      [attr.aria-label]="lang.t().language"
    >
      <img
        [src]="lang.lang() === 'en' ? '/flags/en.png' : '/flags/bs.png'"
        width="28"
        height="20"
        alt=""
      />
      <span>{{ lang.lang() === 'en' ? 'EN' : 'BS' }}</span>
    </button>
  `,
  styles: `
    .lang-toggle {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      border: 2px solid var(--q-border);
      background: #fff;
      border-radius: 999px;
      padding: 0.35rem 0.75rem;
      font-weight: 800;
      cursor: pointer;
    }
    img {
      border-radius: 3px;
      object-fit: cover;
    }
  `,
})
export class LangToggle {
  readonly lang = inject(LanguageService);
}
